import { Question } from './question.model';

export interface CodeSubmissionResponse {
  questions?: Question[];
  formattedCode?: string;
  userId?: number;
}
