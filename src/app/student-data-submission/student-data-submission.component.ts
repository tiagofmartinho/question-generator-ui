import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { User } from '../model/user.model';

@Component({
  selector: 'app-student-data-submission',
  templateUrl: './student-data-submission.component.html',
  styleUrls: ['./student-data-submission.component.scss'],
})
export class StudentDataSubmissionComponent implements OnInit {
  @Output() loginEvent = new EventEmitter<{ user: User; phase: number }>();

  user: User = {
    firstName: '',
    lastName: '',
    email: null,
    studentNumber: null,
  };

  constructor() {}

  ngOnInit(): void {}

  login(): void {
    console.log(this.user);
    this.loginEvent.emit({ user: this.user, phase: 1 });
  }
}
