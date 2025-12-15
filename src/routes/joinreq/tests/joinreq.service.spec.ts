import { Test, TestingModule } from '@nestjs/testing';
import { JoinreqService } from '../services/joinreq.service';
import { IJoinreqRepo } from '../repos/joinreq.interface.repo';
import { SharedClassroomRepo } from 'src/shared/repos/shared-classroom.repo';
import { SharedClrStdRepo } from 'src/shared/repos/shared-clrstd.repo';
import { SharedJreqRepo } from 'src/shared/repos/shared-join-req.repo';
import { JoinRequestStatus } from '@prisma/client';
import { UnprocessableEntityException } from '@nestjs/common';
import { EnumOrder } from 'src/shared/constants/enum-order.constant';
import { JoinreqClassroomSortByEnum } from '../dtos/queries/get-joinreq-classrooms.dto';

describe('JoinreqService - MOCK repositories', () => {
    let service: JoinreqService;
    let mockJoinreqRepo: jest.Mocked<IJoinreqRepo>;
    let mockSharedClassroomRepo: jest.Mocked<SharedClassroomRepo>;
    let mockSharedClrStdRepo: jest.Mocked<SharedClrStdRepo>;
    let mockSharedJreqRepo: jest.Mocked<SharedJreqRepo>;

    const testStudentId = 1;
    const testClassroomId = 1;
    const testJoinRequestId = 1;

    beforeEach(async () => {
        mockJoinreqRepo = {
            findById: jest.fn(),
            findUnique: jest.fn(),
            createJoinRequest: jest.fn(),
            update: jest.fn(),
            findClassrooms: jest.fn(),
            countClassrooms: jest.fn(),
        } as any;

        mockSharedClassroomRepo = {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        } as any;

        mockSharedClrStdRepo = {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        } as any;

        mockSharedJreqRepo = {
            deleteJreq: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JoinreqService,
                {
                    provide: 'IJoinreqRepo',
                    useValue: mockJoinreqRepo,
                },
                {
                    provide: SharedClassroomRepo,
                    useValue: mockSharedClassroomRepo,
                },
                {
                    provide: SharedClrStdRepo,
                    useValue: mockSharedClrStdRepo,
                },
                {
                    provide: SharedJreqRepo,
                    useValue: mockSharedJreqRepo,
                },
            ],
        }).compile();

        service = module.get<JoinreqService>(JoinreqService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createJoinRequest', () => {
        it('should create join request successfully when classroom exists', async () => {
            const mockClassroom = {
                id: testClassroomId,
                name: 'Test Classroom',
                description: 'Description',
                coverMediaId: null,
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            const mockJoinRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            mockJoinreqRepo.findUnique.mockResolvedValue(null);
            mockSharedClassroomRepo.findUnique.mockResolvedValue(mockClassroom as any);
            mockJoinreqRepo.createJoinRequest.mockResolvedValue(mockJoinRequest);

            const result = await service.createJoinRequest(testStudentId, { classroomId: testClassroomId });

            expect(result.status).toBe(JoinRequestStatus.pending);
            expect(result.studentId).toBe(testStudentId);
            expect(result.classroomId).toBe(testClassroomId);
            expect(mockJoinreqRepo.createJoinRequest).toHaveBeenCalledWith(testStudentId, testClassroomId);
        });

        it('should throw error when classroom does not exist', async () => {
            mockJoinreqRepo.findUnique.mockResolvedValue(null);
            mockSharedClassroomRepo.findUnique.mockResolvedValue(null);

            await expect(
                service.createJoinRequest(testStudentId, { classroomId: testClassroomId })
            ).rejects.toThrow(UnprocessableEntityException);
            await expect(
                service.createJoinRequest(testStudentId, { classroomId: testClassroomId })
            ).rejects.toThrow('Lớp học không tồn tại');
        });

        it('should throw error when classroom is deleted', async () => {
            const mockDeletedClassroom = {
                id: testClassroomId,
                name: 'Deleted Classroom',
                description: 'Description',
                coverMediaId: null,
                isArchived: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: new Date(),
            };

            mockJoinreqRepo.findUnique.mockResolvedValue(null);
            mockSharedClassroomRepo.findUnique.mockResolvedValue(mockDeletedClassroom as any);

            await expect(
                service.createJoinRequest(testStudentId, { classroomId: testClassroomId })
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should throw error when classroom is archived', async () => {
            const mockArchivedClassroom = {
                id: testClassroomId,
                name: 'Archived Classroom',
                description: 'Description',
                coverMediaId: null,
                isArchived: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            mockJoinreqRepo.findUnique.mockResolvedValue(null);
            mockSharedClassroomRepo.findUnique.mockResolvedValue(mockArchivedClassroom as any);

            await expect(
                service.createJoinRequest(testStudentId, { classroomId: testClassroomId })
            ).rejects.toThrow(UnprocessableEntityException);
            await expect(
                service.createJoinRequest(testStudentId, { classroomId: testClassroomId })
            ).rejects.toThrow('Không thể tham gia lớp học đã lưu trữ');
        });

        it('should throw error when join request already pending', async () => {
            const existingRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            mockJoinreqRepo.findUnique.mockResolvedValue(existingRequest);

            await expect(
                service.createJoinRequest(testStudentId, { classroomId: testClassroomId })
            ).rejects.toThrow(UnprocessableEntityException);
            await expect(
                service.createJoinRequest(testStudentId, { classroomId: testClassroomId })
            ).rejects.toThrow('Yêu cầu tham gia đã tồn tại');
        });

        it('should allow resending request if previous request was rejected', async () => {
            const rejectedRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.rejected,
                requestedAt: new Date(),
                handledAt: new Date(),
            };

            const updatedRequest = {
                ...rejectedRequest,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            mockJoinreqRepo.findUnique.mockResolvedValue(rejectedRequest);
            mockJoinreqRepo.update.mockResolvedValue(updatedRequest);

            const result = await service.createJoinRequest(testStudentId, { classroomId: testClassroomId });

            expect(result.status).toBe(JoinRequestStatus.pending);
            expect(mockJoinreqRepo.update).toHaveBeenCalled();
        });
    });

    describe('approveJoinRequest', () => {
        it('should approve join request and create ClassroomStudent', async () => {
            const mockJoinRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            const approvedRequest = {
                ...mockJoinRequest,
                status: JoinRequestStatus.approved,
                handledAt: new Date(),
            };

            mockJoinreqRepo.findById.mockResolvedValue(mockJoinRequest);
            mockJoinreqRepo.update.mockResolvedValue(approvedRequest);
            mockSharedClrStdRepo.findUnique.mockResolvedValue(null);
            mockSharedClrStdRepo.create.mockResolvedValue({} as any);

            const result = await service.approveJoinRequest(testJoinRequestId);

            expect(result.status).toBe(JoinRequestStatus.approved);
            expect(result.handledAt).toBeDefined();
            expect(mockSharedClrStdRepo.create).toHaveBeenCalledWith({
                classroomId: testClassroomId,
                studentId: testStudentId,
            });
        });

        it('should restore deleted ClassroomStudent when approving', async () => {
            const mockJoinRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            const deletedClassroomStudent = {
                classroomId: testClassroomId,
                studentId: testStudentId,
                isActive: true,
                deletedAt: new Date(),
            };

            const approvedRequest = {
                ...mockJoinRequest,
                status: JoinRequestStatus.approved,
                handledAt: new Date(),
            };

            mockJoinreqRepo.findById.mockResolvedValue(mockJoinRequest);
            mockJoinreqRepo.update.mockResolvedValue(approvedRequest);
            mockSharedClrStdRepo.findUnique.mockResolvedValue(deletedClassroomStudent as any);
            mockSharedClrStdRepo.update.mockResolvedValue({} as any);

            await service.approveJoinRequest(testJoinRequestId);

            expect(mockSharedClrStdRepo.update).toHaveBeenCalledWith({
                classroomId: testClassroomId,
                studentId: testStudentId,
                deletedAt: null,
            });
        });

        it('should throw error when joinRequest does not exist', async () => {
            mockJoinreqRepo.findById.mockResolvedValue(null);

            await expect(service.approveJoinRequest(testJoinRequestId)).rejects.toThrow(
                UnprocessableEntityException
            );
            await expect(service.approveJoinRequest(testJoinRequestId)).rejects.toThrow(
                'Yêu cầu tham gia không tồn tại'
            );
        });

        it('should throw error when joinRequest already approved', async () => {
            const approvedRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.approved,
                requestedAt: new Date(),
                handledAt: new Date(),
            };

            mockJoinreqRepo.findById.mockResolvedValue(approvedRequest);

            await expect(service.approveJoinRequest(testJoinRequestId)).rejects.toThrow(
                UnprocessableEntityException
            );
            await expect(service.approveJoinRequest(testJoinRequestId)).rejects.toThrow(
                'Yêu cầu tham gia đã được chấp thuận từ trước'
            );
        });
    });

    describe('rejectJoinRequest', () => {
        it('should reject join request successfully', async () => {
            const mockJoinRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.pending,
                requestedAt: new Date(),
                handledAt: null,
            };

            const rejectedRequest = {
                ...mockJoinRequest,
                status: JoinRequestStatus.rejected,
                handledAt: new Date(),
            };

            mockJoinreqRepo.findById.mockResolvedValue(mockJoinRequest);
            mockJoinreqRepo.update.mockResolvedValue(rejectedRequest);

            const result = await service.rejectJoinRequest(testJoinRequestId);

            expect(result.status).toBe(JoinRequestStatus.rejected);
            expect(result.handledAt).toBeDefined();
        });

        it('should throw error when joinRequest does not exist', async () => {
            mockJoinreqRepo.findById.mockResolvedValue(null);

            await expect(service.rejectJoinRequest(testJoinRequestId)).rejects.toThrow(
                UnprocessableEntityException
            );
        });

        it('should throw error when joinRequest already rejected', async () => {
            const rejectedRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.rejected,
                requestedAt: new Date(),
                handledAt: new Date(),
            };

            mockJoinreqRepo.findById.mockResolvedValue(rejectedRequest);

            await expect(service.rejectJoinRequest(testJoinRequestId)).rejects.toThrow(
                UnprocessableEntityException
            );
            await expect(service.rejectJoinRequest(testJoinRequestId)).rejects.toThrow(
                'Yêu cầu tham gia đã bị từ chối trước đó'
            );
        });

        it('should throw error when trying to reject approved request', async () => {
            const approvedRequest = {
                id: testJoinRequestId,
                studentId: testStudentId,
                classroomId: testClassroomId,
                status: JoinRequestStatus.approved,
                requestedAt: new Date(),
                handledAt: new Date(),
            };

            mockJoinreqRepo.findById.mockResolvedValue(approvedRequest);

            await expect(service.rejectJoinRequest(testJoinRequestId)).rejects.toThrow(
                UnprocessableEntityException
            );
            await expect(service.rejectJoinRequest(testJoinRequestId)).rejects.toThrow(
                'Yêu cầu tham gia đã được chấp thuận từ trước. Không thể từ chối'
            );
        });
    });

    describe('studentViewClassrooms', () => {
        it('should return list of classrooms with pagination', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            };

            const mockClassrooms = [
                {
                    id: 1,
                    name: 'Class 1',
                    description: 'Description 1',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    classroomStudents: [],
                    joinRequests: [],
                },
                {
                    id: 2,
                    name: 'Class 2',
                    description: 'Description 2',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    classroomStudents: [],
                    joinRequests: [],
                },
            ];

            mockJoinreqRepo.countClassrooms.mockResolvedValue(2);
            mockJoinreqRepo.findClassrooms.mockResolvedValue(mockClassrooms as any);

            const result = await service.studentViewClassrooms(testStudentId, query);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.total).toBe(2);
            expect(result.data).toHaveLength(2);
        });

        it('should show isJoined = true for joined classrooms', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            };

            const mockClassrooms = [
                {
                    id: 1,
                    name: 'Joined Class',
                    description: 'Description',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
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

            mockJoinreqRepo.countClassrooms.mockResolvedValue(1);
            mockJoinreqRepo.findClassrooms.mockResolvedValue(mockClassrooms as any);

            const result = await service.studentViewClassrooms(testStudentId, query);

            expect(result.data[0].isJoined).toBe(true);
        });

        it('should show joinRequest if pending', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.NAME,
            };

            const mockClassrooms = [
                {
                    id: 1,
                    name: 'Class with pending request',
                    description: 'Description',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    classroomStudents: [],
                    joinRequests: [
                        {
                            id: testJoinRequestId,
                            studentId: testStudentId,
                            classroomId: 1,
                            status: JoinRequestStatus.pending,
                            requestedAt: new Date(),
                            handledAt: null,
                        },
                    ],
                },
            ];

            mockJoinreqRepo.countClassrooms.mockResolvedValue(1);
            mockJoinreqRepo.findClassrooms.mockResolvedValue(mockClassrooms as any);

            const result = await service.studentViewClassrooms(testStudentId, query);

            expect(result.data[0].joinRequest).toBeDefined();
            expect(result.data[0].joinRequest?.status).toBe(JoinRequestStatus.pending);
        });

        it('should filter by search term', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.ASC,
                sortBy: JoinreqClassroomSortByEnum.NAME,
                search: 'Math',
            };

            mockJoinreqRepo.countClassrooms.mockResolvedValue(1);
            mockJoinreqRepo.findClassrooms.mockResolvedValue([
                {
                    id: 1,
                    name: 'Math Class',
                    description: 'Mathematics',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    classroomStudents: [],
                    joinRequests: [],
                },
            ] as any);

            await service.studentViewClassrooms(testStudentId, query);

            expect(mockJoinreqRepo.findClassrooms).toHaveBeenCalledWith(
                expect.objectContaining({
                    deletedAt: null,
                    OR: [
                        { name: { contains: 'Math', mode: 'insensitive' } },
                        { description: { contains: 'Math', mode: 'insensitive' } },
                    ],
                }),
                expect.any(Object),
                expect.any(Number),
                expect.any(Number),
                expect.objectContaining({
                    includeStudentInfo: true,
                    studentId: testStudentId,
                })
            );
        });
    });

    describe('studentViewJoinedClassrooms', () => {
        it('should return only joined classrooms', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: JoinreqClassroomSortByEnum.CREATED_AT,
            };

            const mockClassrooms = [
                {
                    id: 1,
                    name: 'Joined Class',
                    description: 'Description',
                    coverMediaId: null,
                    isArchived: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockJoinreqRepo.countClassrooms.mockResolvedValue(1);
            mockJoinreqRepo.findClassrooms.mockResolvedValue(mockClassrooms as any);

            const result = await service.studentViewJoinedClassrooms(testStudentId, query);

            expect(result.data).toHaveLength(1);
            expect(mockJoinreqRepo.findClassrooms).toHaveBeenCalledWith(
                expect.objectContaining({
                    deletedAt: null,
                    classroomStudents: {
                        some: {
                            studentId: testStudentId,
                            isActive: true,
                            deletedAt: null,
                        },
                    },
                }),
                expect.any(Object),
                expect.any(Number),
                expect.any(Number)
            );
        });

        it('should apply pagination and sorting', async () => {
            const query = {
                page: 2,
                limit: 5,
                order: EnumOrder.ASC,
                sortBy: JoinreqClassroomSortByEnum.NAME,
            };

            mockJoinreqRepo.countClassrooms.mockResolvedValue(10);
            mockJoinreqRepo.findClassrooms.mockResolvedValue([] as any);

            await service.studentViewJoinedClassrooms(testStudentId, query);

            expect(mockJoinreqRepo.findClassrooms).toHaveBeenCalledWith(
                expect.any(Object),
                { name: EnumOrder.ASC },
                5, // skip = (page - 1) * limit = 5
                5  // take = limit
            );
        });
    });

    describe('leaveClassroom', () => {
        it('should leave classroom successfully', async () => {
            mockSharedClrStdRepo.update.mockResolvedValue({} as any);
            mockSharedJreqRepo.deleteJreq.mockResolvedValue(undefined);

            const result = await service.leaveClassroom(testStudentId, testClassroomId);

            expect(result.message).toBe('Rời lớp học thành công');
            expect(mockSharedClrStdRepo.update).toHaveBeenCalledWith({
                studentId: testStudentId,
                classroomId: testClassroomId,
                deletedAt: expect.any(Date),
            });
            expect(mockSharedJreqRepo.deleteJreq).toHaveBeenCalledWith(testClassroomId, testStudentId);
        });
    });
});
