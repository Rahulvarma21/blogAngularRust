import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Auth } from '../auth/auth'; // Injected Auth loop internally mapping dependency

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root' 
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8080';

  constructor(private http: HttpClient, private authService: Auth) {}

  private getAuthHeaders(): HttpHeaders {
    // Explicitly pulls the raw stored token straight from Auth constraints natively encapsulating mapping targets perfectly!
    const token = this.authService.getToken() || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private handleCentralizedError(err: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown Request validation error occurred.';
    
    if (err.status === 0) {
      errorMessage = "Network Error: Unable to connect to the Rust Backend. Is the server booted?";
    } else if (err.status === 401 || err.status === 403) {
      errorMessage = "Authentication Error: " + (err.error?.error || "Invalid credentials provided.");
    } else if (err.status === 404) {
      errorMessage = "Not Found: " + (err.error?.error || "The requested specific item does not exist in the Database.");
    } else if (err.status >= 500) {
      errorMessage = "Server Error: The backend encountered an unpredictable panic.";
    } else if (err.error?.error) {
      errorMessage = err.error.error;
    }

    return throwError(() => new Error(errorMessage));
  }

  getProtectedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers: this.getAuthHeaders() })
      .pipe(catchError((err) => this.handleCentralizedError(err))); 
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }

  // Demonstration helper
  getUnauthorizedUsers(): Observable<any> {
    const headers = new HttpHeaders({ 'Authorization': 'Bearer bad-token-hacker' });
    return this.http.get(`${this.baseUrl}/users`, { headers })
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }
}
