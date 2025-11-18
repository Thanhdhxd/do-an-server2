import { Module } from '@nestjs/common';
import { QuizAttemptController } from './quiz-attempt.controller';
import { QuizAttemptService } from './core/services/quiz-attempt.service';
import { QuizAttemptRepo } from './core/repos/quiz-attempt.repo';
import { QuizAnswerModule } from './quiz-answer/quiz-answer.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  controllers: [QuizAttemptController],
  providers: [
    {
      provide: 'IQuizAttemptService',
      useClass: QuizAttemptService,
    },
    {
      provide: 'IQuizAttemptRepo',
      useClass: QuizAttemptRepo,
    }
  ],
  imports: [QuizAnswerModule, SharedModule],
})
export class QuizAttemptModule {}