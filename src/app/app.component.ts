import {Component} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AppService } from './app.service';
import { Interaction } from './model/interaction.model';
import { QuestionAnswersMapping } from './model/question-answers-mapping.model';
import {GoogleLoginProvider, SocialAuthService} from 'angularx-social-login';
import {User} from './model/user.model';
import 'codemirror/mode/clike/clike';
import {Question} from './model/question.model';
import {HttpErrorResponse} from '@angular/common/http';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import * as _ from "lodash";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  faTimes = faTimes
  faCheck = faCheck
  answerTemplate = 'A resposta correta para esta questão é:'

  interaction = new Interaction([]);
  phase = 0;
  loading = false;
  allAnswersCorrect = true;
  user: User;
  code: string;

  constructor(private service: AppService, private toastr: ToastrService, private authService: SocialAuthService){}

  login() {
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID).then(user => {
      this.user = new User(user.firstName, user.lastName, user.email);
      console.log(this.user);
      this.phase = 1;
    });
  }

  submitCode() {
    this.loading = true;
    return this.service.submitCode(this.code, this.user)
    .toPromise().then(
      (data) => {
        console.log(data);
        this.user.userId = data?.userId;
        this.interaction.userId = data?.userId;
        this.mapQuestionsToModel(data?.questions)
        this.loading = false;
      }, (error) => {
        this.handleError(error);
        this.loading = false;
      });
  }

  submitAnswers() {
    this.loading = true;
    AppComponent.convertCollectionStringToProperFormat(this.interaction.qas)
    return this.service.submitAnswers(this.interaction.userId, this.interaction.qas)
    .toPromise().then((data) => {
      console.log(data);
      this.mapCorrectAnswersToInteractionModel(data);
      this.showResultsToast();
      this.phase = 3;
      this.loading = false;
    }, (error) => {
      this.handleError(error);
      this.loading = false;
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);
    if (error.status === 400) {
      if (error.error.message === 'invalid_code') {
        this.toastr.error('O teu código tem erros. Por favor submete código sintaticamente correto.');
      }
      else {
        this.toastr.error('Submissão inválida. Por favor preenche todos os campos.')
      }
    } else if (error.status === 500) {
      this.toastr.error('O servidor não está disponível neste momento ou houve um erro a processar o teu pedido. Por favor tenta mais tarde.')
    }
  }

  private mapQuestionsToModel(questions: Question[]) {
    if (questions?.length > 0) {
      questions.forEach(q => this.interaction.qas.push(new QuestionAnswersMapping(q)));
      this.phase = 2;
    } else {
      this.toastr.error('Não foram geradas questões para o teu código. Adiciona pelo menos uma função à tua submissão.')
    }
  }

  private mapCorrectAnswersToInteractionModel(data: Map<number, string>) {
    for (const [questionId, correctAnswer] of Object.entries(data)) {
      this.interaction.qas.forEach(qa => {
        if (qa.question.questionId.toString() === questionId) {
          qa.correctAnswer = correctAnswer;
          this.checkAnswer(qa);
        }
      });
    }
  }

  private checkAnswer(qa: QuestionAnswersMapping) {
    if (this.isAnswerIncorrect(qa)) this.allAnswersCorrect = false;
  }

  private static isCollection(qa: QuestionAnswersMapping): boolean {
    return qa.question.returnType === 'COLLECTION' &&
      _.isEqual(AppComponent.convertCollectionStringFormatToSet(qa.correctAnswer), AppComponent.convertCollectionStringFormatToSet(qa.userAnswer));
  }

  private static convertCollectionStringFormatToSet(collectionString: string): Set<string> {
    const arr = collectionString.slice(1, -1).replace(/\s+/g, '').split(',');
    return new Set(arr);
  }

  private static convertCollectionStringToProperFormat(list: QuestionAnswersMapping[]) {
    list.forEach(qa => {
      if (qa?.question?.returnType == 'COLLECTION') {
        qa.userAnswer = "[" + qa?.userAnswer?.split(/[\r\n]+/).toString() + "]"
      }
    })
  }

  private showResultsToast() {
    if (this.allAnswersCorrect) {
      this.toastr.success('Respondeste corretamente a todas as questões!');
    } else {
      this.toastr.error('Respondeste incorretamente a pelo menos uma questão.');
    }
  }

  public isAnswerCorrect(qa: QuestionAnswersMapping) {
    return ((qa.correctAnswer != null && qa.correctAnswer == qa.userAnswer)) || (qa.correctAnswer != null && AppComponent.isCollection(qa));
  }

  public isAnswerIncorrect(qa: QuestionAnswersMapping) {
    return (qa.correctAnswer != null && qa.correctAnswer != qa.userAnswer && !AppComponent.isCollection(qa));
  }

  cleanup() {
    this.phase = 1;
    this.allAnswersCorrect = true;
    this.code = '';
    this.interaction = new Interaction([]);
  }
}
