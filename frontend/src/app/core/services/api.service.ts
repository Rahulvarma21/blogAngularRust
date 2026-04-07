import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root' // Centralized abstraction encapsulating HttpClient throughout the App!
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8080';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer safe-angular-token'
    });
  }

  // 1. Centralized Error Parsing logic living strictly in the Service! This wipes out Dashboard/Detail logic duplication!
  private handleCentralizedError(err: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown Request validation error occurred.';
    
    // Natively parses and flattens HttpClient objects into purely safe String configurations for the UI Arrays
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

  // Abstracted Methods eliminating direct HttpClient component usage explicitly!
  getProtectedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers: this.getAuthHeaders() })
      .pipe(catchError((err) => this.handleCentralizedError(err))); // Centralized Piping!
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }

  getUnauthorizedUsers(): Observable<any> {
    const headers = new HttpHeaders({ 'Authorization': 'Bearer bad-token-hacker' });
    return this.http.get(`${this.baseUrl}/users`, { headers })
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }
}
