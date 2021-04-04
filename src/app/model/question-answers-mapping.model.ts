import {Question} from './question.model';

export interface QuestionAnswersMapping {
    question?: Question;
    userAnswer?: string;
    correctAnswer?: string;
}
