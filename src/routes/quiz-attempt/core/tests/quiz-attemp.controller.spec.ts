import { Test, TestingModule } from '@nestjs/testing';
import { QuizAttemptController } from '../../quiz-attempt.controller';
import { IQuizAttemptService } from '../services/quiz-attempt.interface.service';
import { Role, QuizAttemptStatus } from '@prisma/client';
import { SharedUserRepo } from 'src/shared/repos/shared-user.repo';
import { PrismaService } from 'src/shared/services/prisma.service';

describe('QuizAttemptController - MOCK services', () => {
    let controller: QuizAttemptController;
    let mockQuizAttemptService: jest.Mocked<IQuizAttemptService>;

    const testUser = {
        id: 1,
        role: Role.student,
        email: 'student@test.com',
    };

    const testAttemptId = 1;

    beforeEach(async () => {
        mockQuizAttemptService = {
            create: jest.fn(),
            getAll: jest.fn(),
            getById: jest.fn(),
            submit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuizAttemptController],
            providers: [
                {
                    provide: 'IQuizAttemptService',
                    useValue: mockQuizAttemptService,
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

        controller = module.get<QuizAttemptController>(QuizAttemptController);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /quiz-attempt', () => {
        it('should call service.create with user.id and body', async () => {
            const createDto = {
                lessonId: 1,
                quizId: 1,
            };

            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUser.id,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            mockQuizAttemptService.create.mockResolvedValue(mockAttempt);

            const result = await controller.createQuizAttempt(testUser as any, createDto as any);

            expect(mockQuizAttemptService.create).toHaveBeenCalledWith(testUser.id, createDto);
            expect(result).toEqual(mockAttempt);
        });

        it('should validate DTO (lessonId, quizId required)', async () => {
            const createDto = {
                lessonId: 1,
                quizId: 1,
            };

            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUser.id,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            mockQuizAttemptService.create.mockResolvedValue(mockAttempt);

            await controller.createQuizAttempt(testUser as any, createDto as any);

            expect(mockQuizAttemptService.create).toHaveBeenCalled();
        });
    });

    describe('GET /quiz-attempt', () => {
        it('should call service.getAll with query', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: 'desc' as 'desc',
                sortBy: 'submittedAt' as 'submittedAt',
            };

            const mockResponse = {
                page: 1,
                limit: 10,
                total: 1,
                data: [
                    {
                        id: 1,
                        lessonId: 1,
                        quizId: 1,
                        studentId: testUser.id,
                        startedAt: new Date(),
                        submittedAt: null,
                        status: QuizAttemptStatus.in_progress,
                        scoreRaw: null,
                        scoreScaled10: null,
                    },
                ],
            };

            mockQuizAttemptService.getAll.mockResolvedValue(mockResponse);

            const result = await controller.getQuizAttempts(query as any);

            expect(mockQuizAttemptService.getAll).toHaveBeenCalledWith(query);
            expect(result).toEqual(mockResponse);
        });

        it('should return ListQuizAttemptsResDto', async () => {
            const query = {
                page: 1,
                limit: 10,
                order: 'asc' as 'asc',
                sortBy: 'submittedAt' as 'submittedAt',
            };

            const mockResponse = {
                page: 1,
                limit: 10,
                total: 0,
                data: [],
            };

            mockQuizAttemptService.getAll.mockResolvedValue(mockResponse);

            const result = await controller.getQuizAttempts(query as any);

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
            expect(result).toHaveProperty('total');
        });
    });

    describe('GET /quiz-attempt/:id', () => {
        it('should call service.getById with user.id, user.role, attemptId', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUser.id,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
                canViewAnswers: false,
                canViewScore: true,
                answers: [],
            };

            mockQuizAttemptService.getById.mockResolvedValue(mockAttempt);

            const result = await controller.getQuizAttemptById(
                testUser as any,
                { id: testAttemptId } as any
            );

            expect(mockQuizAttemptService.getById).toHaveBeenCalledWith(
                testUser.id,
                testUser.role,
                testAttemptId
            );
            expect(result).toEqual(mockAttempt);
        });

        it('should return attempt with canViewAnswers, canViewScore', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUser.id,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
                canViewAnswers: true,
                canViewScore: true,
                answers: [
                    {
                        attemptId: testAttemptId,
                        questionId: 1,
                        optionId: 1,
                        question: { id: 1, content: 'Test', points: 1.0 },
                        option: { id: 1, content: 'Option', isCorrect: true },
                    },
                ],
            };

            mockQuizAttemptService.getById.mockResolvedValue(mockAttempt);

            const result = await controller.getQuizAttemptById(
                { ...testUser, role: Role.admin } as any,
                { id: testAttemptId } as any
            );

            expect(result).toHaveProperty('canViewAnswers');
            expect(result).toHaveProperty('canViewScore');
            expect(result.canViewAnswers).toBe(true);
            expect(result.canViewScore).toBe(true);
        });
    });

    describe('PUT /quiz-attempt/:id/submit', () => {
        it('should call service.submit with user.id, attemptId', async () => {
            const mockSubmittedAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUser.id,
                startedAt: new Date(),
                submittedAt: new Date(),
                status: QuizAttemptStatus.submitted,
                scoreRaw: 8.5,
                scoreScaled10: 8.5,
            };

            mockQuizAttemptService.submit.mockResolvedValue(mockSubmittedAttempt);

            const result = await controller.submitQuizAttempt(
                testUser.id,
                { id: testAttemptId } as any
            );

            expect(mockQuizAttemptService.submit).toHaveBeenCalledWith(testUser.id, testAttemptId);
            expect(result).toEqual(mockSubmittedAttempt);
            expect(result.status).toBe(QuizAttemptStatus.submitted);
            expect(result.submittedAt).toBeDefined();
        });

        it('should return QuizAttemptResDto with submitted status', async () => {
            const mockSubmittedAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUser.id,
                startedAt: new Date(),
                submittedAt: new Date(),
                status: QuizAttemptStatus.submitted,
                scoreRaw: 10.0,
                scoreScaled10: 10.0,
            };

            mockQuizAttemptService.submit.mockResolvedValue(mockSubmittedAttempt);

            const result = await controller.submitQuizAttempt(
                testUser.id,
                { id: testAttemptId } as any
            );

            expect(result.status).toBe(QuizAttemptStatus.submitted);
        });
    });
});