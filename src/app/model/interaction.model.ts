import { QuestionAnswersMapping } from './question-answers-mapping.model';

export interface Interaction {
    userId?: number;
    qas?: QuestionAnswersMapping[];
}
