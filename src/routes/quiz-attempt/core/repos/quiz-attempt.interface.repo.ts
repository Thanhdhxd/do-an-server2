import { Prisma, QuizAttempt } from "@prisma/client";

type QuizAttemptWithDetails = Prisma.QuizAttemptGetPayload<{
    include: {
        lesson: {
            select: {
                id: true,
                showQuizAnswers: true,
                showQuizScore: true,
            }
        },
        answers: {
            include: {
                question: true,
                option: true,
            }
        }
    }
}>;

export interface IQuizAttemptRepo {
    create(data: {
        lessonId: number,
        quizId: number,
        studentId: number,
    }): Promise<QuizAttempt>;
    count(where: Prisma.QuizAttemptWhereInput): Promise<number>;
    findMany(where: Prisma.QuizAttemptWhereInput, orderBy: object, skip: number, take: number): Promise<QuizAttempt[]>;
    findById(id: number): Promise<QuizAttempt | null>;
    findByIdWithDetails(id: number): Promise<QuizAttemptWithDetails | null>;
    update(id: number, data: Prisma.QuizAttemptUpdateInput): Promise<QuizAttempt>;
}