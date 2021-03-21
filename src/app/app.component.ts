import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AppService } from './app.service';
import { Interaction } from './model/interaction.model';
import { QuestionAnswersMapping } from './model/question-answers-mapping.model';
import { GoogleLoginProvider, SocialAuthService } from 'angularx-social-login';
import { User } from './model/user.model';
import 'codemirror/mode/clike/clike';
import { Question } from './model/question.model';
import { HttpErrorResponse } from '@angular/common/http';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { Subscription} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild('codeEditor', { static: false }) codeEditor: CodemirrorComponent;
  faTimes = faTimes;
  faCheck = faCheck;
  answerTemplate = 'A resposta correta para esta questão é:';
  interaction = new Interaction([]);
  phase = 0;
  loading = false;
  allAnswersCorrect = true;
  user: User;
  defaultCode = 'public class Main {}';
  code = this.defaultCode;

  private static isCollection(qa: QuestionAnswersMapping): boolean {
    return (
      qa.question.returnType === 'COLLECTION' &&
      _.isEqual(
        AppComponent.convertCollectionStringFormatToSet(qa.correctAnswer),
        AppComponent.convertCollectionStringFormatToSet(qa.userAnswer)
      )
    );
  }

  private static convertCollectionStringFormatToSet(
    collectionString: string
  ): Set<string> {
    const arr = collectionString.slice(1, -1).replace(/\s+/g, '').split(',');
    return new Set(arr);
  }

  private static convertCollectionStringToProperFormat(
    list: QuestionAnswersMapping[]
  ): void {
    list.forEach((qa) => {
      // tslint:disable-next-line:triple-equals
      if (qa?.question?.returnType == 'COLLECTION') {
        qa.userAnswer = '[' + qa?.userAnswer?.trim().split(/[\r\n]+/).toString() + ']';
      }
    });
  }

  constructor(
    private service: AppService,
    private toastr: ToastrService,
    private authService: SocialAuthService
  ) {}

  ngOnInit(): void {
    this.service.wakeServer().subscribe(
      (response) => {
        console.log(response);
      },
      (error) => {
        this.handleError(error);
      }
    );
  }

  login(): void {
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID).then((user) => {
      this.user = new User(user.firstName, user.lastName, user.email);
      console.log(this.user);
      this.phase = 1;
    });
  }

  getFile(event): void {
    const input = event.target;
    if ('files' in input && input.files.length > 0) {
      this.placeFileContent(input.files[0]);
    }
  }

  private placeFileContent(file): void {
    this.readFileContent(file)
      .then((content: string) => {
        this.code = content;
      })
      .catch((error) => console.log(error));
  }

  private readFileContent(file): Promise<any> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  submitCode(): Subscription {
    this.loading = true;
    return this.service.submitCode(this.code, this.user).subscribe(
      (data) => {
        console.log(data);
        this.code = data?.formattedCode;
        this.user.userId = data?.userId;
        this.interaction.userId = data?.userId;
        this.mapQuestionsToModel(data?.questions);
        this.loading = false;
      },
      (error) => {
        this.handleError(error);
        this.loading = false;
      }
    );
  }

  submitAnswers(): Subscription {
    this.loading = true;
    AppComponent.convertCollectionStringToProperFormat(this.interaction.qas);
    return this.service
      .submitAnswers(this.interaction.userId, this.interaction.qas)
      .subscribe(
        (data) => {
          console.log(data);
          this.mapCorrectAnswersToInteractionModel(data);
          this.showResultsToast();
          this.phase = 3;
          this.loading = false;
        },
        (error) => {
          this.handleError(error);
          this.loading = false;
        }
      );
  }

  private handleError(error: HttpErrorResponse): void {
    console.log(error);
    if (error.status === 400) {
      if (error.error.message === 'invalid_code') {
        this.toastr.error(
          'O teu código tem erros. Por favor submete código sintaticamente correto.'
        );
      } else {
        this.toastr.error(
          'Submissão inválida. Por favor preenche todos os campos.'
        );
      }
    } else if (error.status === 500) {
      this.toastr.error(
        'O servidor não está disponível neste momento ou houve um erro a processar o teu pedido. Por favor tenta mais tarde.'
      );
    }
  }

  private mapQuestionsToModel(questions: Question[]): void {
    if (questions?.length > 0) {
      questions.forEach((q) =>
        this.interaction.qas.push(new QuestionAnswersMapping(q))
      );
      this.phase = 2;
    } else {
      this.toastr.error(
        'Não foram geradas questões para o teu código. Adiciona pelo menos uma função à tua submissão.'
      );
    }
  }

  private mapCorrectAnswersToInteractionModel(data: Map<number, string>): void {
    for (const [questionId, correctAnswer] of Object.entries(data)) {
      this.interaction.qas.forEach((qa) => {
        if (qa.question.questionId.toString() === questionId) {
          qa.correctAnswer = correctAnswer;
          this.checkAnswer(qa);
        }
      });
    }
  }

  private checkAnswer(qa: QuestionAnswersMapping): void{
    if (this.isAnswerIncorrect(qa)) { this.allAnswersCorrect = false; }
  }

  private showResultsToast(): void {
    if (this.allAnswersCorrect) {
      this.toastr.success('Respondeste corretamente a todas as questões!');
    } else {
      this.toastr.error('Respondeste incorretamente a pelo menos uma questão.');
    }
  }

  public isAnswerCorrect(qa: QuestionAnswersMapping): boolean {
    return (
      // tslint:disable-next-line:triple-equals
      (qa.correctAnswer != null && qa.correctAnswer == qa.userAnswer) ||
      (qa.correctAnswer != null && AppComponent.isCollection(qa))
    );
  }

  public isAnswerIncorrect(qa: QuestionAnswersMapping): boolean {
    return (
      qa.correctAnswer != null &&
      // tslint:disable-next-line:triple-equals
      qa.correctAnswer != qa.userAnswer &&
      !AppComponent.isCollection(qa)
    );
  }

  cleanup(): void {
    this.phase = 1;
    this.allAnswersCorrect = true;
    this.code = this.defaultCode;
    this.interaction = new Interaction([]);
  }

  omitSpecialChars(event): boolean {
    let k;
    k = event.keyCode;
    return ((k > 64 && k < 91) || (k > 96 && k < 123) || k === 8 || k === 32 || (k >= 48 && k <= 57)) || k === 95 || k === 13;
  }
}
