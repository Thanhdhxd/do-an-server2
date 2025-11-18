import { Exercise, Lecture, Lesson, LessonType, Quiz } from '@prisma/client'

export interface ILessonRepo {
    create(data: {
        classroomId: number
        lessonType: LessonType
        lectureId?: number
        exerciseId?: number
        quizId?: number
        orderIndex?: number
        exerciseDueAt?: Date | null
        quizStartAt?: Date | null
        quizEndAt?: Date | null
    }): Promise<Lesson>

    findByClassroomId(classroomId: number): Promise<any[]>
}
