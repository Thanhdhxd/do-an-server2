import { createZodDto } from "nestjs-zod";
import { GetList } from "src/shared/queries/get-list.query";
import z from "zod";

export enum QuizAttemptSortBy {
    submittedAt = "submittedAt",
    scoreScaled10 = "scoreScaled10",
}

export const GetQuizAttempQuery = GetList.extend({
    sortBy: z.enum(QuizAttemptSortBy).default(QuizAttemptSortBy.submittedAt),
});

export class QuizAttemptQueryDto extends createZodDto(GetQuizAttempQuery) {}

export type QuizAttemptQueryType = z.infer<typeof GetQuizAttempQuery>   