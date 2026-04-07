import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ProfileRequest {
  firstName: string;
  lastName: string;
  age: number;
  bio?: string;
}

export interface ProfileResponse {
  fullName: string;
  isAdult: boolean;
  providedBio?: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8080';
  
  // 1. Caching Implementation: Stores the execution observable in memory.
  // Subsequent subscribers will receive the exact same cached replay stream!
  private usersCache$?: Observable<User[]>;

  constructor(private http: HttpClient) { }

  private handleCentralizedError(err: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown Request validation error occurred.';
    if (err.status === 0) {
      errorMessage = "Network Error: Unable to connect to the Rust Backend. Is the server booted?";
    } else if (err.status === 401 || err.status === 403) {
      errorMessage = "Authentication Error: Session Expired / Unauthorized.";
    } else if (err.status === 404) {
      errorMessage = "Not Found: The requested item does not exist.";
    } else if (err.error?.error) {
      errorMessage = err.error.error;
    }
    return throwError(() => new Error(errorMessage));
  }

  // Optimized Fetching: Uses shareReplay(1) to avoid redundant backend calls!
  getProtectedUsers(forceRefresh: boolean = false): Observable<User[]> {
    if (!this.usersCache$ || forceRefresh) {
      // Re-triggers the call only if forced or empty cache organically.
      this.usersCache$ = this.http.get<User[]>(`${this.baseUrl}/users`).pipe(
        shareReplay(1),
        catchError((err) => {
          this.usersCache$ = undefined; // Reset cache on error to allow retry
          return this.handleCentralizedError(err);
        })
      );
    }
    return this.usersCache$;
  }

  // Search Optimization: Will be used with Debounce in the component layer.
  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, { params: { name: query } })
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`)
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }

  analyzeProfile(payload: ProfileRequest): Observable<ProfileResponse> {
    return this.http.post<ProfileResponse>(`${this.baseUrl}/analyze-profile`, payload)
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }

  getUnauthorizedUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/fake-bad-route`)
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }
}
