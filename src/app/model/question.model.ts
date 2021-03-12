export class Question {
    questionId?: number;
    question?: string;
    returnType?: string;

    constructor(questionId?: number, question?: string, returnType?: string) {
        this.questionId = questionId;
        this.question = question;
        this.returnType = returnType;
    }
}
