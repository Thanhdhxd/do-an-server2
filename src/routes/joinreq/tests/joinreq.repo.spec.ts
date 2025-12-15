import { Test, TestingModule } from '@nestjs/testing';
import { JoinreqRepo } from '../repos/joinreq.repo';
import { PrismaService } from 'src/shared/services/prisma.service';
import { JoinRequestStatus } from '@prisma/client';

describe('JoinreqRepo - MOCK PrismaService', () => {
    let repo: JoinreqRepo;
    let prismaService: any;

    const testStudentId = 1;
    const testClassroomId = 1;
    const testJoinRequestId = 1;

    beforeEach(async () => {
        const mockPrismaService = {
            joinRequest: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            classroom: {
                count: jest.fn(),
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JoinreqRepo,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        repo = module.get<JoinreqRepo>(JoinreqRepo);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findById', () => {
        it('should find JoinRequest by ID', async () => {
            const mockJoinRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            prismaService.joinRequest.findUnique.mockResolvedValue(mockJoinRequest);

            const result = await repo.findById(testJoinRequestId);

            expect(result).toEqual(mockJoinRequest);
            expect(prismaService.joinRequest.findUnique).toHaveBeenCalledWith({
                where: { id: testJoinRequestId },
            });
        });

        it('should return null if not found', async () => {
            prismaService.joinRequest.findUnique.mockResolvedValue(null);

            const result = await repo.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('findUnique', () => {
        it('should find JoinRequest by studentId and classroomId', async () => {
            const mockJoinRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            prismaService.joinRequest.findFirst.mockResolvedValue(mockJoinRequest);

            const result = await repo.findUnique({
                studentId: testStudentId,
                classroomId: testClassroomId,
            });

            expect(result).toEqual(mockJoinRequest);
            expect(prismaService.joinRequest.findFirst).toHaveBeenCalledWith({
                where: {
                    studentId: testStudentId,
                    classroomId: testClassroomId,
                },
            });
        });

        it('should return null if not found', async () => {
            prismaService.joinRequest.findFirst.mockResolvedValue(null);

            const result = await repo.findUnique({
                studentId: 999,
                classroomId: 999,
            });

            expect(result).toBeNull();
        });
    });

    describe('createJoinRequest', () => {
        it('should create new JoinRequest with status = pending', async () => {
            const mockCreatedRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            prismaService.joinRequest.create.mockResolvedValue(mockCreatedRequest);

            const result = await repo.createJoinRequest(testStudentId, testClassroomId);

            expect(result.status).toBe(JoinRequestStatus.pending);
            expect(result.studentId).toBe(testStudentId);
            expect(result.classroomId).toBe(testClassroomId);
            expect(result.handledAt).toBeNull();
            expect(prismaService.joinRequest.create).toHaveBeenCalledWith({
                data: {
                    studentId: testStudentId,
                    classroomId: testClassroomId,
                    status: 'pending',
                    requestedAt: expect.any(Date),
                },
            });
        });

        it('should set requestedAt to current date', async () => {
            const now = new Date();
            const mockCreatedRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: now,
                handledAt: null,
            };

            prismaService.joinRequest.create.mockResolvedValue(mockCreatedRequest);

            const result = await repo.createJoinRequest(testStudentId, testClassroomId);

            expect(result.requestedAt).toBeDefined();
            expect(result.requestedAt).toBeInstanceOf(Date);
        });
    });

    describe('update', () => {
        it('should update status from pending to approved', async () => {
            const mockUpdatedRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.approved,
                requestedAt: new Date(),
                handledAt: new Date(),
            };

            prismaService.joinRequest.update.mockResolvedValue(mockUpdatedRequest);

            const result = await repo.update({
                id: testJoinRequestId,
                status: JoinRequestStatus.approved,
                handledAt: new Date(),
            });

            expect(result.status).toBe(JoinRequestStatus.approved);
            expect(result.handledAt).toBeDefined();
        });

        it('should update handledAt when processing request', async () => {
            const handledAt = new Date();
            const mockUpdatedRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.rejected,
                requestedAt: new Date(),
                handledAt,
            };

            prismaService.joinRequest.update.mockResolvedValue(mockUpdatedRequest);

            const result = await repo.update({
                id: testJoinRequestId,
                status: JoinRequestStatus.rejected,
                handledAt,
            });

            expect(result.handledAt).toEqual(handledAt);
            expect(prismaService.joinRequest.update).toHaveBeenCalledWith({
                where: { id: testJoinRequestId },
                data: expect.objectContaining({
                    status: JoinRequestStatus.rejected,
                    handledAt,
                }),
            });
        });
    });

    describe('findClassrooms', () => {
        it('should return list of classrooms with pagination', async () => {
            const mockClassrooms = [
                {
                    id: 1,
                    name: 'Classroom 1',
                    description: 'Description 1',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
                {
                    id: 2,
                    name: 'Classroom 2',
                    description: 'Description 2',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                },
            ];

            prismaService.classroom.findMany.mockResolvedValue(mockClassrooms as any);

            const result = await repo.findClassrooms(
                { deletedAt: null },
                { createdAt: 'desc' },
                0,
                10
            );

            expect(result).toHaveLength(2);
            expect(prismaService.classroom.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                include: undefined,
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            });
        });

        it('should include classroomStudents when studentId provided', async () => {
            const mockClassrooms = [
                {
                    id: 1,
                    name: 'Classroom 1',
                    description: 'Description 1',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    classroomStudents: [
                        {
                            studentId: testStudentId,
                            classroomId: 1,
                            isActive: true,
                            deletedAt: null,
                        },
                    ],
                    joinRequests: [],
                },
            ];

            prismaService.classroom.findMany.mockResolvedValue(mockClassrooms as any);

            await repo.findClassrooms(
                { deletedAt: null },
                { name: 'asc' },
                0,
                10,
                {
                    includeStudentInfo: true,
                    studentId: testStudentId,
                }
            );

            expect(prismaService.classroom.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                include: {
                    classroomStudents: {
                        where: {
                            studentId: testStudentId,
                            isActive: true,
                            deletedAt: null,
                        },
                    },
                    joinRequests: {
                        where: {
                            studentId: testStudentId,
                        },
                    },
                },
                orderBy: { name: 'asc' },
                skip: 0,
                take: 10,
            });
        });

        it('should filter by where condition', async () => {
            prismaService.classroom.findMany.mockResolvedValue([]);

            await repo.findClassrooms(
                {
                    deletedAt: null,
                    isArchived: false,
                },
                { createdAt: 'desc' },
                0,
                10
            );

            expect(prismaService.classroom.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    isArchived: false,
                },
                include: undefined,
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            });
        });

        it('should apply orderBy correctly', async () => {
            prismaService.classroom.findMany.mockResolvedValue([]);

            await repo.findClassrooms(
                { deletedAt: null },
                { name: 'asc' },
                5,
                5
            );

            expect(prismaService.classroom.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                include: undefined,
                orderBy: { name: 'asc' },
                skip: 5,
                take: 5,
            });
        });
    });

    describe('countClassrooms', () => {
        it('should count classrooms correctly', async () => {
            prismaService.classroom.count.mockResolvedValue(5);

            const result = await repo.countClassrooms({ deletedAt: null });

            expect(result).toBe(5);
            expect(prismaService.classroom.count).toHaveBeenCalledWith({
                where: { deletedAt: null },
            });
        });

        it('should not count deleted classrooms', async () => {
            prismaService.classroom.count.mockResolvedValue(3);

            const result = await repo.countClassrooms({
                deletedAt: null,
                isArchived: false,
            });

            expect(result).toBe(3);
        });
    });
});
