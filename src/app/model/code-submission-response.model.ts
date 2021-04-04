import { Question } from './question.model';

export class CodeSubmissionResponse {
  questions?: Question[];
  formattedCode?: string;
  userId?: number;
}
