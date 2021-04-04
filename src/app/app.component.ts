import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AppService } from './app.service';
import { Interaction } from './model/interaction.model';
import { User } from './model/user.model';
import 'codemirror/mode/clike/clike';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild('codeEditor', { static: false }) codeEditor: CodemirrorComponent;
  interaction: Interaction = { qas: [] };
  phase = 0;
  loading = false;
  defaultCode = 'public class Main {}';
  code = this.defaultCode;
  user: User;

  constructor(private service: AppService, private toastr: ToastrService) {}

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

  codeSubmissionUpdate(event): void {
    this.phase = event.phase;
    this.user = event.user;
    this.code = event.code;
    this.loading = event.loading;
    this.interaction = event.interaction;
  }

  private handleError(error: HttpErrorResponse): void {
    console.log(error);
    if (error.status === 500) {
      this.toastr.error(
        'O servidor não está disponível neste momento ou houve um erro a processar o teu pedido. Por favor tenta mais tarde.'
      );
    }
  }

  cleanup(event): void {
    this.code = this.defaultCode;
    this.interaction = null;
    this.phase = 1;
  }
}
