import {Question} from './question.model';

export class QuestionAnswersMapping {
    question?: Question
    userAnswer?: string;
    correctAnswer?: string;

    constructor(question?: Question, userAnswer?: string, correctAnswer?: string) {
        this.question = question;
        this.userAnswer = userAnswer;
        this.correctAnswer = correctAnswer;
    }
}
