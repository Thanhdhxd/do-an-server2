/**
 * File: test/helpers/mock-factory.helper.ts
 * 
 * Chức năng:
 * - Tạo mock objects cho unit tests
 * - Mock repositories, services với jest.fn()
 */

import { IJoinreqRepo } from "src/routes/joinreq/repos/joinreq.interface.repo";
import { IClassroomRepo } from "src/routes/classroom/repos/classroom.interface.repo";
import { IUserRepo } from "src/routes/user/repos/user.interface.repo";
import { IAuthRepo } from "src/routes/auth/repos/auth.interface.repo";
import { IExerciseRepo } from "src/routes/exercise/repos/exercise.interface.repo";
import { ILessonRepo } from "src/routes/lesson/repos/lesson.interface.repo";
import { IQuizRepo } from "src/routes/quiz/core/repos/quiz.interface.repo";
import { IMediaRepo } from "src/routes/media/repos/media.interface.repo";
import { ILectureRepo } from "src/routes/lecture/repos/lecture.interface.repo";
import { IExerciseSubmissionRepo } from "src/routes/exercise-submission/repos/exercise-submisison.interface.repo";
import { IQuizAttemptRepo } from "src/routes/quiz-attempt/core/repos/quiz-attempt.interface.repo";
import { IQuizAnswerRepo } from "src/routes/quiz-attempt/quiz-answer/repos/quiz-answer.interface.repo";
import { IQuestionRepo } from "src/routes/quiz/question/repos/question.interface.repo";
import { IQuestionGroupRepo } from "src/routes/quiz/question-group/repos/question-group.interface.repo";
import { IQuizSectionRepo } from "src/routes/quiz/quiz-section/repos/quiz-section.interface.repo";
import { IQuestionOptionRepo } from "src/routes/quiz/question-option/repos/question-option.interface.repo";

export class MockFactory {
    // ==================== JOINREQ ====================
    static createMockJoinreqRepo(): jest.Mocked<IJoinreqRepo> {
        return {
            findById: jest.fn(),
            findUnique: jest.fn(),
            createJoinRequest: jest.fn(),
            update: jest.fn(),
            countClassrooms: jest.fn(),
            findClassrooms: jest.fn(),
        } as jest.Mocked<IJoinreqRepo>;
    }

    // ==================== CLASSROOM ====================
    static createMockClassroomRepo(): jest.Mocked<IClassroomRepo> {
        return {
            count: jest.fn(),
            findMany: jest.fn(),
            findClassroomWithStdJreq: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        } as jest.Mocked<IClassroomRepo>;
    }

    // ==================== USER ====================
    static createMockUserRepo(): jest.Mocked<IUserRepo> {
        return {
            count: jest.fn(),
            findMany: jest.fn(),
        } as jest.Mocked<IUserRepo>;
    }

    // ==================== AUTH ====================
    static createMockAuthRepo(): jest.Mocked<IAuthRepo> {
        return {
            createUser: jest.fn(),
            createOtpCode: jest.fn(),
            findOtpCode: jest.fn(),
            deleteOtpCode: jest.fn(),
            createRefreshToken: jest.fn(),
            findRefreshToken: jest.fn(),
            deleteRefreshToken: jest.fn(),
        } as jest.Mocked<IAuthRepo>;
    }

    // ==================== EXERCISE ====================
    static createMockExerciseRepo(): jest.Mocked<IExerciseRepo> {
        return {
            create: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
        } as jest.Mocked<IExerciseRepo>;
    }

    // ==================== LESSON ====================
    static createMockLessonRepo(): jest.Mocked<ILessonRepo> {
        return {
            create: jest.fn(),
            findByClassroomId: jest.fn(),
        } as jest.Mocked<ILessonRepo>;
    }

    // ==================== QUIZ ====================
    static createMockQuizRepo(): jest.Mocked<IQuizRepo> {
        return {
            create: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            findById: jest.fn(),
            findByIdWithDetails: jest.fn(),
            update: jest.fn(),
        } as jest.Mocked<IQuizRepo>;
    }

    // ==================== MEDIA ====================
    static createMockMediaRepo(): jest.Mocked<IMediaRepo> {
        return {
            create: jest.fn(),
            findById: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any;
    }

    // ==================== LECTURE ====================
    static createMockLectureRepo(): jest.Mocked<ILectureRepo> {
        return {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findByParentId: jest.fn(),
        } as any;
    }

    // ==================== EXERCISE SUBMISSION ====================
    static createMockExerciseSubmissionRepo(): jest.Mocked<IExerciseSubmissionRepo> {
        return {
            create: jest.fn(),
            findById: jest.fn(),
            findByLessonAndStudent: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        } as any;
    }

    // ==================== QUIZ ATTEMPT ====================
    static createMockQuizAttemptRepo(): jest.Mocked<IQuizAttemptRepo> {
        return {
            create: jest.fn(),
            findById: jest.fn(),
            findByQuizAndStudent: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            countAttempts: jest.fn(),
        } as any;
    }

    // ==================== QUIZ ANSWER ====================
    static createMockQuizAnswerRepo(): jest.Mocked<IQuizAnswerRepo> {
        return {
            createMany: jest.fn(),
            findByAttemptId: jest.fn(),
            deleteByAttemptId: jest.fn(),
            upsertAnswers: jest.fn(),
        } as any;
    }

    // ==================== QUIZ QUESTION ====================
    static createMockQuestionRepo(): jest.Mocked<IQuestionRepo> {
        return {
            create: jest.fn(),
            findById: jest.fn(),
            findByQuizId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any;
    }

    // ==================== QUIZ QUESTION GROUP ====================
    static createMockQuestionGroupRepo(): jest.Mocked<IQuestionGroupRepo> {
        return {
            create: jest.fn(),
            findById: jest.fn(),
            findByQuizId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any;
    }

    // ==================== QUIZ SECTION ====================
    static createMockQuizSectionRepo(): jest.Mocked<IQuizSectionRepo> {
        return {
            create: jest.fn(),
            findById: jest.fn(),
            findByQuizId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any;
    }

    // ==================== QUIZ OPTION ====================
    static createMockQuestionOptionRepo(): jest.Mocked<IQuestionOptionRepo> {
        return {
            create: jest.fn(),
            createMany: jest.fn(),
            findById: jest.fn(),
            findByQuestionId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any;
    }

    // ==================== PRISMA CLIENT ====================
    static createMockPrismaClient(): any {
        return {
            user: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
            classroom: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
            joinRequest: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
            classroomStudent: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            lesson: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            quiz: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            quizAttempt: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            exercise: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            exerciseSubmission: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            media: {
                create: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
            $connect: jest.fn(),
            $disconnect: jest.fn(),
            $transaction: jest.fn(),
            $executeRaw: jest.fn(),
            $executeRawUnsafe: jest.fn(),
            $queryRaw: jest.fn(),
            $queryRawUnsafe: jest.fn(),
        };
    }
}