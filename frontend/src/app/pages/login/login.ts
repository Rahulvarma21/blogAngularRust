import { Component } from '@angular/core';
import { Auth } from '../../core/auth/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
})
export class Login {
  constructor(public authService: Auth, private router: Router) {}

  login() {
    this.authService.login();
    // After logging in, redirect to protected dashboard
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
  }
}
