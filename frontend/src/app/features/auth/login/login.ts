import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/auth/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html'
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loginError = null;

    // Dispatches actual Network call binding payload securely!
    this.auth.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        // On successful token isolation perfectly navigates past guards
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        // The Backend natively returns HTTP 401 Unauthorized mapping err.error.error organically
        this.loginError = err.error?.error || 'Invalid credentials or Network failure.';
      }
    });
  }
}
