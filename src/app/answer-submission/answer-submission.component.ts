import {Component, EventEmitter, Input, OnInit, Output, TrackByFunction} from '@angular/core';
import {Subscription} from 'rxjs';
import {QuestionAnswersMapping} from '../model/question-answers-mapping.model';
import {Interaction} from '../model/interaction.model';
import {AppService} from '../app.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ToastrService} from 'ngx-toastr';
import {faCheck, faTimes} from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import {NgxSpinnerService} from 'ngx-spinner';

@Component({
  selector: 'app-answer-submission',
  templateUrl: './answer-submission.component.html',
  styleUrls: ['./answer-submission.component.scss'],
})
export class AnswerSubmissionComponent implements OnInit {
  faTimes = faTimes;
  faCheck = faCheck;
  allAnswersCorrect = true;
  answerTemplate = 'A resposta correta para esta questão é:';
  @Input() phase: number;
  @Input() interaction: Interaction;
  @Output() cleanupEvent = new EventEmitter<void>();

  constructor(private service: AppService, private toastr: ToastrService, private spinner: NgxSpinnerService) {
  }

  private static isCollection(qa: QuestionAnswersMapping): boolean {
    return (
      qa.question.returnType === 'COLLECTION' &&
      _.isEqual(
        AnswerSubmissionComponent.convertCollectionStringFormatToSet(qa.correctAnswer),
        AnswerSubmissionComponent.convertCollectionStringFormatToSet(qa.userAnswer)
      )
    );
  }

  private static convertCollectionStringToProperFormat(list: QuestionAnswersMapping[]): void {
    list.forEach((qa) => {
      if (qa?.question?.returnType == 'COLLECTION') {
        qa.userAnswer =
          '[' +
          qa?.userAnswer
            ?.trim()
            .split(/[\r\n]+/)
            .toString() +
          ']';
      }
    });
  }

  private static convertCollectionStringFormatToSet(collectionString: string): Set<string> {
    const arr = collectionString.slice(1, -1).replace(/\s+/g, '').split(',');
    return new Set(arr);
  }

  ngOnInit(): void {
  }

  trackByIndex(index, item): TrackByFunction<QuestionAnswersMapping> {
    return index;
  }

  submitAnswers(): Subscription {
    this.spinner.show();
    AnswerSubmissionComponent.convertCollectionStringToProperFormat(this.interaction.qas);
    return this.service
      .submitAnswers(this.interaction.userId, this.interaction.qas)
      .subscribe(
        (data) => {
          console.log(data);
          this.mapCorrectAnswersToInteractionModel(data);
          this.showResultsToast();
          this.phase = 3;
          this.spinner.hide();
        },
        (error) => {
          this.handleError(error);
          this.spinner.hide();
        }
      );
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

  private checkAnswer(qa: QuestionAnswersMapping): void {
    if (this.isAnswerIncorrect(qa)) {
      this.allAnswersCorrect = false;
    }
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
      (qa.correctAnswer != null && qa.correctAnswer == qa.userAnswer) ||
      (qa.correctAnswer != null && AnswerSubmissionComponent.isCollection(qa))
    );
  }

  omitSpecialChars(event): boolean {
    let k;
    k = event.keyCode;
    return (
      (k > 64 && k < 91) ||
      (k > 96 && k < 123) ||
      k === 8 ||
      k === 32 ||
      (k >= 48 && k <= 57) ||
      k === 95 ||
      k === 13
    );
  }

  private handleError(error: HttpErrorResponse): void {
    console.log(error);
    if (error.status === 400) {
      this.toastr.error(
        'Submissão inválida. Por favor preenche todos os campos.'
      );
    } else if (error.status === 500) {
      this.toastr.error(
        'O servidor não está disponível neste momento ou houve um erro a processar o teu pedido. Por favor tenta mais tarde.'
      );
    }
  }

  public isAnswerIncorrect(qa: QuestionAnswersMapping): boolean {
    return (
      qa.correctAnswer != null &&
      qa.correctAnswer != qa.userAnswer &&
      !AnswerSubmissionComponent.isCollection(qa)
    );
  }

  cleanup(): void {
    this.allAnswersCorrect = true;
    this.cleanupEvent.emit();
  }

}
