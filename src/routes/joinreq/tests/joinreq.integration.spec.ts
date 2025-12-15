import { Test, TestingModule } from '@nestjs/testing';
import { JoinreqService } from '../services/joinreq.service';
import { JoinreqRepo } from '../repos/joinreq.repo';
import { SharedClassroomRepo } from 'src/shared/repos/shared-classroom.repo';
import { SharedClrStdRepo } from 'src/shared/repos/shared-clrstd.repo';
import { SharedJreqRepo } from 'src/shared/repos/shared-join-req.repo';
import { PrismaService } from 'src/shared/services/prisma.service';
import { JoinRequestStatus, Role } from '@prisma/client';
import { EnumOrder } from 'src/shared/constants/enum-order.constant';
import { JoinreqClassroomSortByEnum } from '../dtos/queries/get-joinreq-classrooms.dto';
import { UnprocessableEntityException } from '@nestjs/common';
import { TestDatabaseHelper } from 'src/shared/utils/test-database.helper';
import { PrismaClient as TestPrismaClient } from '@prisma/test-client';

/**
 * Integration Test - SQLite In-Memory Database
 * 
 * Using real SQLite database with schema.test.prisma
 */

describe('Joinreq Integration Flow - SQLite In-Memory', () => {
    let module: TestingModule;
    let service: JoinreqService;
    let prismaClient: TestPrismaClient;

    let adminId: number;
    let student1Id: number;
    let student2Id: number;
    let classroom1Id: number;
    let classroom2Id: number;

    beforeAll(async () => {
        // Setup SQLite in-memory database
        prismaClient = await TestDatabaseHelper.setup();

        // Seed initial data
        const seedData = await TestDatabaseHelper.seedData(prismaClient);
        adminId = seedData.users.admin.id;
        student1Id = seedData.users.student1.id;
        student2Id = seedData.users.student2.id;
        classroom1Id = seedData.classrooms.classroom1.id;
        classroom2Id = seedData.classrooms.classroom2.id;

        // Create test module with real database
        module = await Test.createTestingModule({
            providers: [
                JoinreqService,
                JoinreqRepo,
                SharedClassroomRepo,
                SharedClrStdRepo,
                SharedJreqRepo,
                {
                    provide: 'IJoinreqRepo',
                    useClass: JoinreqRepo,
                },
                {
                    provide: PrismaService,
                    useValue: prismaClient, // Use real Prisma client
                },
            ],
        }).compile();

        service = module.get<JoinreqService>(JoinreqService);
    });

    afterAll(async () => {
        await TestDatabaseHelper.teardown(prismaClient);
        await module.close();
    });

    beforeEach(async () => {
        // Clear joinRequest and classroomStudent data before each test
        await prismaClient.joinRequest.deleteMany({});
        await prismaClient.classroomStudent.deleteMany({});
    });

    describe('Complete Join Request Flow', () => {
        it('should complete full workflow: Student1 request → Admin approve → Student1 join classroom', async () => {
            // Step 1: Student1 gửi yêu cầu tham gia
            const joinRequest = await service.createJoinRequest(student1Id, { classroomId: classroom1Id });

            expect(joinRequest.status).toBe(JoinRequestStatus.pending);
            expect(joinRequest.studentId).toBe(student1Id);
            expect(joinRequest.classroomId).toBe(classroom1Id);
            expect(joinRequest.requestedAt).toBeInstanceOf(Date);
            expect(joinRequest.handledAt).toBeNull();

            // Step 2: Admin approve yêu cầu
            const approvedRequest = await service.approveJoinRequest(joinRequest.id);

            expect(approvedRequest.status).toBe(JoinRequestStatus.approved);
            expect(approvedRequest.handledAt).toBeInstanceOf(Date);

            // Verify ClassroomStudent được tạo
            const classroomStudent = await prismaClient.classroomStudent.findUnique({
                where: {
                    classroomId_studentId: {
                        classroomId: classroom1Id,
                        studentId: student1Id,
                    },
                },
            });

            expect(classroomStudent).toBeDefined();
            expect(classroomStudent?.deletedAt).toBeNull();

            // Step 3: Verify Student1 đã tham gia classroom
            const viewResult = await service.studentViewClassrooms(student1Id, {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            });

            const joinedClassroom = viewResult.data.find((c) => c.id === classroom1Id);
            expect(joinedClassroom).toBeDefined();
            expect(joinedClassroom?.isJoined).toBe(true);
            expect(joinedClassroom?.joinRequest).toBeNull();
        });

        it('should prevent duplicate join requests', async () => {
            // Tạo join request đầu tiên
            await service.createJoinRequest(student1Id, { classroomId: classroom1Id });

            // Thử tạo duplicate request
            await expect(
                service.createJoinRequest(student1Id, { classroomId: classroom1Id })
            ).rejects.toThrow(UnprocessableEntityException);
            await expect(
                service.createJoinRequest(student1Id, { classroomId: classroom1Id })
            ).rejects.toThrow('Yêu cầu tham gia đã tồn tại');
        });

        it('should prevent joining deleted classroom', async () => {
            // Soft delete classroom2
            await prismaClient.classroom.update({
                where: { id: classroom2Id },
                data: { deletedAt: new Date() },
            });

            await expect(
                service.createJoinRequest(student1Id, { classroomId: classroom2Id })
            ).rejects.toThrow(UnprocessableEntityException);

            // Restore classroom2 for other tests
            await prismaClient.classroom.update({
                where: { id: classroom2Id },
                data: { deletedAt: null },
            });
        });
    });

    describe('Reject Join Request Flow', () => {
        it('should reject join request and allow resending', async () => {
            // Step 1: Student2 gửi yêu cầu
            const joinRequest = await service.createJoinRequest(student2Id, { classroomId: classroom2Id });

            expect(joinRequest.status).toBe(JoinRequestStatus.pending);

            // Step 2: Admin reject yêu cầu
            const rejectedRequest = await service.rejectJoinRequest(joinRequest.id);

            expect(rejectedRequest.status).toBe(JoinRequestStatus.rejected);
            expect(rejectedRequest.handledAt).toBeInstanceOf(Date);

            // Step 3: ClassroomStudent không được tạo
            const classroomStudent = await prismaClient.classroomStudent.findUnique({
                where: {
                    classroomId_studentId: {
                        classroomId: classroom2Id,
                        studentId: student2Id,
                    },
                },
            });

            expect(classroomStudent).toBeNull();

            // Step 4: Student2 có thể gửi lại yêu cầu (reuses same request, updates status to pending)
            const newRequest = await service.createJoinRequest(student2Id, { classroomId: classroom2Id });

            expect(newRequest.status).toBe(JoinRequestStatus.pending);
            expect(newRequest.id).toBe(rejectedRequest.id); // Same request ID, just updated
            expect(newRequest.handledAt).toBeNull(); // handledAt reset to null
        });
    });

    describe('View Classrooms', () => {
        it('should show isJoined = true for joined classrooms', async () => {
            // Student1 join classroom1
            await prismaClient.classroomStudent.create({
                data: {
                    classroomId: classroom1Id,
                    studentId: student1Id,
                },
            });

            const result = await service.studentViewClassrooms(student1Id, {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            });

            const classroom = result.data.find((c) => c.id === classroom1Id);
            expect(classroom).toBeDefined();
            expect(classroom?.isJoined).toBe(true);
        });

        it('should show joinRequest info for pending requests', async () => {
            // Create pending join request
            const joinRequest = await prismaClient.joinRequest.create({
                data: {
                    studentId: student1Id,
                    classroomId: classroom2Id,
                    status: JoinRequestStatus.pending,
                    requestedAt: new Date(),
                },
            });

            const result = await service.studentViewClassrooms(student1Id, {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            });

            const classroom = result.data.find((c) => c.id === classroom2Id);
            expect(classroom).toBeDefined();
            expect(classroom?.joinRequest).toBeDefined();
            expect(classroom?.joinRequest?.status).toBe(JoinRequestStatus.pending);
        });

        it('should show isJoined = false and no joinRequest for classrooms not joined', async () => {
            const result = await service.studentViewClassrooms(student1Id, {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            });

            const classroom = result.data.find((c) => c.id === classroom2Id);
            expect(classroom).toBeDefined();
            expect(classroom?.isJoined).toBe(false);
            expect(classroom?.joinRequest).toBeNull();
        });
    });

    describe('View Joined Classrooms', () => {
        it('should return only joined classrooms', async () => {
            // Student1 join classroom1
            await prismaClient.classroomStudent.create({
                data: {
                    classroomId: classroom1Id,
                    studentId: student1Id,
                },
            });

            const result = await service.studentViewJoinedClassrooms(student1Id, {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe(classroom1Id);
        });

        it('should not return classrooms with pending or rejected requests', async () => {
            // Create pending request only
            await prismaClient.joinRequest.create({
                data: {
                    studentId: student1Id,
                    classroomId: classroom1Id,
                    status: JoinRequestStatus.pending,
                    requestedAt: new Date(),
                },
            });

            const result = await service.studentViewJoinedClassrooms(student1Id, {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            });

            expect(result.data).toHaveLength(0);
        });
    });

    describe('Leave Classroom', () => {
        it('should leave classroom successfully', async () => {
            // Student1 join classroom1 first
            await prismaClient.classroomStudent.create({
                data: {
                    classroomId: classroom1Id,
                    studentId: student1Id,
                },
            });

            const result = await service.leaveClassroom(student1Id, classroom1Id);

            expect(result.message).toBe('Rời lớp học thành công');

            // Verify soft delete
            const classroomStudent = await prismaClient.classroomStudent.findUnique({
                where: {
                    classroomId_studentId: {
                        classroomId: classroom1Id,
                        studentId: student1Id,
                    },
                },
            });

            expect(classroomStudent?.deletedAt).not.toBeNull();
        });

        it('should allow rejoining after leaving', async () => {
            // Student1 join classroom1
            await prismaClient.classroomStudent.create({
                data: {
                    classroomId: classroom1Id,
                    studentId: student1Id,
                },
            });

            // Leave classroom
            await service.leaveClassroom(student1Id, classroom1Id);

            // Rejoin
            const joinRequest = await service.createJoinRequest(student1Id, { classroomId: classroom1Id });

            expect(joinRequest.status).toBe(JoinRequestStatus.pending);
        });
    });

    describe('Restore Deleted ClassroomStudent', () => {
        it('should restore ClassroomStudent when approving after student left', async () => {
            // Student1 join classroom1
            await prismaClient.classroomStudent.create({
                data: {
                    classroomId: classroom1Id,
                    studentId: student1Id,
                },
            });

            // Student1 leave classroom (soft delete)
            await prismaClient.classroomStudent.update({
                where: {
                    classroomId_studentId: {
                        classroomId: classroom1Id,
                        studentId: student1Id,
                    },
                },
                data: { deletedAt: new Date() },
            });

            // Student1 request to rejoin
            const joinRequest = await service.createJoinRequest(student1Id, { classroomId: classroom1Id });

            // Admin approve
            await service.approveJoinRequest(joinRequest.id);

            // Verify ClassroomStudent restored (deletedAt = null)
            const classroomStudent = await prismaClient.classroomStudent.findUnique({
                where: {
                    classroomId_studentId: {
                        classroomId: classroom1Id,
                        studentId: student1Id,
                    },
                },
            });

            expect(classroomStudent).toBeDefined();
            expect(classroomStudent?.deletedAt).toBeNull();
        });
    });

    describe('Error Cases', () => {
        it('should prevent approving already approved request', async () => {
            // Create and approve request
            const joinRequest = await service.createJoinRequest(student1Id, { classroomId: classroom1Id });
            await service.approveJoinRequest(joinRequest.id);

            // Try to approve again
            await expect(service.approveJoinRequest(joinRequest.id)).rejects.toThrow(UnprocessableEntityException);
            await expect(service.approveJoinRequest(joinRequest.id)).rejects.toThrow('Yêu cầu tham gia đã được chấp thuận từ trước');
        });
    });
});

