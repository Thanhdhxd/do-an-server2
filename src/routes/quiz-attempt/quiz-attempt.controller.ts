import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { IQuizAttemptService } from './core/services/quiz-attempt.interface.service';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ZodSerializerDto } from 'nestjs-zod';
import { QuizAttemptResDto } from './core/dtos/responses/quiz-attempt-res.dto';
import { CreateQuizAttemptReqDto } from './core/dtos/requests/create-quiz-attempt-req.dto';
import { ListQuizAttemptsResDto } from './core/dtos/responses/list-quiz-attempts-res.dto';
import { QuizAttemptQueryDto } from './core/dtos/queries/quiz-attempt-query.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { GetUserParamDto } from 'src/shared/dtos/get-user-param.dto';
import { GetIdParamDto } from 'src/shared/dtos/get-id-param.dto';

@Controller('quiz-attempt')
@UseGuards(RoleGuard)
export class QuizAttemptController {
    constructor(
        @Inject('IQuizAttemptService')
        private readonly quizAttemptService: IQuizAttemptService
    ) {}

    @Roles(Role.student)
    @Post()
    @ZodSerializerDto(QuizAttemptResDto)
    async createQuizAttempt(
        @CurrentUser() user: GetUserParamDto,
        @Body() body: CreateQuizAttemptReqDto
    ): Promise<QuizAttemptResDto> {
        return this.quizAttemptService.create(user.id, body);
    }

    @Get()
    @ZodSerializerDto(ListQuizAttemptsResDto)
    async getQuizAttempts(@Query() query: QuizAttemptQueryDto): Promise<ListQuizAttemptsResDto> {
        return this.quizAttemptService.getAll(query);
    }

    @Get(':id')
    async getQuizAttemptById(
        @CurrentUser() user: GetUserParamDto,
        @Param() params: GetIdParamDto
    ) {
        return this.quizAttemptService.getById(user.id, user.role, params.id);
    }

    @Roles(Role.student)
    @Put(':id/submit')
    @ZodSerializerDto(QuizAttemptResDto)
    async submitQuizAttempt(
        @CurrentUser('id') userId: number,
        @Param() params: GetIdParamDto
    ): Promise<QuizAttemptResDto> {
        return this.quizAttemptService.submit(userId, params.id);
    }
}