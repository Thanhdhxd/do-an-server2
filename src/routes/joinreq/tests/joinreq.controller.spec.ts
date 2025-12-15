import { Test, TestingModule } from '@nestjs/testing';
import { JoinreqController } from '../joinreq.controller';
import { IJoinreqService } from '../services/joinreq.interface.service';
import { Role, JoinRequestStatus } from '@prisma/client';
import { SharedUserRepo } from 'src/shared/repos/shared-user.repo';
import { PrismaService } from 'src/shared/services/prisma.service';
import { EnumOrder } from 'src/shared/constants/enum-order.constant';
import { JoinreqClassroomSortByEnum } from '../dtos/queries/get-joinreq-classrooms.dto';

describe('JoinreqController - MOCK services', () => {
    let controller: JoinreqController;
    let mockJoinreqService: jest.Mocked<IJoinreqService>;

    const testUser = {
        id: 1,
        role: Role.student,
        email: 'student@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        fullName: 'Test Student',
        phoneNumber: '0123456789',
        deletedAt: null,
        avatarMediaId: null,
        isActive: true,
    };

    const testAdminUser = {
        id: 2,
        role: Role.admin,
        email: 'admin@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        fullName: 'Admin User',
        phoneNumber: '0987654321',
        deletedAt: null,
        avatarMediaId: null,
        isActive: true,
    };

    const testJoinRequestId = 1;
    const testClassroomId = 1;

    beforeEach(async () => {
        mockJoinreqService = {
            studentViewClassrooms: jest.fn(),
            studentViewJoinedClassrooms: jest.fn(),
            createJoinRequest: jest.fn(),
            approveJoinRequest: jest.fn(),
            rejectJoinRequest: jest.fn(),
            leaveClassroom: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [JoinreqController],
            providers: [
                {
                    provide: 'IJoinreqService',
                    useValue: mockJoinreqService,
                },
                {
                    provide: SharedUserRepo,
                    useValue: {
                        findByEmail: jest.fn(),
                        findById: jest.fn(),
                    },
                },
                {
                    provide: PrismaService,
                    useValue: {
                        user: { findUnique: jest.fn() },
                    },
                },
            ],
        }).compile();

        controller = module.get<JoinreqController>(JoinreqController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /join-request/classrooms', () => {
        it('should call service.studentViewClassrooms with user.id and query', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            };

            const mockResponse = {
                page: 1,
                limit: 10,
                total: 2,
                data: [
                    {
                        id: 1,
                        name: 'Classroom 1',
                        description: 'Description 1',
                        coverMediaId: null,
                        isArchived: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isJoined: false,
                        joinRequest: null,
                    },
                    {
                        id: 2,
                        name: 'Classroom 2',
                        description: 'Description 2',
                        coverMediaId: null,
                        isArchived: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isJoined: true,
                        joinRequest: null,
                    },
                ],
            };

            mockJoinreqService.studentViewClassrooms.mockResolvedValue(mockResponse);

            const result = await controller.getClassrooms(testUser, query);

            expect(mockJoinreqService.studentViewClassrooms).toHaveBeenCalledWith(testUser.id, query);
            expect(result).toEqual(mockResponse);
        });

        it('should return correct format JoinreqClassroomListResDto', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.ASC,
                sortBy: JoinreqClassroomSortByEnum.NAME,
            };

            const mockResponse = {
                page: 1,
                limit: 10,
                total: 1,
                data: [
                    {
                        id: 1,
                        name: 'Test Classroom',
                        description: 'Test Description',
                        coverMediaId: null,
                        isArchived: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isJoined: false,
                        joinRequest: {
                            id: 1,
                            status: JoinRequestStatus.pending,
                            requestedAt: new Date(),
                            handledAt: null,
                        },
                    },
                ],
            };

            mockJoinreqService.studentViewClassrooms.mockResolvedValue(mockResponse);

            const result = await controller.getClassrooms(testUser, query);

            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('data');
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data[0]).toHaveProperty('isJoined');
            expect(result.data[0]).toHaveProperty('joinRequest');
        });
    });

    describe('GET /join-request/joined-classrooms', () => {
        it('should call service.studentViewJoinedClassrooms', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            };

            const mockResponse = {
                page: 1,
                limit: 10,
                total: 1,
                data: [
                    {
                        id: 1,
                        name: 'Joined Classroom',
                        description: 'Description',
                        coverMediaId: null,
                        isArchived: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
            };

            mockJoinreqService.studentViewJoinedClassrooms.mockResolvedValue(mockResponse);

            const result = await controller.getJoinedClassrooms(testUser, query);

            expect(mockJoinreqService.studentViewJoinedClassrooms).toHaveBeenCalledWith(testUser.id, query);
            expect(result).toEqual(mockResponse);
        });

        it('should return list of joined classrooms', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.NAME,
            };

            const mockResponse = {
                page: 1,
                limit: 10,
                total: 2,
                data: [
                    {
                        id: 1,
                        name: 'Class A',
                        description: 'Description A',
                        coverMediaId: null,
                        isArchived: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: 2,
                        name: 'Class B',
                        description: 'Description B',
                        coverMediaId: null,
                        isArchived: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
            };

            mockJoinreqService.studentViewJoinedClassrooms.mockResolvedValue(mockResponse);

            const result = await controller.getJoinedClassrooms(testUser, query);

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
        });
    });

    describe('POST /join-request', () => {
        it('should call service.createJoinRequest with user.id and body', async () => {
            const createDto = {
                classroomId: testClassroomId,
            };

            const mockJoinRequest = {
                id: testJoinRequestId,
                studentId: testUser.id,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            mockJoinreqService.createJoinRequest.mockResolvedValue(mockJoinRequest);

            const result = await controller.createJoinRequest(createDto, testUser);

            expect(mockJoinreqService.createJoinRequest).toHaveBeenCalledWith(testUser.id, createDto);
            expect(result).toEqual(mockJoinRequest);
        });

        it('should return JoinreqResDto', async () => {
            const createDto = {
                classroomId: testClassroomId,
            };

            const mockJoinRequest = {
                id: testJoinRequestId,
                studentId: testUser.id,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            mockJoinreqService.createJoinRequest.mockResolvedValue(mockJoinRequest);

            const result = await controller.createJoinRequest(createDto, testUser);

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('studentId');
            expect(result).toHaveProperty('classroomId');
            expect(result).toHaveProperty('status');
            expect(result.status).toBe(JoinRequestStatus.pending);
        });
    });

    describe('PUT /join-request/:id/approve', () => {
        it('should call service.approveJoinRequest(id)', async () => {
            const params = { id: testJoinRequestId };

            const mockApprovedRequest = {
                id: testJoinRequestId,
                studentId: testUser.id,
                classroomId: testClassroomId,
                status: JoinRequestStatus.approved,
                requestedAt: new Date(),
                handledAt: new Date(),
            };

            mockJoinreqService.approveJoinRequest.mockResolvedValue(mockApprovedRequest);

            const result = await controller.approveJoinRequest(params);

            expect(mockJoinreqService.approveJoinRequest).toHaveBeenCalledWith(testJoinRequestId);
            expect(result.status).toBe(JoinRequestStatus.approved);
            expect(result.handledAt).toBeDefined();
        });
    });

    describe('PUT /join-request/:id/reject', () => {
        it('should call service.rejectJoinRequest(id)', async () => {
            const params = { id: testJoinRequestId };

            const mockRejectedRequest = {
                id: testJoinRequestId,
                studentId: testUser.id,
                classroomId: testClassroomId,
                status: JoinRequestStatus.rejected,
                requestedAt: new Date(),
                handledAt: new Date(),
            };

            mockJoinreqService.rejectJoinRequest.mockResolvedValue(mockRejectedRequest);

            const result = await controller.rejectJoinRequest(params);

            expect(mockJoinreqService.rejectJoinRequest).toHaveBeenCalledWith(testJoinRequestId);
            expect(result.status).toBe(JoinRequestStatus.rejected);
            expect(result.handledAt).toBeDefined();
        });
    });

    describe('DELETE /join-request/leave-classroom', () => {
        it('should call service.leaveClassroom(user.id, classroomId)', async () => {
            const body = { classroomId: testClassroomId };

            const mockResponse = { message: 'Rời lớp học thành công' };

            mockJoinreqService.leaveClassroom.mockResolvedValue(mockResponse);

            const result = await controller.leaveClassroom(testUser, body);

            expect(mockJoinreqService.leaveClassroom).toHaveBeenCalledWith(testUser.id, testClassroomId);
            expect(result.message).toBe('Rời lớp học thành công');
        });
    });
});
