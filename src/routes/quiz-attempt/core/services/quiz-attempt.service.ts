import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { IQuizAttemptService } from "./quiz-attempt.interface.service";
import type { IQuizAttemptRepo } from "../repos/quiz-attempt.interface.repo";
import { CreateQuizAttemptReqType } from "../dtos/requests/create-quiz-attempt-req.dto";
import { LessonType, Prisma, QuizAttempt, Role } from "@prisma/client";
import { SharedLessonRepo } from "src/shared/repos/shared-lesson.repo";
import { ListQuizAttemptsResType } from "../dtos/responses/list-quiz-attempts-res.dto";
import { QuizAttemptQueryType } from "../dtos/queries/quiz-attempt-query.dto";
import { buildListResponse, buildOrderBy, calculatePagination } from "src/shared/utils/query.util";

@Injectable()
export class QuizAttemptService implements IQuizAttemptService {
    constructor(
        @Inject('IQuizAttemptRepo')
        private readonly quizAttemptRepo: IQuizAttemptRepo,
        private readonly sharedLessonRepo: SharedLessonRepo
    ) { }

    async create(studentId: number, data: CreateQuizAttemptReqType): Promise<QuizAttempt> {
        const lesson = await this.sharedLessonRepo.findTypeLessonById(LessonType.quiz, data.lessonId);
        if (!lesson) {
            throw new UnprocessableEntityException('Lesson không tồn tại');
        } else if ('quizId' in lesson && lesson.quizId !== data.quizId) {
            throw new UnprocessableEntityException('Quiz không thuộc lesson này');
        }
        return this.quizAttemptRepo.create({
            lessonId: data.lessonId,
            quizId: data.quizId,
            studentId: studentId,
        });
    }

    async getAll(query: QuizAttemptQueryType): Promise<ListQuizAttemptsResType> {
        const { page, limit, order, sortBy } = query;

        const where: Prisma.QuizAttemptWhereInput = {};

        const orderBy = buildOrderBy(sortBy, order);
        const { skip, take } = calculatePagination(page, limit);

        const [total, data] = await Promise.all([
            this.quizAttemptRepo.count(where),
            this.quizAttemptRepo.findMany(where, orderBy, skip, take),
        ]);

        return buildListResponse(page, limit, total, data);
    }

    async getById(userId: number, userRole: string, attemptId: number) {
        const attempt = await this.quizAttemptRepo.findByIdWithDetails(attemptId);

        if (!attempt) {
            throw new NotFoundException('Quiz attempt không tồn tại');
        }

        // Check ownership for students
        const isStudent = (userRole === Role.student);
        if (isStudent && attempt.studentId !== userId) {
            throw new ForbiddenException('Bạn chỉ có thể xem bài làm của chính mình');
        }

        // Determine permissions based on user role and lesson settings
        let canViewAnswers = true;
        let canViewScore = true;
        let answers: any[] = attempt.answers;

        if (isStudent) {
            canViewAnswers = attempt.lesson.showQuizAnswers;
            canViewScore = attempt.lesson.showQuizScore;

            // Hide answer correctness if not allowed
            if (!canViewAnswers) {
                answers = answers.map(answer => {
                    const { isCorrect, ...optionWithoutCorrect } = answer.option;
                    return {
                        ...answer,
                        option: optionWithoutCorrect,
                    };
                });
            }
        }

        return {
            id: attempt.id,
            lessonId: attempt.lessonId,
            quizId: attempt.quizId,
            studentId: attempt.studentId,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            status: attempt.status,
            scoreRaw: canViewScore ? attempt.scoreRaw : null,
            scoreScaled10: canViewScore ? attempt.scoreScaled10 : null,
            canViewAnswers,
            canViewScore,
            answers,
        };
    }

    async submit(userId: number, attemptId: number): Promise<QuizAttempt> {
        const attempt = await this.quizAttemptRepo.findById(attemptId);

        if (!attempt) {
            throw new NotFoundException('Quiz attempt không tồn tại');
        }

        if (attempt.studentId !== userId) {
            throw new ForbiddenException('Bạn chỉ có thể nộp bài của chính mình');
        }

        if (attempt.status === 'submitted') {
            throw new BadRequestException('Bài làm đã được nộp trước đó');
        }

        if (attempt.status === 'graded') {
            throw new BadRequestException('Bài làm đã được chấm điểm, không thể nộp lại');
        }

        return this.quizAttemptRepo.update(attemptId, {
            status: 'submitted',
            submittedAt: new Date(),
        });
    }
}