import { createZodDto } from "nestjs-zod";
import { QuizAttemptSchema } from "../responses/quiz-attempt-res.dto";
import z from "zod";

export const CreateQuizAttemptReqSchema = QuizAttemptSchema.omit({
    id: true,
    studentId: true,
    submittedAt: true,
    scoreRaw: true,
    scoreScaled10: true,
});

export class CreateQuizAttemptReqDto extends createZodDto(CreateQuizAttemptReqSchema) {}

export type CreateQuizAttemptReqType = z.infer<typeof CreateQuizAttemptReqSchema>;