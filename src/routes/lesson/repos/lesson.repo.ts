import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ILessonRepo } from './lesson.interface.repo'
import { Exercise, Lecture, Lesson, LessonType, Quiz } from '@prisma/client'

@Injectable()
export class LessonRepo implements ILessonRepo {
    constructor(private readonly prismaService: PrismaService) {}

    async create(data: {
        classroomId: number
        lessonType: LessonType
        lectureId?: number
        exerciseId?: number
        quizId?: number
        orderIndex?: number
        exerciseDueAt?: Date | null
        quizStartAt?: Date | null
        quizEndAt?: Date | null
    }): Promise<Lesson> {
        return this.prismaService.lesson.create({
            data: {
                classroomId: data.classroomId,
                lessonType: data.lessonType,
                lectureId: data.lectureId,
                exerciseId: data.exerciseId,
                quizId: data.quizId,
                orderIndex: data.orderIndex ?? 0,
                exerciseDueAt: data.exerciseDueAt,
                quizStartAt: data.quizStartAt,
                quizEndAt: data.quizEndAt,
            },
        })
    }

    async findByClassroomId(classroomId: number): Promise<any[]> {
        const lessons = await this.prismaService.lesson.findMany({
            where: {
                classroomId,
                deletedAt: null,
            },
            include: {
                lecture: {
                    where: { deletedAt: null },
                },
                exercise: {
                    where: { deletedAt: null },
                },
                quiz: {
                    where: { deletedAt: null },
                },
            },
            orderBy: {
                orderIndex: 'asc',
            },
        })

        // For each lecture lesson, fetch the full tree
        for (const lesson of lessons) {
            if (lesson.lecture && lesson.lectureId) {
                lesson.lecture = await this.getLectureTree(lesson.lectureId)
            }
        }

        return lessons
    }

    private async getLectureTree(lectureId: number): Promise<any> {
        const lecture = await this.prismaService.lecture.findUnique({
            where: { id: lectureId, deletedAt: null },
        })

        if (!lecture) {
            return null
        }

        const children = await this.prismaService.lecture.findMany({
            where: {
                parentId: lectureId,
                deletedAt: null,
            },
        })

        const lectureWithChildren: any = { ...lecture }

        if (children.length > 0) {
            lectureWithChildren.children = await Promise.all(
                children.map((child) => this.getLectureTree(child.id))
            )
        }

        return lectureWithChildren
    }
}