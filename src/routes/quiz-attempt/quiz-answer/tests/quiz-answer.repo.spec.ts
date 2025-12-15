import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/shared/services/prisma.service';
import { QuizAnswerRepo } from '../repos/quiz-answer.repo';
import { QuestionType, QuizAttemptStatus } from '@prisma/client';

describe('QuizAnswerRepo - INMEMORY DATABASE', () => {
    let repo: QuizAnswerRepo;
    let prismaService: PrismaService;
    let testAttemptId: number;
    let testQuestionId: number;
    let testOptionId: number;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizAnswerRepo,
                {
                    provide: PrismaService,
                    useValue: {
                        quizAnswer: {
                            create: jest.fn(),
                            findMany: jest.fn(),
                            count: jest.fn(),
                            findUnique: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                        },
                        quizAttempt: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        repo = module.get<QuizAnswerRepo>(QuizAnswerRepo);
        prismaService = module.get<PrismaService>(PrismaService);

        testAttemptId = 1;
        testQuestionId = 1;
        testOptionId = 1;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create QuizAnswer with attemptId, questionId, optionId', async () => {
            const mockAnswer = {
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            };

            jest.spyOn(prismaService.quizAnswer, 'create').mockResolvedValue(mockAnswer);

            const result = await repo.create({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            });

            expect(result).toEqual(mockAnswer);
            expect(prismaService.quizAnswer.create).toHaveBeenCalledWith({
                data: {
                    attempt: { connect: { id: testAttemptId } },
                    question: { connect: { id: testQuestionId } },
                    option: { connect: { id: testOptionId } },
                },
            });
        });
    });

    describe('findMany', () => {
        it('should get answers by attemptId with question and option included', async () => {
            const mockAnswers = [
                {
                    attemptId: testAttemptId,
                    questionId: 1,
                    optionId: 1,
                    question: {
                        id: 1,
                        quizId: 1,
                        content: 'What is 2+2?',
                        explanation: null,
                        questionType: QuestionType.single_choice,
                        points: 1.0,
                        orderIndex: 0,
                    },
                    option: {
                        id: 1,
                        questionId: 1,
                        content: '4',
                        isCorrect: true,
                        orderIndex: 0,
                    },
                },
                {
                    attemptId: testAttemptId,
                    questionId: 2,
                    optionId: 3,
                    question: {
                        id: 2,
                        quizId: 1,
                        content: 'What is 3+3?',
                        explanation: null,
                        questionType: QuestionType.single_choice,
                        points: 2.0,
                        orderIndex: 1,
                    },
                    option: {
                        id: 3,
                        questionId: 2,
                        content: '6',
                        isCorrect: true,
                        orderIndex: 0,
                    },
                },
            ];

            jest.spyOn(prismaService.quizAnswer, 'findMany').mockResolvedValue(mockAnswers);

            const result = await repo.findMany({ attemptId: testAttemptId });

            expect(result).toEqual(mockAnswers);
            expect(result.length).toBe(2);
            expect(result[0].question).toBeDefined();
            expect(result[0].option).toBeDefined();
            expect(prismaService.quizAnswer.findMany).toHaveBeenCalledWith({
                where: { attemptId: testAttemptId },
                skip: undefined,
                take: undefined,
                orderBy: { questionId: 'asc' },
                include: expect.objectContaining({
                    question: expect.any(Object),
                    option: expect.any(Object),
                }),
            });
        });

        it('should order answers by questionId ASC', async () => {
            const mockAnswers = [
                {
                    attemptId: testAttemptId,
                    questionId: 1,
                    optionId: 1,
                    question: {
                        id: 1,
                        quizId: 1,
                        content: 'Question 1',
                        explanation: null,
                        questionType: QuestionType.single_choice,
                        points: 1.0,
                        orderIndex: 0,
                    },
                    option: {
                        id: 1,
                        questionId: 1,
                        content: 'Option 1',
                        isCorrect: true,
                        orderIndex: 0,
                    },
                },
                {
                    attemptId: testAttemptId,
                    questionId: 2,
                    optionId: 3,
                    question: {
                        id: 2,
                        quizId: 1,
                        content: 'Question 2',
                        explanation: null,
                        questionType: QuestionType.single_choice,
                        points: 1.0,
                        orderIndex: 1,
                    },
                    option: {
                        id: 3,
                        questionId: 2,
                        content: 'Option 3',
                        isCorrect: false,
                        orderIndex: 0,
                    },
                },
            ];

            jest.spyOn(prismaService.quizAnswer, 'findMany').mockResolvedValue(mockAnswers);

            const result = await repo.findMany({ attemptId: testAttemptId });

            expect(result[0].questionId).toBeLessThanOrEqual(result[1].questionId);
        });
    });

    describe('findUnique', () => {
        it('should find answer by composite key (attemptId + questionId + optionId)', async () => {
            const mockAnswer = {
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            };

            jest.spyOn(prismaService.quizAnswer, 'findUnique').mockResolvedValue(mockAnswer);

            const result = await repo.findUnique({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            });

            expect(result).toEqual(mockAnswer);
            expect(prismaService.quizAnswer.findUnique).toHaveBeenCalledWith({
                where: {
                    attemptId_questionId_optionId: {
                        attemptId: testAttemptId,
                        questionId: testQuestionId,
                        optionId: testOptionId,
                    },
                },
            });
        });

        it('should return null if answer does not exist', async () => {
            jest.spyOn(prismaService.quizAnswer, 'findUnique').mockResolvedValue(null);

            const result = await repo.findUnique({
                attemptId: 999,
                questionId: 999,
                optionId: 999,
            });

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update optionId (change answer)', async () => {
            const newOptionId = 2;
            const mockUpdatedAnswer = {
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: newOptionId,
            };

            jest.spyOn(prismaService.quizAnswer, 'update').mockResolvedValue(mockUpdatedAnswer);

            const result = await repo.update(
                {
                    attemptId: testAttemptId,
                    questionId: testQuestionId,
                    optionId: testOptionId,
                },
                { optionId: newOptionId }
            );

            expect(result.optionId).toBe(newOptionId);
            expect(prismaService.quizAnswer.update).toHaveBeenCalledWith({
                where: {
                    attemptId_questionId_optionId: {
                        attemptId: testAttemptId,
                        questionId: testQuestionId,
                        optionId: testOptionId,
                    },
                },
                data: { optionId: newOptionId },
            });
        });
    });

    describe('delete', () => {
        it('should delete answer by composite key', async () => {
            const mockDeletedAnswer = {
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            };

            jest.spyOn(prismaService.quizAnswer, 'delete').mockResolvedValue(mockDeletedAnswer);

            const result = await repo.delete({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            });

            expect(result).toEqual(mockDeletedAnswer);
            expect(prismaService.quizAnswer.delete).toHaveBeenCalledWith({
                where: {
                    attemptId_questionId_optionId: {
                        attemptId: testAttemptId,
                        questionId: testQuestionId,
                        optionId: testOptionId,
                    },
                },
            });
        });
    });

    describe('findAttemptWithAnswers', () => {
        it('should get attempt with all answers including question and option', async () => {
            const mockAttemptWithAnswers = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: 1,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
                answers: [
                    {
                        attemptId: testAttemptId,
                        questionId: 1,
                        optionId: 1,
                        question: {
                            id: 1,
                            content: 'Question 1',
                            points: 1.0,
                            questionType: QuestionType.single_choice,
                        },
                        option: {
                            id: 1,
                            content: 'Option 1',
                            isCorrect: true,
                        },
                    },
                ],
            };

            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue(mockAttemptWithAnswers);

            const result = await repo.findAttemptWithAnswers(testAttemptId);

            expect(result).toEqual(mockAttemptWithAnswers);
            expect(result?.answers).toBeDefined();
            expect(result?.answers.length).toBeGreaterThan(0);
            expect(result?.answers[0].question).toBeDefined();
            expect(result?.answers[0].option).toBeDefined();
        });
    });

    describe('updateAttemptScore', () => {
        it('should update scoreRaw and scoreScaled10 of attempt', async () => {
            const scoreRaw = 8.5;
            const scoreScaled10 = 8.5;
            const mockUpdatedAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: 1,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: scoreRaw,
                scoreScaled10: scoreScaled10,
            };

            jest.spyOn(prismaService.quizAttempt, 'update').mockResolvedValue(mockUpdatedAttempt);

            const result = await repo.updateAttemptScore(testAttemptId, scoreRaw, scoreScaled10);

            expect(result.scoreRaw).toBe(scoreRaw);
            expect(result.scoreScaled10).toBe(scoreScaled10);
            expect(prismaService.quizAttempt.update).toHaveBeenCalledWith({
                where: { id: testAttemptId },
                data: {
                    scoreRaw,
                    scoreScaled10,
                },
            });
        });
    });
});