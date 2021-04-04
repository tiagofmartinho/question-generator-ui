import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AppService } from './app.service';
import { Interaction } from './model/interaction.model';
import { QuestionAnswersMapping } from './model/question-answers-mapping.model';
import { User } from './model/user.model';
import 'codemirror/mode/clike/clike';
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
  interaction: Interaction;
  phase = 0;
  loading = false;
  allAnswersCorrect = true;
  defaultCode = 'public class Main {}';
  code = this.defaultCode;
  user: User;

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

  updateValues(event): void {
    this.phase = event.phase;
    this.user = event.user;
    this.code = event.code;
    this.loading = event.loading;
    this.interaction = event.interaction;
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
    this.interaction = null;
  }

  omitSpecialChars(event): boolean {
    let k;
    k = event.keyCode;
    return ((k > 64 && k < 91) || (k > 96 && k < 123) || k === 8 || k === 32 || (k >= 48 && k <= 57)) || k === 95 || k === 13;
  }
}
