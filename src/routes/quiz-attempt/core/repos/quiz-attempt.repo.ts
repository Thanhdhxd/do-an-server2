import { PrismaService } from "src/shared/services/prisma.service";
import { IQuizAttemptRepo } from "./quiz-attempt.interface.repo";
import { Prisma, QuizAttempt } from "@prisma/client";
import { Injectable } from "@nestjs/common";

@Injectable()
export class QuizAttemptRepo implements IQuizAttemptRepo {
    constructor(
        private readonly prismaService: PrismaService
    ) { }
    
    async create(data: {
        lessonId: number,
        quizId: number,
        studentId: number,
    }): Promise<QuizAttempt> {
        return this.prismaService.quizAttempt.create({
            data: {
                lessonId: data.lessonId,
                quizId: data.quizId,
                studentId: data.studentId,
            }
        });
    }

    async count(where: Prisma.QuizAttemptWhereInput): Promise<number> {
        return this.prismaService.quizAttempt.count({ where });
    }

    async findMany(
        where: Prisma.QuizAttemptWhereInput,
        orderBy: object,
        skip: number,
        take: number
    ): Promise<QuizAttempt[]> {
        return this.prismaService.quizAttempt.findMany({
            where,
            orderBy,
            skip,
            take,
        });
    }

    async findById(id: number): Promise<QuizAttempt | null> {
        return this.prismaService.quizAttempt.findUnique({
            where: { id },
        });
    }

    async findByIdWithDetails(id: number) {
        return this.prismaService.quizAttempt.findUnique({
            where: { id },
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
        });
    }

    async update(id: number, data: Prisma.QuizAttemptUpdateInput): Promise<QuizAttempt> {
        return this.prismaService.quizAttempt.update({
            where: { id },
            data,
        });
    }
}