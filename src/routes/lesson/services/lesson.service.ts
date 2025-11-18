import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { ILessonService } from './lesson.interface.service'
import { AssignLectureReqType } from '../dtos/requests/assign-lecture.dto'
import { AssignExerciseReqType } from '../dtos/requests/assign-exercise.dto'
import { AssignQuizReqType } from '../dtos/requests/assign-quiz.dto'
import { LessonLectureResType } from '../dtos/responses/lesson-lecture-res.dto'
import { LessonExerciseResType } from '../dtos/responses/lesson-exercise-res.dto'
import { LessonQuizResType } from '../dtos/responses/lesson-quiz-res.dto'
import { LessonType } from '@prisma/client'
import type { ILessonRepo } from '../repos/lesson.interface.repo'
import { GetLessonsByClassroomQueryType } from '../dtos/queries/get-lessons-by-classroom.query'
import { LessonsListResType, LessonWithDetailsType } from '../dtos/responses/lesson-with-details-res.dto'
import { LectureTreeNodeType } from '../dtos/responses/lecture-tree.model'
import { SharedLessonRepo } from 'src/shared/repos/shared-lesson.repo'

@Injectable()
export class LessonService implements ILessonService {
    constructor(
        @Inject('ILessonRepo')
        private readonly lessonRepo: ILessonRepo,
        private readonly sharedLessonRepo: SharedLessonRepo,
    ) {}

    async assignLecture(body: AssignLectureReqType): Promise<LessonLectureResType> {
        const lecture = await this.sharedLessonRepo.findTypeLessonById(LessonType.lecture, body.lectureId)
        if (!lecture) {
            throw new NotFoundException('Không tìm thấy bài giảng')
        }
        if ('parentId' in lecture && lecture.parentId !== null) {
            throw new UnprocessableEntityException('Không thể gán bài giảng con vào bài học')
        }
        const lesson = await this.lessonRepo.create({
            classroomId: body.classroomId,
            lectureId: body.lectureId,
            orderIndex: body.orderIndex,
            lessonType: LessonType.lecture,
        })
        return lesson as LessonLectureResType
    }

    async assignExercise(body: AssignExerciseReqType): Promise<LessonExerciseResType> {
        const exercise = await this.sharedLessonRepo.findTypeLessonById(LessonType.exercise, body.exerciseId)
        if (!exercise) {
            throw new NotFoundException('Không tìm thấy bài tập')
        }
        const lesson = await this.lessonRepo.create({
            classroomId: body.classroomId,
            exerciseId: body.exerciseId,
            orderIndex: body.orderIndex,
            exerciseDueAt: body.exerciseDueAt,
            lessonType: LessonType.exercise,
        })
        return lesson as LessonExerciseResType
    }

    async assignQuiz(body: AssignQuizReqType): Promise<LessonQuizResType> {
        const quiz = await this.sharedLessonRepo.findTypeLessonById(LessonType.quiz, body.quizId)
        if (!quiz) {
            throw new NotFoundException('Không tìm thấy bài kiểm tra')
        }
        const lesson = await this.lessonRepo.create({
            classroomId: body.classroomId,
            quizId: body.quizId,
            orderIndex: body.orderIndex,
            quizStartAt: body.quizStartAt,
            quizEndAt: body.quizEndAt,
            lessonType: LessonType.quiz,
        })
        return lesson as LessonQuizResType
    }

    async getLessonsByClassroom(query: GetLessonsByClassroomQueryType): Promise<LessonsListResType> {
        const lessons = await this.lessonRepo.findByClassroomId(query.classroomId)
        
        const formattedLessons: LessonWithDetailsType[] = lessons.map((lesson) => {
            if (lesson.lessonType === LessonType.lecture && lesson.lecture) {
                return {
                    id: lesson.id,
                    classroomId: lesson.classroomId,
                    orderIndex: lesson.orderIndex,
                    createdAt: lesson.createdAt,
                    updatedAt: lesson.updatedAt,
                    deletedAt: lesson.deletedAt,
                    lessonType: lesson.lessonType,
                    lectureId: lesson.lectureId,
                    lecture: this.buildLectureTree(lesson.lecture),
                }
            } else if (lesson.lessonType === LessonType.exercise && lesson.exercise) {
                return {
                    id: lesson.id,
                    classroomId: lesson.classroomId,
                    orderIndex: lesson.orderIndex,
                    createdAt: lesson.createdAt,
                    updatedAt: lesson.updatedAt,
                    deletedAt: lesson.deletedAt,
                    lessonType: lesson.lessonType,
                    exerciseId: lesson.exerciseId,
                    exerciseDueAt: lesson.exerciseDueAt,
                    exercise: {
                        id: lesson.exercise.id,
                        title: lesson.exercise.title,
                        description: lesson.exercise.description,
                        attachMediaId: lesson.exercise.attachMediaId,
                        createdAt: lesson.exercise.createdAt,
                        updatedAt: lesson.exercise.updatedAt,
                    },
                }
            } else if (lesson.lessonType === LessonType.quiz && lesson.quiz) {
                return {
                    id: lesson.id,
                    classroomId: lesson.classroomId,
                    orderIndex: lesson.orderIndex,
                    createdAt: lesson.createdAt,
                    updatedAt: lesson.updatedAt,
                    deletedAt: lesson.deletedAt,
                    lessonType: lesson.lessonType,
                    quizId: lesson.quizId,
                    quizStartAt: lesson.quizStartAt,
                    quizEndAt: lesson.quizEndAt,
                    quiz: {
                        id: lesson.quiz.id,
                        title: lesson.quiz.title,
                        description: lesson.quiz.description,
                        timeLimit: lesson.quiz.timeLimit,
                        passingScore: lesson.quiz.passingScore,
                        gradingMethod: lesson.quiz.gradingMethod,
                        createdAt: lesson.quiz.createdAt,
                        updatedAt: lesson.quiz.updatedAt,
                    },
                }
            }
            throw new Error('Invalid lesson type or missing related data')
        })

        return {
            lessons: formattedLessons,
        }
    }

    private buildLectureTree(lecture: any): LectureTreeNodeType {
        const node: LectureTreeNodeType = {
            id: lecture.id,
            parentId: lecture.parentId,
            title: lecture.title,
            content: lecture.content,
            mediaId: lecture.mediaId,
            uploadedAt: lecture.uploadedAt,
            updatedAt: lecture.updatedAt,
        }

        if (lecture.children && lecture.children.length > 0) {
            node.children = lecture.children.map((child: any) => this.buildLectureTree(child))
        }

        return node
    }
}