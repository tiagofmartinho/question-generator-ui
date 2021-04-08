import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { GoogleLoginProvider, SocialAuthService } from 'angularx-social-login';
import { User } from '../model/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  @Output() loginEvent = new EventEmitter<{user: User, phase: number}>();

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
      this.loginEvent.emit({ user, phase: 1});
    });
  }
}
