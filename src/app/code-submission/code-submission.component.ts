import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {User} from '../model/user.model';
import {Subscription} from 'rxjs';
import {AppService} from '../app.service';
import {Question} from '../model/question.model';
import {Interaction} from '../model/interaction.model';
import {ToastrService} from 'ngx-toastr';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-code-submission',
  templateUrl: './code-submission.component.html',
  styleUrls: ['./code-submission.component.scss']
})
export class CodeSubmissionComponent implements OnInit {
  @Input() phase: number;
  @Input() user: User;
  @Input() code: string;
  @Input() loading: boolean;
  @Input() interaction: Interaction;
  @Output() codeSubmissionEvent = new EventEmitter <{ phase: number, user: User, code: string, loading: boolean, interaction: Interaction }>();

  constructor(private service: AppService, private toastr: ToastrService) { }

  ngOnInit(): void {
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
        this.codeSubmissionEvent.emit({phase: this.phase, user: this.user, code: this.code, loading: this.loading, interaction: this.interaction});
      },
      (error) => {
        this.handleError(error);
        this.loading = false;
      }
    );
  }

  private mapQuestionsToModel(questions: Question[]): void {
    if (questions?.length > 0) {
      questions.forEach((q) =>
        this.interaction.qas.push({question: q })
      );
      this.phase = 2;
    } else {
      this.toastr.error(
        'Não foram geradas questões para o teu código. Adiciona pelo menos uma função à tua submissão.'
      );
    }
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

  private handleError(error: HttpErrorResponse): void {
    console.log(error);
    if (error.status === 400) {
      if (error.error.message === 'invalid_code') {
        this.toastr.error(
          'O teu código tem erros. Por favor submete código sintaticamente correto.'
        );
      }
    }
    else if (error.status === 500) {
      this.toastr.error(
        'O servidor não está disponível neste momento ou houve um erro a processar o teu pedido. Por favor tenta mais tarde.'
      );
    }
  }
}