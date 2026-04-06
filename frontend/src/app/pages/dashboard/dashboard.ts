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
        console.error("API Validation Failed:", err);
        // Explicitly extract the nested custom Server Backend error mapping!
        this.errorMessage = err.error?.error || "Unknown Server Failure Occurred!";
      }
    });
  }

  testUnauthorizedHit() {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getUnauthorizedUsers().subscribe({
      next: (data) => {
        console.log("This shouldn't happen!", data);
      },
      error: (err) => {
        this.isLoading = false;
        // Extracts the explicit Http 401 Axum Exception directly onto the UI!
        this.errorMessage = err.error?.error || "Authentication Error Triggered!";
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
