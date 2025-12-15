import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/shared/services/prisma.service';
import { QuizAttemptRepo } from '../repos/quiz-attempt.repo';
import { QuizAttemptStatus } from '@prisma/client';

describe('QuizAttemptRepo - INMEMORY DATABASE', () => {
    let repo: QuizAttemptRepo;
    let prismaService: PrismaService;
    let testClassroomId: number;
    let testQuizId: number;
    let testLessonId: number;
    let testStudentId: number;
    let testAttemptId: number;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizAttemptRepo,
                {
                    provide: PrismaService,
                    useValue: {
                        quizAttempt: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            update: jest.fn(),
                            count: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        repo = module.get<QuizAttemptRepo>(QuizAttemptRepo);
        prismaService = module.get<PrismaService>(PrismaService);

        // Setup test data IDs
        testClassroomId = 1;
        testQuizId = 1;
        testLessonId = 1;
        testStudentId = 1;
        testAttemptId = 1;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new QuizAttempt with auto-generated ID', async () => {
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

            jest.spyOn(prismaService.quizAttempt, 'create').mockResolvedValue(mockAttempt);

            const result = await repo.create({
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
            });

            expect(result).toEqual(mockAttempt);
            expect(result.status).toBe(QuizAttemptStatus.in_progress);
            expect(result.id).toBeDefined();
            expect(prismaService.quizAttempt.create).toHaveBeenCalledWith({
                data: {
                    lessonId: testLessonId,
                    quizId: testQuizId,
                    studentId: testStudentId,
                },
            });
        });

        it('should have default status = in_progress', async () => {
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

            jest.spyOn(prismaService.quizAttempt, 'create').mockResolvedValue(mockAttempt);

            const result = await repo.create({
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
            });

            expect(result.status).toBe(QuizAttemptStatus.in_progress);
            expect(result.submittedAt).toBeNull();
            expect(result.scoreRaw).toBeNull();
            expect(result.scoreScaled10).toBeNull();
        });
    });

    describe('findById', () => {
        it('should find attempt by ID', async () => {
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

            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue(mockAttempt);

            const result = await repo.findById(testAttemptId);

            expect(result).toEqual(mockAttempt);
            expect(prismaService.quizAttempt.findUnique).toHaveBeenCalledWith({
                where: { id: testAttemptId },
            });
        });

        it('should return null if attempt does not exist', async () => {
            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue(null);

            const result = await repo.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('findByIdWithDetails', () => {
        it('should include lesson (showQuizAnswers, showQuizScore)', async () => {
            const mockAttemptWithDetails = {
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
                answers: [],
            };

            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue(mockAttemptWithDetails);

            const result = await repo.findByIdWithDetails(testAttemptId);

            expect(result).toEqual(mockAttemptWithDetails);
            expect(result?.lesson).toBeDefined();
            expect(result?.lesson.showQuizAnswers).toBeDefined();
            expect(result?.lesson.showQuizScore).toBeDefined();
            expect(prismaService.quizAttempt.findUnique).toHaveBeenCalledWith({
                where: { id: testAttemptId },
                include: {
                    lesson: {
                        select: {
                            id: true,
                            showQuizAnswers: true,
                            showQuizScore: true,
                        },
                    },
                    answers: {
                        include: {
                            question: true,
                            option: true,
                        },
                    },
                },
            });
        });

        it('should include answers with question and option', async () => {
            const mockAttemptWithDetails = {
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
                    showQuizAnswers: true,
                    showQuizScore: true,
                },
                answers: [
                    {
                        attemptId: testAttemptId,
                        questionId: 1,
                        optionId: 1,
                        question: {
                            id: 1,
                            content: 'Test question',
                            points: 1.0,
                        },
                        option: {
                            id: 1,
                            content: 'Test option',
                            isCorrect: true,
                        },
                    },
                ],
            };

            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue(mockAttemptWithDetails);

            const result = await repo.findByIdWithDetails(testAttemptId);

            expect(result?.answers).toBeDefined();
            expect(result?.answers.length).toBeGreaterThan(0);
            expect(result?.answers[0].question).toBeDefined();
            expect(result?.answers[0].option).toBeDefined();
        });
    });

    describe('update', () => {
        it('should update status and submittedAt', async () => {
            const submittedAt = new Date();
            const mockUpdatedAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: new Date(),
                submittedAt: submittedAt,
                status: QuizAttemptStatus.submitted,
                scoreRaw: null,
                scoreScaled10: null,
            };

            jest.spyOn(prismaService.quizAttempt, 'update').mockResolvedValue(mockUpdatedAttempt);

            const result = await repo.update(testAttemptId, {
                status: QuizAttemptStatus.submitted,
                submittedAt: submittedAt,
            });

            expect(result.status).toBe(QuizAttemptStatus.submitted);
            expect(result.submittedAt).toEqual(submittedAt);
        });

        it('should update scoreRaw and scoreScaled10', async () => {
            const mockUpdatedAttempt = {
                id: testAttemptId,
                lessonId: testLessonId,
                quizId: testQuizId,
                studentId: testStudentId,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: 8.5,
                scoreScaled10: 8.5,
            };

            jest.spyOn(prismaService.quizAttempt, 'update').mockResolvedValue(mockUpdatedAttempt);

            const result = await repo.update(testAttemptId, {
                scoreRaw: 8.5,
                scoreScaled10: 8.5,
            });

            expect(result.scoreRaw).toBe(8.5);
            expect(result.scoreScaled10).toBe(8.5);
        });
    });

    describe('findMany', () => {
        it('should support pagination and ordering', async () => {
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

            jest.spyOn(prismaService.quizAttempt, 'findMany').mockResolvedValue(mockAttempts);

            const result = await repo.findMany(
                { studentId: testStudentId },
                { submittedAt: 'desc' },
                0,
                10
            );

            expect(result).toEqual(mockAttempts);
            expect(prismaService.quizAttempt.findMany).toHaveBeenCalledWith({
                where: { studentId: testStudentId },
                orderBy: { submittedAt: 'desc' },
                skip: 0,
                take: 10,
            });
        });
    });

    describe('count', () => {
        it('should count attempts by where condition', async () => {
            jest.spyOn(prismaService.quizAttempt, 'count').mockResolvedValue(5);

            const result = await repo.count({ studentId: testStudentId });

            expect(result).toBe(5);
            expect(prismaService.quizAttempt.count).toHaveBeenCalledWith({
                where: { studentId: testStudentId },
            });
        });

        it('should return 0 when no attempts match', async () => {
            jest.spyOn(prismaService.quizAttempt, 'count').mockResolvedValue(0);

            const result = await repo.count({ studentId: 999 });

            expect(result).toBe(0);
        });
    });
});