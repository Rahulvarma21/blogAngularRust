import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/auth/auth';
import { Router } from '@angular/router';
import { ApiService, User } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  users: User[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private authService: Auth, 
    private router: Router,
    private apiService: ApiService // Injected cleanly isolating HttpClient interactions
  ) {}

  ngOnInit() {
    this.fetchUsersSafely();
  }

  fetchUsersSafely() {
    if (this.isLoading) return; // Prevent duplicate requests tracking sequentially
    this.isLoading = true;
    this.errorMessage = null;

    // Component specifically SUBSCRIBES mapping exact response formats natively
    this.apiService.getProtectedUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.handleErrorResponse(err);
      }
    });
  }

  testUnauthorizedHit() {
    if (this.isLoading) return; // Lock the button out sequentially 
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getUnauthorizedUsers().subscribe({
      next: (data) => {
        console.log("This shouldn't happen!", data);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.handleErrorResponse(err);
      }
    });
  }

  // Differentiate Error Responses cleanly shielding User visually!
  handleErrorResponse(err: any) {
    if (err.status === 0) {
      this.errorMessage = "Network Error: Unable to connect to the Rust Backend. Is the server booted?";
    } else if (err.status === 401 || err.status === 403) {
      this.errorMessage = "Authentication Error: " + (err.error?.error || "Invalid credentials provided.");
    } else if (err.status >= 500) {
      this.errorMessage = "Server Error: The backend encountered an unpredictable panic.";
    } else {
      this.errorMessage = err.error?.error || "An unknown Request validation error occurred.";
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
