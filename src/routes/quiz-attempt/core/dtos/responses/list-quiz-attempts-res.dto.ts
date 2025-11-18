import { createZodDto } from "nestjs-zod";
import z from "zod";
import { BaseListResponse } from "src/shared/models/base-list-response.model";
import { QuizAttemptSchema } from "./quiz-attempt-res.dto";

export const ListQuizAttemptsResSchema = BaseListResponse.extend({
    data: z.array(QuizAttemptSchema),
});

export class ListQuizAttemptsResDto extends createZodDto(ListQuizAttemptsResSchema) {}

export type ListQuizAttemptsResType = z.infer<typeof ListQuizAttemptsResSchema>;