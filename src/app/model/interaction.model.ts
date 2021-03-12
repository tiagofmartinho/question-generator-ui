import { QuestionAnswersMapping } from "./question-answers-mapping.model";

export class Interaction {
    userId?: number;
    qas?: QuestionAnswersMapping[];

    constructor(qas?: QuestionAnswersMapping[], userId?: number) {
        this.userId = userId;
        this.qas = qas;
    }
}
