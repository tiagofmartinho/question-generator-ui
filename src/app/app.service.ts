import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { CodeSubmissionResponse } from "./model/code-submission-response.model";
import { QuestionAnswersMapping } from "./model/question-answers-mapping.model";
import {User} from "./model/user.model";

@Injectable()
export class AppService {
    constructor(private http: HttpClient) {}

    submitCode(code: string, user: User): Observable<CodeSubmissionResponse> {
        return this.http.post<CodeSubmissionResponse>(`${environment.baseUrl}/code`, { code, user, languageCode: 'pt' },
          { headers: new HttpHeaders({ 'Content-Type': 'application/json'})});
    }

    submitAnswers(userId: number, qas: QuestionAnswersMapping[]): Observable<Map<number, string>> {
        return this.http.post<Map<number, string>>(`${environment.baseUrl}/answer`, { userId, questionsAnswers: qas },
          { headers: new HttpHeaders({ 'Content-Type': 'application/json'})});
    }
}
