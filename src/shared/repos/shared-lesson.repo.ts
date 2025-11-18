import { Injectable } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";
import { Exercise, Lecture, LessonType, Quiz } from "@prisma/client";

@Injectable()
export class SharedLessonRepo {
    constructor(
        private readonly prismaService: PrismaService
    ) {}

    async findTypeLessonById(lessonType: LessonType, id: number): Promise<Lecture | Exercise | Quiz | null> {
        if (lessonType === LessonType.lecture) {
            return this.prismaService.lecture.findUnique({ where: { id, deletedAt: null } })
        } else if (lessonType === LessonType.exercise) {
            return this.prismaService.exercise.findUnique({ where: { id, deletedAt: null } })
        } else if (lessonType === LessonType.quiz) {
            return this.prismaService.quiz.findUnique({ where: { id, deletedAt: null } })
        }
        return null
    }
}