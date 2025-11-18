import { QuizAttemptStatus } from "@prisma/client";
import { createZodDto } from "nestjs-zod";
import z from "zod";

export const QuizAttemptSchema = z.object({
    id: z
        .number({ message: "Id là bắt buộc" })
        .int("Id phải là số nguyên")
        .positive("Id phải là số nguyên dương"),
    lessonId: z
        .number({ message: "LessonId là bắt buộc" })
        .int("LessonId phải là số nguyên")
        .positive("LessonId phải là số nguyên dương"),
    quizId: z
        .number({ message: "QuizId là bắt buộc" })
        .int("QuizId phải là số nguyên")
        .positive("QuizId phải là số nguyên dương"),
    studentId: z
        .number({ message: "StudentId là bắt buộc" })
        .int("StudentId phải là số nguyên")
        .positive("StudentId phải là số nguyên dương"),
    startedAt: z
        .date("Thời gian bắt đầu phải là một ngày hợp lệ")
        .default(() => new Date()),
    submittedAt: z
        .date("Thời gian nộp phải là một ngày hợp lệ")
        .nullable(),
    status: z
        .enum(QuizAttemptStatus, "Trạng thái không hợp lệ")
        .default(QuizAttemptStatus.in_progress),
    scoreRaw: z
        .number("Điểm thô phải là một số")
        .nullable()
        .optional(),
    scoreScaled10: z
        .number("Điểm thang 10 phải là một số")
        .nullable()
        .optional(),
});

export class QuizAttemptResDto extends createZodDto(QuizAttemptSchema) {}