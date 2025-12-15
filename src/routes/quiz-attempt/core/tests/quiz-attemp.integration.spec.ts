import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/shared/services/prisma.service';
import { QuizAttemptService } from '../services/quiz-attempt.service';
import { QuizAnswerService } from '../../quiz-answer/services/quiz-answer.service';
import { QuizAttemptRepo } from '../repos/quiz-attempt.repo';
import { QuizAnswerRepo } from '../../quiz-answer/repos/quiz-answer.repo';
import { SharedLessonRepo } from 'src/shared/repos/shared-lesson.repo';
import { Role, QuestionType, LessonType, QuizAttemptStatus, GradingMethod } from '@prisma/client';
import { EnumOrder } from 'src/shared/constants/enum-order.constant';
import { QuizAttemptSortBy } from '../dtos/queries/quiz-attempt-query.dto';

/**
 * Test toàn bộ luồng Quiz Attempt - INMEMORY DB (Mock Implementation)
 * 
 * Note: Đây là integration test sử dụng mock để mô phỏng hành vi của database
 * Trong production, bạn nên sử dụng in-memory database thực sự (sqlite hoặc postgres test container)
 */
describe('QuizAttempt Integration Flow - MOCK DB', () => {
    let module: TestingModule;
    let prismaService: PrismaService;
    let quizAttemptService: QuizAttemptService;
    let quizAnswerService: QuizAnswerService;

    // Test data IDs
    let adminId: number;
    let student1Id: number;
    let student2Id: number;
    let classroomId: number;
    let quizId: number;
    let lessonId: number;
    let section1Id: number;
    let section2Id: number;
    let questionGroupId: number;
    let questions: any[];
    let options: any[];

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                QuizAttemptService,
                QuizAnswerService,
                QuizAttemptRepo,
                QuizAnswerRepo,
                SharedLessonRepo,
                {
                    provide: PrismaService,
                    useValue: {
                        user: { create: jest.fn(), findUnique: jest.fn() },
                        classroom: { create: jest.fn() },
                        classroomStudent: { create: jest.fn() },
                        quiz: { create: jest.fn(), findUnique: jest.fn() },
                        quizSection: { create: jest.fn() },
                        quizQuestionGroup: { create: jest.fn() },
                        quizQuestion: { create: jest.fn() },
                        quizOption: { create: jest.fn() },
                        lesson: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
                        quizAttempt: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            update: jest.fn(),
                            count: jest.fn(),
                        },
                        quizAnswer: {
                            create: jest.fn(),
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            delete: jest.fn(),
                        },
                    },
                },
                {
                    provide: 'IQuizAttemptRepo',
                    useClass: QuizAttemptRepo,
                },
                {
                    provide: 'IQuizAnswerRepo',
                    useClass: QuizAnswerRepo,
                },
            ],
        }).compile();

        prismaService = module.get<PrismaService>(PrismaService);
        quizAttemptService = module.get<QuizAttemptService>(QuizAttemptService);
        quizAnswerService = module.get<QuizAnswerService>(QuizAnswerService);

        // Initialize test data IDs
        adminId = 1;
        student1Id = 2;
        student2Id = 3;
        classroomId = 1;
        quizId = 1;
        lessonId = 1;
        section1Id = 1;
        section2Id = 2;
        questionGroupId = 1;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Complete Quiz Attempt Flow', () => {
        it('should complete the full quiz attempt workflow', async () => {
            // Setup mock data
            const mockLesson = {
                id: lessonId,
                classroomId: classroomId,
                lessonType: LessonType.quiz,
                quizId: quizId,
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

            const mockQuiz = {
                id: quizId,
                title: 'Integration Test Quiz',
                description: 'Test quiz for integration testing',
                timeLimitSec: 3600,
                maxAttempts: 2,
                shuffleQuestions: true,
                shuffleOptions: true,
                gradingMethod: GradingMethod.highest,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            // Mock questions and options
            questions = [
                {
                    id: 1,
                    quizId: quizId,
                    sectionId: section1Id,
                    groupId: null,
                    content: 'What is 2+2?',
                    explanation: 'Simple addition',
                    questionType: QuestionType.single_choice,
                    points: 1.0,
                    orderIndex: 0,
                },
                {
                    id: 2,
                    quizId: quizId,
                    sectionId: section1Id,
                    groupId: null,
                    content: 'What is 10-5?',
                    explanation: null,
                    questionType: QuestionType.single_choice,
                    points: 1.0,
                    orderIndex: 1,
                },
                {
                    id: 3,
                    quizId: quizId,
                    sectionId: section2Id,
                    groupId: null,
                    content: 'Complex question',
                    explanation: null,
                    questionType: QuestionType.single_choice,
                    points: 2.0,
                    orderIndex: 0,
                },
            ];

            options = [
                { id: 1, questionId: 1, content: '4', isCorrect: true, orderIndex: 0 },
                { id: 2, questionId: 1, content: '3', isCorrect: false, orderIndex: 1 },
                { id: 3, questionId: 1, content: '5', isCorrect: false, orderIndex: 2 },
                { id: 4, questionId: 2, content: '5', isCorrect: true, orderIndex: 0 },
                { id: 5, questionId: 2, content: '4', isCorrect: false, orderIndex: 1 },
                { id: 6, questionId: 3, content: 'Correct Answer', isCorrect: true, orderIndex: 0 },
                { id: 7, questionId: 3, content: 'Wrong Answer', isCorrect: false, orderIndex: 1 },
            ];

            // Step 1: Create quiz attempt
            const mockAttempt = {
                id: 1,
                lessonId: lessonId,
                quizId: quizId,
                studentId: student1Id,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            jest.spyOn(prismaService.quiz, 'findUnique').mockResolvedValue(mockQuiz);
            jest.spyOn(prismaService.lesson, 'findUnique').mockResolvedValue(mockLesson);
            jest.spyOn(prismaService.quizAttempt, 'create').mockResolvedValue(mockAttempt);

            const attempt = await quizAttemptService.create(student1Id, {
                lessonId: lessonId,
                quizId: quizId,
                startedAt: new Date(),
                status: QuizAttemptStatus.in_progress,
            });

            expect(attempt.status).toBe(QuizAttemptStatus.in_progress);
            expect(attempt.scoreRaw).toBeNull();
            expect(attempt.scoreScaled10).toBeNull();

            // Step 2: Answer questions
            const answer1 = {
                attemptId: attempt.id,
                questionId: 1,
                optionId: 1, // Correct
                question: questions[0],
                option: options[0],
            };

            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue({
                ...mockAttempt,
                answers: [],
            } as any);
            jest.spyOn(prismaService.quizAnswer, 'create').mockResolvedValue({
                attemptId: attempt.id,
                questionId: 1,
                optionId: 1,
            });
            jest.spyOn(prismaService.quizAnswer, 'findMany').mockResolvedValue([answer1]);

            // Mock update score
            jest.spyOn(prismaService.quizAttempt, 'update').mockImplementation((async (args: any) => {
                return {
                    ...mockAttempt,
                    scoreRaw: args.data.scoreRaw,
                    scoreScaled10: args.data.scoreScaled10,
                } as any;
            }) as any);

            const answeredQuestion1 = await quizAnswerService.upsertAnswer(student1Id, attempt.id, {
                questionId: 1,
                optionId: 1,
            });

            expect(answeredQuestion1).toBeDefined();

            // Step 3: Submit attempt
            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue(mockAttempt);
            jest.spyOn(prismaService.quizAttempt, 'update').mockResolvedValue({
                ...mockAttempt,
                status: QuizAttemptStatus.submitted,
                submittedAt: new Date(),
            });

            const submittedAttempt = await quizAttemptService.submit(student1Id, attempt.id);

            expect(submittedAttempt.status).toBe(QuizAttemptStatus.submitted);
            expect(submittedAttempt.submittedAt).toBeDefined();

            // Step 4: View results
            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue({
                ...submittedAttempt,
                lesson: mockLesson,
                answers: [answer1],
            } as any);

            const result = await quizAttemptService.getById(student1Id, Role.student, attempt.id);

            expect(result.canViewScore).toBe(true);
            expect(result.canViewAnswers).toBe(false);
            expect(result.answers[0].option.isCorrect).toBeUndefined();
        });

        it('should allow admin to view all attempts', async () => {
            const mockAttempts = [
                {
                    id: 1,
                    lessonId: lessonId,
                    quizId: quizId,
                    studentId: student1Id,
                    startedAt: new Date(),
                    submittedAt: new Date(),
                    status: QuizAttemptStatus.submitted,
                    scoreRaw: 3.0,
                    scoreScaled10: 7.5,
                },
                {
                    id: 2,
                    lessonId: lessonId,
                    quizId: quizId,
                    studentId: student2Id,
                    startedAt: new Date(),
                    submittedAt: new Date(),
                    status: QuizAttemptStatus.submitted,
                    scoreRaw: 4.0,
                    scoreScaled10: 10.0,
                },
            ];

            jest.spyOn(prismaService.quizAttempt, 'count').mockResolvedValue(2);
            jest.spyOn(prismaService.quizAttempt, 'findMany').mockResolvedValue(mockAttempts);

            const result = await quizAttemptService.getAll({
                page: 1,
                limit: 10,
                order: EnumOrder.DESC,
                sortBy: QuizAttemptSortBy.submittedAt,
            });

            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('should handle multiple attempts', async () => {
            const mockLesson = {
                id: lessonId,
                classroomId: classroomId,
                lessonType: LessonType.quiz,
                quizId: quizId,
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

            jest.spyOn(prismaService.lesson, 'findUnique').mockResolvedValue(mockLesson);

            // First attempt
            const attempt1 = {
                id: 1,
                lessonId: lessonId,
                quizId: quizId,
                studentId: student1Id,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            jest.spyOn(prismaService.quizAttempt, 'create').mockResolvedValueOnce(attempt1);

            const firstAttempt = await quizAttemptService.create(student1Id, {
                lessonId: lessonId,
                quizId: quizId,
                startedAt: new Date(),
                status: QuizAttemptStatus.in_progress,
            });

            expect(firstAttempt.id).toBe(1);

            // Second attempt
            const attempt2 = {
                id: 2,
                lessonId: lessonId,
                quizId: quizId,
                studentId: student1Id,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
            };

            jest.spyOn(prismaService.quizAttempt, 'create').mockResolvedValueOnce(attempt2);

            const secondAttempt = await quizAttemptService.create(student1Id, {
                lessonId: lessonId,
                quizId: quizId,
                startedAt: new Date(),
                status: QuizAttemptStatus.in_progress,
            });

            expect(secondAttempt.id).toBe(2);
            expect(firstAttempt.id).not.toBe(secondAttempt.id);
        });

        it('should handle quiz with no questions (scoreScaled10 = 0)', async () => {
            const mockAttempt = {
                id: 1,
                lessonId: lessonId,
                quizId: quizId,
                studentId: student1Id,
                startedAt: new Date(),
                submittedAt: null,
                status: QuizAttemptStatus.in_progress,
                scoreRaw: null,
                scoreScaled10: null,
                answers: [],
            };

            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValue(mockAttempt);
            jest.spyOn(prismaService.quizAttempt, 'update').mockResolvedValue({
                ...mockAttempt,
                scoreRaw: 0,
                scoreScaled10: 0,
            });

            const updatedAttempt = await prismaService.quizAttempt.update({
                where: { id: mockAttempt.id },
                data: { scoreRaw: 0, scoreScaled10: 0 },
            });

            expect(updatedAttempt.scoreScaled10).toBe(0);
        });

        it('should allow admin to update lesson settings and student sees changes', async () => {
            const mockAttempt = {
                id: 1,
                lessonId: lessonId,
                quizId: quizId,
                studentId: student1Id,
                startedAt: new Date(),
                submittedAt: new Date(),
                status: QuizAttemptStatus.submitted,
                scoreRaw: 3.0,
                scoreScaled10: 7.5,
                lesson: {
                    id: lessonId,
                    showQuizAnswers: false,
                    showQuizScore: true,
                },
                answers: [
                    {
                        attemptId: 1,
                        questionId: 1,
                        optionId: 1,
                        question: { id: 1, content: 'Test', points: 1.0 },
                        option: { id: 1, content: 'Correct', isCorrect: true },
                    },
                ],
            };

            // Before update
            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValueOnce(mockAttempt);

            const resultBefore = await quizAttemptService.getById(student1Id, Role.student, 1);
            expect(resultBefore.canViewAnswers).toBe(false);

            // After update
            const updatedMockAttempt = {
                ...mockAttempt,
                lesson: {
                    ...mockAttempt.lesson,
                    showQuizAnswers: true,
                },
            };

            jest.spyOn(prismaService.quizAttempt, 'findUnique').mockResolvedValueOnce(updatedMockAttempt);

            const resultAfter = await quizAttemptService.getById(student1Id, Role.student, 1);
            expect(resultAfter.canViewAnswers).toBe(true);
            expect(resultAfter.answers[0].option.isCorrect).toBeDefined();
        });
    });
});