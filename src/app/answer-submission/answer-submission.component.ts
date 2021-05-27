import {Component, EventEmitter, Input, Output, TrackByFunction} from '@angular/core';
import {Subscription} from 'rxjs';
import {QuestionAnswersMapping} from '../model/question-answers-mapping.model';
import {Interaction} from '../model/interaction.model';
import {AppService} from '../app.service';
import {HttpErrorResponse} from '@angular/common/http';
import {ToastrService} from 'ngx-toastr';
import {faCheck, faTimes} from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import {NgxSpinnerService} from 'ngx-spinner';
import {VariableRole} from '../model/variable-role.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-answer-submission',
  templateUrl: './answer-submission.component.html',
  styleUrls: ['./answer-submission.component.scss'],
})
export class AnswerSubmissionComponent {

  constructor(private service: AppService, private toastr: ToastrService, private spinner: NgxSpinnerService, private translate: TranslateService) {
  }
  faTimes = faTimes;
  oneValuePerLinePlaceholder = this.translate.instant('answerSubmission.oneValuePerLine')
  faCheck = faCheck;
  allAnswersCorrect = true;
  answerTemplate = this.translate.instant('answerSubmission.correctAnswerIs')
  variableRoles: VariableRole[] = [
    {label: this.translate.instant('answerSubmission.decrementor'), value: 'DECREMENTOR'},
    {label: this.translate.instant('answerSubmission.incrementor'), value: 'INCREMENTOR'},
    {label: this.translate.instant('answerSubmission.accumulator'), value: 'ACCUMULATOR'}
  ];
  @Input() phase: number;
  @Input() interaction: Interaction;
  @Output() cleanupEvent = new EventEmitter<void>();

  private static convertLineSeparatedStringToSet(lineSeparatedString: string): Set<string> {
    return new Set(AnswerSubmissionComponent.convertLineSeparatedStringToArray(lineSeparatedString));
  }

  private static convertSetStringToSet(setString: string): Set<string> {
    return new Set(AnswerSubmissionComponent.convertCollectionStringToArray(setString));
  }

  private static convertCollectionStringToArray(listString: string): string[] {
    return listString.slice(1, -1).split(', ');
  }

  private static convertLineSeparatedStringToArray(lineSeparatedString: string): string[] {
    return lineSeparatedString.trim().split('\n');
  }

  trackByIndex(index, item): TrackByFunction<QuestionAnswersMapping> {
    return index;
  }

  submitAnswers(): Subscription {
    this.spinner.show();
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

  removeBracketsFrom(correctAnswer: string): string {
    return correctAnswer.slice(1, -1);
  }


  mapCorrectAnswersToInteractionModel(data: Map<number, string>): void {
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
    if (this.isAnswerIncorrect(qa)) { this.allAnswersCorrect = false; }
  }

  private showResultsToast(): void {
    if (this.allAnswersCorrect) {
      this.toastr.success(this.translate.instant('answerSubmission.allAnswersCorrect'));
    } else {
      this.toastr.error(this.translate.instant('answerSubmission.submissionIncorrect'));
    }
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
        this.translate.instant('answerSubmission.invalidSubmission')
      );
    } else if (error.status === 500) {
      this.toastr.error(
        this.translate.instant('app.serverUnavailable')
      );
    }
  }

  isAnswerIncorrect(qa: QuestionAnswersMapping): boolean {
    if (qa.question.returnType == 'SET') {
      if (qa.correctAnswer != null &&
      _.isEqual(
        AnswerSubmissionComponent.convertSetStringToSet(qa.correctAnswer),
        AnswerSubmissionComponent.convertLineSeparatedStringToSet(qa.userAnswer)
      )) {
        return false;
      }
    }
    if (qa.question.returnType == 'LIST') {
      if (qa.correctAnswer != null &&
        _.isEqual(
          AnswerSubmissionComponent.convertCollectionStringToArray(qa.correctAnswer),
          AnswerSubmissionComponent.convertLineSeparatedStringToArray(qa.userAnswer))) {
        return false;
      }
    }
    return qa.correctAnswer != null && qa.correctAnswer != qa.userAnswer;
  }

  getCorrectAnswer(qa: QuestionAnswersMapping): string {
    if (qa.question.returnType == 'VARIABLEROLE') {
      return this.variableRoles.find(role => role.value == qa.correctAnswer).label;
    }
    if (qa.question.returnType === 'SET' || qa.question.returnType === 'LIST') {
      return this.removeBracketsFrom(qa.correctAnswer);
    }
    return qa.correctAnswer;
  }

  cleanup(): void {
    this.allAnswersCorrect = true;
    this.cleanupEvent.emit();
  }

}
