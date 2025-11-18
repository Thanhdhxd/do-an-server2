import { QuizAttempt } from "@prisma/client";
import { CreateQuizAttemptReqType } from "../dtos/requests/create-quiz-attempt-req.dto";
import { ListQuizAttemptsResType } from "../dtos/responses/list-quiz-attempts-res.dto";
import { QuizAttemptQueryType } from "../dtos/queries/quiz-attempt-query.dto";
import { ResponseMessage } from "src/shared/types/response-message.type";

export type QuizAttemptDetailType = {
    id: number;
    lessonId: number;
    quizId: number;
    studentId: number;
    startedAt: Date;
    submittedAt: Date | null;
    status: string;
    scoreRaw: number | null;
    scoreScaled10: number | null;
    canViewAnswers: boolean;
    canViewScore: boolean;
    answers?: any[];
};

export interface IQuizAttemptService {
    create(studentId: number,data: CreateQuizAttemptReqType): Promise<QuizAttempt>;
    getAll(query: QuizAttemptQueryType): Promise<ListQuizAttemptsResType>;
    getById(userId: number, userRole: string, attemptId: number): Promise<QuizAttemptDetailType>;
    submit(userId: number, attemptId: number): Promise<QuizAttempt>;
}