import { Test, TestingModule } from '@nestjs/testing';
import { QuizAttemptService } from '../services/quiz-attempt.service';
import { IQuizAttemptRepo } from '../repos/quiz-attempt.interface.repo';
import { SharedLessonRepo } from 'src/shared/repos/shared-lesson.repo';
import { LessonType, QuizAttemptStatus, Role, QuestionType } from '@prisma/client';
import { UnprocessableEntityException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EnumOrder } from 'src/shared/constants/enum-order.constant';
import { QuizAttemptSortBy } from '../dtos/queries/quiz-attempt-query.dto';

describe('QuizAttemptService - MOCK repositories', () => {
    let service: QuizAttemptService;
    let mockQuizAttemptRepo: jest.Mocked<IQuizAttemptRepo>;
    let mockSharedLessonRepo: jest.Mocked<SharedLessonRepo>;

    const testStudentId = 1;
    const testLessonId = 1;
    const testQuizId = 1;
    const testAttemptId = 1;

    beforeEach(async () => {
        mockQuizAttemptRepo = {
            create: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            findById: jest.fn(),
            findByIdWithDetails: jest.fn(),
            update: jest.fn(),
        };

        mockSharedLessonRepo = {
            findTypeLessonById: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizAttemptService,
                {
                    provide: 'IQuizAttemptRepo',
                    useValue: mockQuizAttemptRepo,
                },
                {
                    provide: SharedLessonRepo,
                    useValue: mockSharedLessonRepo,
                },
            ],
        }).compile();

        service = module.get<QuizAttemptService>(QuizAttemptService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        const mockLesson = {
            id: testLessonId,
            classroomId: 1,
            lessonType: LessonType.quiz,
            quizId: testQuizId,
            lectureId: null,
            exerciseId: null,
            exerciseDueAt: null,
            quizStartAt: new Date(),
            quizEndAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            showQuizAnswers: false,
            showQuizScore: true,
            orderIndex: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        };

        it('should create QuizAttempt with status = in_progress', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            mockSharedLessonRepo.findTypeLessonById.mockResolvedValue(mockLesson as any);
            mockQuizAttemptRepo.create.mockResolvedValue(mockAttempt);

            const result = await service.create(testStudentId, {
                lessonId: testLessonId,
                quizId: testQuizId,
                startedAt: new Date(),
                status: QuizAttemptStatus.in_progress,
            });

            expect(result.status).toBe(QuizAttemptStatus.in_progress);
            expect(mockQuizAttemptRepo.create).toHaveBeenCalledWith({
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
            });
        });

        it('should have startedAt = Date.now()', async () => {
            const now = new Date();
            const mockAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: now,
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            mockSharedLessonRepo.findTypeLessonById.mockResolvedValue(mockLesson as any);
            mockQuizAttemptRepo.create.mockResolvedValue(mockAttempt);

            const result = await service.create(testStudentId, {
                lessonId: testLessonId,
                quizId: testQuizId,
                startedAt: now,
                status: QuizAttemptStatus.in_progress,
            });

            expect(result.startedAt).toBeDefined();
            expect(result.startedAt).toBeInstanceOf(Date);
        });

        it('should have submittedAt = null, scoreRaw = null, scoreScaled10 = null', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            mockSharedLessonRepo.findTypeLessonById.mockResolvedValue(mockLesson as any);
            mockQuizAttemptRepo.create.mockResolvedValue(mockAttempt);

            const result = await service.create(testStudentId, {
                lessonId: testLessonId,
                quizId: testQuizId,
                startedAt: new Date(),
                status: QuizAttemptStatus.in_progress,
            });

            expect(result.submittedAt).toBeNull();
            expect(result.scoreRaw).toBeNull();
            expect(result.scoreScaled10).toBeNull();
        });

        it('should throw error if lesson does not exist', async () => {
            mockSharedLessonRepo.findTypeLessonById.mockResolvedValue(null);

            await expect(
                service.create(testStudentId, {
                    lessonId: 999,
                    quizId: testQuizId,
                    startedAt: new Date(),
                    status: QuizAttemptStatus.in_progress,
                })
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should throw error if lessonType !== quiz', async () => {
            // findTypeLessonById sẽ return null nếu lesson type không phải quiz
            mockSharedLessonRepo.findTypeLessonById.mockResolvedValue(null);

            await expect(
                service.create(testStudentId, {
                    lessonId: testLessonId,
                    quizId: testQuizId,
                    startedAt: new Date(),
                    status: QuizAttemptStatus.in_progress,
                })
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should throw error if lesson.quizId !== data.quizId', async () => {
            const wrongQuizLesson = {
                ...mockLesson,
                quizId: 999,
            };

            mockSharedLessonRepo.findTypeLessonById.mockResolvedValue(wrongQuizLesson as any);

            await expect(
                service.create(testStudentId, {
                    lessonId: testLessonId,
                    quizId: testQuizId,
                    startedAt: new Date(),
                    status: QuizAttemptStatus.in_progress,
                })
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should verify quizId belongs to lesson', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            mockSharedLessonRepo.findTypeLessonById.mockResolvedValue(mockLesson as any);
            mockQuizAttemptRepo.create.mockResolvedValue(mockAttempt);

            await service.create(testStudentId, {
                lessonId: testLessonId,
                quizId: testQuizId,
                startedAt: new Date(),
                status: QuizAttemptStatus.in_progress,
            });

            expect(mockSharedLessonRepo.findTypeLessonById).toHaveBeenCalledWith(
                LessonType.quiz,
                testLessonId
            );
        });
    });

    describe('getAll', () => {
        it('should return list of attempts with pagination', async () => {
            const mockAttempts = [
                {
                    id: 1,
                    lessonId: testLessonId,
                    quizId: testQuizId,
                    studentId: testStudentId,
                    startedAt: new Date(),
                    submittedAt: null,
                    status: QuizAttemptStatus.in_progress,
                    scoreRaw: null,
                    scoreScaled10: null,
                },
                {
                    id: 2,
                    lessonId: testLessonId,
                    quizId: testQuizId,
                    studentId: testStudentId,
                    startedAt: new Date(),
                    submittedAt: new Date(),
                    status: QuizAttemptStatus.submitted,
                    scoreRaw: 9.0,
                    scoreScaled10: 9.0,
                },
            ];

            mockQuizAttemptRepo.count.mockResolvedValue(2);
            mockQuizAttemptRepo.findMany.mockResolvedValue(mockAttempts);

            const result = await service.getAll({
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: QuizAttemptSortBy.submittedAt,
            });

            expect(result.data).toEqual(mockAttempts);
            expect(result.total).toBe(2);
        });

        it('should apply orderBy (submittedAt, scoreScaled10)', async () => {
            mockQuizAttemptRepo.count.mockResolvedValue(0);
            mockQuizAttemptRepo.findMany.mockResolvedValue([]);

            await service.getAll({
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: QuizAttemptSortBy.scoreScaled10,
            });

            expect(mockQuizAttemptRepo.findMany).toHaveBeenCalled();
        });

        it('should apply where conditions', async () => {
            mockQuizAttemptRepo.count.mockResolvedValue(0);
            mockQuizAttemptRepo.findMany.mockResolvedValue([]);

            await service.getAll({
                page: 1,
                limit: 10,
                order: EnumOrder.ASC,
                sortBy: QuizAttemptSortBy.submittedAt,
            });

            expect(mockQuizAttemptRepo.count).toHaveBeenCalled();
            expect(mockQuizAttemptRepo.findMany).toHaveBeenCalled();
        });
    });

    describe('getById', () => {
        const mockAttempt = {
            id: testAttemptId,
            lessonId: testLessonId,
            quizId: testQuizId,
            studentId: testStudentId,
            startedAt: new Date(),
            submittedAt: null,
            status: QuizAttemptStatus.in_progress,
            scoreRaw: null,
            scoreScaled10: null,
            lesson: {
                id: testLessonId,
                showQuizAnswers: false,
                showQuizScore: true,
            },
            answers: [
                {
                    attemptId: testAttemptId,
                    questionId: 1,
                    optionId: 1,
                    question: {
                        id: 1,
                        quizId: testQuizId,
                        sectionId: null,
                        groupId: null,
                        content: 'Test',
                        explanation: null,
                        questionType: QuestionType.single_choice,
                        points: 1.0,
                        orderIndex: 0,
                    },
                    option: {
                        id: 1,
                        questionId: 1,
                        content: 'Option',
                        isCorrect: true,
                        orderIndex: 0,
                    },
                },
            ],
        };

        it('should allow admin to view with canViewAnswers = true, canViewScore = true', async () => {
            mockQuizAttemptRepo.findByIdWithDetails.mockResolvedValue(mockAttempt);

            const result = await service.getById(999, Role.admin, testAttemptId);

            expect(result.canViewAnswers).toBe(true);
            expect(result.canViewScore).toBe(true);
            expect(result.answers[0].option.isCorrect).toBeDefined();
        });

        it('should allow student to view own attempt with lesson settings', async () => {
            mockQuizAttemptRepo.findByIdWithDetails.mockResolvedValue(mockAttempt);

            const result = await service.getById(testStudentId, Role.student, testAttemptId);

            expect(result.canViewAnswers).toBe(mockAttempt.lesson.showQuizAnswers);
            expect(result.canViewScore).toBe(mockAttempt.lesson.showQuizScore);
        });

        it('should hide option.isCorrect if !showQuizAnswers', async () => {
            mockQuizAttemptRepo.findByIdWithDetails.mockResolvedValue(mockAttempt);

            const result = await service.getById(testStudentId, Role.student, testAttemptId);

            expect(result.answers[0].option.isCorrect).toBeUndefined();
        });

        it('should hide scoreRaw and scoreScaled10 if !showQuizScore', async () => {
            const attemptWithScore = {
                ...mockAttempt,
                scoreRaw: 8.5,
                scoreScaled10: 8.5,
                lesson: {
                    ...mockAttempt.lesson,
                    showQuizScore: false,
                },
            };

            mockQuizAttemptRepo.findByIdWithDetails.mockResolvedValue(attemptWithScore);

            const result = await service.getById(testStudentId, Role.student, testAttemptId);

            expect(result.scoreRaw).toBeNull();
            expect(result.scoreScaled10).toBeNull();
        });

        it('should throw NotFoundException if attempt does not exist', async () => {
            mockQuizAttemptRepo.findByIdWithDetails.mockResolvedValue(null);

            await expect(
                service.getById(testStudentId, Role.student, 999)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if student views another student attempt', async () => {
            mockQuizAttemptRepo.findByIdWithDetails.mockResolvedValue(mockAttempt);

            await expect(
                service.getById(999, Role.student, testAttemptId)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('submit', () => {
        it('should update status = submitted and submittedAt = Date.now()', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            const updatedAttempt = {
                ...mockAttempt,
                status: QuizAttemptStatus.submitted,
                submittedAt: new Date(),
            };

            mockQuizAttemptRepo.findById.mockResolvedValue(mockAttempt);
            mockQuizAttemptRepo.update.mockResolvedValue(updatedAttempt);

            const result = await service.submit(testStudentId, testAttemptId);

            expect(result.status).toBe(QuizAttemptStatus.submitted);
            expect(result.submittedAt).toBeDefined();
            expect(mockQuizAttemptRepo.update).toHaveBeenCalledWith(
                testAttemptId,
                expect.objectContaining({
                    status: 'submitted',
                    submittedAt: expect.any(Date),
                })
            );
        });

        it('should throw error if attempt does not exist', async () => {
            mockQuizAttemptRepo.findById.mockResolvedValue(null);

            await expect(
                service.submit(testStudentId, 999)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if attempt.studentId !== userId', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: 999,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            mockQuizAttemptRepo.findById.mockResolvedValue(mockAttempt);

            await expect(
                service.submit(testStudentId, testAttemptId)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw error if status = submitted', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: new Date(),
                submittedAt: new Date(),
                status: QuizAttemptStatus.submitted,
                scoreRaw: null,
                scoreScaled10: null,
            };

            mockQuizAttemptRepo.findById.mockResolvedValue(mockAttempt);

            await expect(
                service.submit(testStudentId, testAttemptId)
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw error if status = graded', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: new Date(),
                submittedAt: new Date(),
                status: QuizAttemptStatus.graded,
                scoreRaw: 10.0,
                scoreScaled10: 10.0,
            };

            mockQuizAttemptRepo.findById.mockResolvedValue(mockAttempt);

            await expect(
                service.submit(testStudentId, testAttemptId)
            ).rejects.toThrow(BadRequestException);
        });
    });
});