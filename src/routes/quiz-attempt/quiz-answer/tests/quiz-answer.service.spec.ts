import { Test, TestingModule } from '@nestjs/testing';
import { QuizAnswerService } from '../services/quiz-answer.service';
import { IQuizAnswerRepo } from '../repos/quiz-answer.interface.repo';
import { QuestionType, QuizAttemptStatus } from '@prisma/client';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('QuizAnswerService - MOCK repositories', () => {
    let service: QuizAnswerService;
    let mockQuizAnswerRepo: jest.Mocked<IQuizAnswerRepo>;
    
    const testUserId = 1;
    const testAttemptId = 1;
    const testQuestionId = 1;
    const testOptionId = 1;

    beforeEach(async () => {
        mockQuizAnswerRepo = {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAttemptWithAnswers: jest.fn(),
            updateAttemptScore: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizAnswerService,
                {
                    provide: 'IQuizAnswerRepo',
                    useValue: mockQuizAnswerRepo,
                },
            ],
        }).compile();

        service = module.get<QuizAnswerService>(QuizAnswerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('upsertAnswer', () => {
        const mockAttempt = {
            id: testAttemptId,
            lessonId: 1,
            quizId: 1,
            studentId: testUserId,
            startedAt: new Date(),
            submittedAt: null,
            status: QuizAttemptStatus.in_progress,
            scoreRaw: null,
            scoreScaled10: null,
            answers: [],
        };

        it('should create new answer', async () => {
            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValue(mockAttempt);
            mockQuizAnswerRepo.create.mockResolvedValue({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            });

            const updatedAttemptWithAnswers = {
                ...mockAttempt,
                answers: [
                    {
                        attemptId: testAttemptId,
                        questionId: testQuestionId,
                        optionId: testOptionId,
                        question: {
                            id: testQuestionId,
                            quizId: 1,
                            sectionId: null,
                            groupId: null,
                            content: 'Test question',
                            explanation: null,
                            questionType: QuestionType.single_choice,
                            points: 1.0,
                            orderIndex: 0,
                        },
                        option: {
                            id: testOptionId,
                            questionId: testQuestionId,
                            content: 'Test option',
                            isCorrect: true,
                            orderIndex: 0,
                        },
                    },
                ],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(updatedAttemptWithAnswers);
            mockQuizAnswerRepo.updateAttemptScore.mockResolvedValue(null as any);
            mockQuizAnswerRepo.findMany.mockResolvedValue([updatedAttemptWithAnswers.answers[0]]);

            const result = await service.upsertAnswer(testUserId, testAttemptId, {
                questionId: testQuestionId,
                optionId: testOptionId,
            });

            expect(mockQuizAnswerRepo.create).toHaveBeenCalledWith({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            });
            expect(result).toBeDefined();
        });

        it('should change existing answer (delete old, create new)', async () => {
            const existingAnswer = {
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: 1,
                question: {
                    id: testQuestionId,
                    quizId: 1,
                    sectionId: null,
                    groupId: null,
                    content: 'Test question',
                    explanation: null,
                    questionType: QuestionType.single_choice,
                    points: 1.0,
                    orderIndex: 0,
                },
                option: {
                    id: 1,
                    questionId: testQuestionId,
                    content: 'Old option',
                    isCorrect: false,
                    orderIndex: 0,
                },
            };

            const attemptWithOldAnswer = {
                ...mockAttempt,
                answers: [existingAnswer],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(attemptWithOldAnswer);
            mockQuizAnswerRepo.delete.mockResolvedValue(existingAnswer);
            mockQuizAnswerRepo.create.mockResolvedValue({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: 2,
            });

            const updatedAttempt = {
                ...mockAttempt,
                answers: [
                    {
                        ...existingAnswer,
                        optionId: 2,
                        option: {
                            id: 2,
                            questionId: testQuestionId,
                            content: 'New option',
                            isCorrect: true,
                            orderIndex: 0,
                        },
                    },
                ],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(updatedAttempt);
            mockQuizAnswerRepo.updateAttemptScore.mockResolvedValue(null as any);
            mockQuizAnswerRepo.findMany.mockResolvedValue([updatedAttempt.answers[0]]);

            await service.upsertAnswer(testUserId, testAttemptId, {
                questionId: testQuestionId,
                optionId: 2,
            });

            expect(mockQuizAnswerRepo.delete).toHaveBeenCalledWith({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: 1,
            });
            expect(mockQuizAnswerRepo.create).toHaveBeenCalledWith({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: 2,
            });
        });

        it('should automatically calculate score after answering', async () => {
            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.create.mockResolvedValue({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            });

            const updatedAttempt = {
                ...mockAttempt,
                answers: [
                    {
                        attemptId: testAttemptId,
                        questionId: testQuestionId,
                        optionId: testOptionId,
                        question: {
                            id: testQuestionId,
                            quizId: 1,
                            sectionId: null,
                            groupId: null,
                            content: 'Test',
                            explanation: null,
                            questionType: QuestionType.single_choice,
                            points: 2.0,
                            orderIndex: 0,
                        },
                        option: {
                            id: testOptionId,
                            questionId: testQuestionId,
                            content: 'Correct',
                            isCorrect: true,
                            orderIndex: 0,
                        },
                    },
                ],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(updatedAttempt);
            mockQuizAnswerRepo.updateAttemptScore.mockResolvedValue(null as any);
            mockQuizAnswerRepo.findMany.mockResolvedValue([updatedAttempt.answers[0]]);

            await service.upsertAnswer(testUserId, testAttemptId, {
                questionId: testQuestionId,
                optionId: testOptionId,
            });

            expect(mockQuizAnswerRepo.updateAttemptScore).toHaveBeenCalled();
        });

        it('should throw NotFoundException if attempt does not exist', async () => {
            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValue(null);

            await expect(
                service.upsertAnswer(testUserId, 999, {
                    questionId: testQuestionId,
                    optionId: testOptionId,
                })
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if attempt.studentId !== userId', async () => {
            const otherUserAttempt = {
                ...mockAttempt,
                studentId: 999,
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValue(otherUserAttempt);

            await expect(
                service.upsertAnswer(testUserId, testAttemptId, {
                    questionId: testQuestionId,
                    optionId: testOptionId,
                })
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if attempt.status = submitted', async () => {
            const submittedAttempt = {
                ...mockAttempt,
                status: QuizAttemptStatus.submitted,
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValue(submittedAttempt);

            await expect(
                service.upsertAnswer(testUserId, testAttemptId, {
                    questionId: testQuestionId,
                    optionId: testOptionId,
                })
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if attempt.status = graded', async () => {
            const gradedAttempt = {
                ...mockAttempt,
                status: QuizAttemptStatus.graded,
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValue(gradedAttempt);

            await expect(
                service.upsertAnswer(testUserId, testAttemptId, {
                    questionId: testQuestionId,
                    optionId: testOptionId,
                })
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('calculateScore', () => {
        it('should calculate earnedPoints = sum of correct answers', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUserId,
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
                            quizId: 1,
                            sectionId: null,
                            groupId: null,
                            content: 'Q1',
                            explanation: null,
                            questionType: QuestionType.single_choice,
                            points: 2.0,
                            orderIndex: 0,
                        },
                        option: {
                            id: 1,
                            questionId: 1,
                            content: 'Correct',
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
                            sectionId: null,
                            groupId: null,
                            content: 'Q2',
                            explanation: null,
                            questionType: QuestionType.single_choice,
                            points: 3.0,
                            orderIndex: 1,
                        },
                        option: {
                            id: 3,
                            questionId: 2,
                            content: 'Wrong',
                            isCorrect: false,
                            orderIndex: 0,
                        },
                    },
                ],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.create.mockResolvedValue({
                attemptId: testAttemptId,
                questionId: 1,
                optionId: 1,
            });
            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.updateAttemptScore.mockResolvedValue(null as any);
            mockQuizAnswerRepo.findMany.mockResolvedValue([mockAttempt.answers[0]]);

            await service.upsertAnswer(testUserId, testAttemptId, {
                questionId: 1,
                optionId: 1,
            });

            // earnedPoints = 2.0 (only Q1 is correct)
            // totalPoints = 2.0 + 3.0 = 5.0
            // scoreScaled10 = (2.0 / 5.0) * 10 = 4.0
            expect(mockQuizAnswerRepo.updateAttemptScore).toHaveBeenCalledWith(
                testAttemptId,
                2.0,
                4.0
            );
        });

        it('should calculate scoreScaled10 = (earnedPoints / totalPoints) * 10', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUserId,
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
                            quizId: 1,
                            sectionId: null,
                            groupId: null,
                            content: 'Q1',
                            explanation: null,
                            questionType: QuestionType.single_choice,
                            points: 1.0,
                            orderIndex: 0,
                        },
                        option: {
                            id: 1,
                            questionId: 1,
                            content: 'Correct',
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
                            sectionId: null,
                            groupId: null,
                            content: 'Q2',
                            explanation: null,
                            questionType: QuestionType.single_choice,
                            points: 1.0,
                            orderIndex: 1,
                        },
                        option: {
                            id: 3,
                            questionId: 2,
                            content: 'Correct',
                            isCorrect: true,
                            orderIndex: 0,
                        },
                    },
                ],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.create.mockResolvedValue({
                attemptId: testAttemptId,
                questionId: 1,
                optionId: 1,
            });
            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.updateAttemptScore.mockResolvedValue(null as any);
            mockQuizAnswerRepo.findMany.mockResolvedValue([mockAttempt.answers[0]]);

            await service.upsertAnswer(testUserId, testAttemptId, {
                questionId: 1,
                optionId: 1,
            });

            // earnedPoints = 2.0, totalPoints = 2.0, scoreScaled10 = 10.0
            expect(mockQuizAnswerRepo.updateAttemptScore).toHaveBeenCalledWith(
                testAttemptId,
                2.0,
                10.0
            );
        });

        it('should return 0 if totalPoints = 0', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUserId,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
                answers: [],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.create.mockResolvedValue({
                attemptId: testAttemptId,
                questionId: 1,
                optionId: 1,
            });
            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.updateAttemptScore.mockResolvedValue(null as any);
            mockQuizAnswerRepo.findMany.mockResolvedValue([]);

            await service.upsertAnswer(testUserId, testAttemptId, {
                questionId: 1,
                optionId: 1,
            });

            expect(mockQuizAnswerRepo.updateAttemptScore).toHaveBeenCalledWith(
                testAttemptId,
                0,
                0
            );
        });
    });

    describe('deleteAnswer', () => {
        it('should delete answer and recalculate score', async () => {
            const existingAnswer = {
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
                question: {
                    id: testQuestionId,
                    quizId: 1,
                    sectionId: null,
                    groupId: null,
                    content: 'Test',
                    explanation: null,
                    questionType: QuestionType.single_choice,
                    points: 1.0,
                    orderIndex: 0,
                },
                option: {
                    id: testOptionId,
                    questionId: testQuestionId,
                    content: 'Test',
                    isCorrect: true,
                    orderIndex: 0,
                },
            };

            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUserId,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
                answers: [existingAnswer],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(mockAttempt);
            mockQuizAnswerRepo.delete.mockResolvedValue(existingAnswer);

            const updatedAttempt = { ...mockAttempt, answers: [] };
            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValueOnce(updatedAttempt);
            mockQuizAnswerRepo.updateAttemptScore.mockResolvedValue(null as any);

            const result = await service.deleteAnswer(testUserId, testAttemptId, testQuestionId);

            expect(mockQuizAnswerRepo.delete).toHaveBeenCalledWith({
                attemptId: testAttemptId,
                questionId: testQuestionId,
                optionId: testOptionId,
            });
            expect(mockQuizAnswerRepo.updateAttemptScore).toHaveBeenCalled();
            expect(result.message).toBeDefined();
        });

        it('should throw NotFoundException if answer does not exist', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUserId,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
                answers: [],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValue(mockAttempt);

            await expect(
                service.deleteAnswer(testUserId, testAttemptId, 999)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if attempt is submitted', async () => {
            const mockAttempt = {
                id: testAttemptId,
                lessonId: 1,
                quizId: 1,
                studentId: testUserId,
                startedAt: new Date(),
                submittedAt: new Date(),
                status: QuizAttemptStatus.submitted,
                scoreRaw: null,
                scoreScaled10: null,
                answers: [
                    {
                        attemptId: testAttemptId,
                        questionId: testQuestionId,
                        optionId: testOptionId,
                        question: {
                            id: testQuestionId,
                            quizId: 1,
                            sectionId: null,
                            groupId: null,
                            content: 'Test Question',
                            explanation: null,
                            questionType: QuestionType.single_choice,
                            points: 1.0,
                            orderIndex: 0,
                        },
                        option: {
                            id: testOptionId,
                            questionId: testQuestionId,
                            content: 'Option',
                            isCorrect: true,
                            orderIndex: 0,
                        },
                    },
                ],
            };

            mockQuizAnswerRepo.findAttemptWithAnswers.mockResolvedValue(mockAttempt);

            await expect(
                service.deleteAnswer(testUserId, testAttemptId, testQuestionId)
            ).rejects.toThrow(BadRequestException);
        });
    });
});