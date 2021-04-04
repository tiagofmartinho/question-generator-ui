import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { GoogleLoginProvider, SocialAuthService } from 'angularx-social-login';
import { User } from '../model/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  @Output() newUserEvent = new EventEmitter<User>();
  @Output() newPhaseEvent = new EventEmitter<number>();

  constructor(private authService: SocialAuthService) {}

  ngOnInit(): void {}

  login(): void {
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID).then((data) => {
      const user: User = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };
      console.log(user);
      this.newUserEvent.emit(user);
      this.newPhaseEvent.emit(1);
    });
  }
}
