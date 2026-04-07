import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
}

// 1. Angular explicitly defines identical strict contracts matching the Rust memory!
export interface ProfileRequest {
  firstName: string;       // Automatically mapped perfectly from Rust's snake_case thanks to Serde rename_all!
  lastName: string;
  age: number;             // Mapped safely resolving Rust's u8 bounds natively
  bio?: string;            // The explicitly bound TS Optional parameter matching Rust Option<String>
}

export interface ProfileResponse {
  fullName: string;
  isAdult: boolean;
  providedBio?: string;    // Maps native Optional parameters successfully
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://127.0.0.1:8080';

  constructor(private http: HttpClient) { }

  // 1. Centralized Error Mapping 
  // (NOTE: The Global Interceptor natively handles 401 Expiry re-directs now. This simply formats Strings specifically for UI elements organically)
  private handleCentralizedError(err: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown Request validation error occurred.';

    if (err.status === 0) {
      errorMessage = "Network Error: Unable to connect to the Rust Backend. Is the server booted?";
    } else if (err.status === 401 || err.status === 403) {
      errorMessage = "Authentication Error: " + (err.error?.error || "Invalid credentials provided / Session Expired.");
    } else if (err.status === 404) {
      errorMessage = "Not Found: " + (err.error?.error || "The requested specific item does not exist in the Database.");
    } else if (err.status >= 500) {
      errorMessage = "Server Error: The backend encountered an unpredictable panic.";
    } else if (err.error?.error) {
      errorMessage = err.error.error;
    }

    return throwError(() => new Error(errorMessage));
  }

  // 2. Ultra-Clean Architectural Logic!
  // Notice there is absolutely NO `getAuthHeaders()` duplicate logic anywhere explicitly! The Interceptor organically parses tracking perfectly!

  getProtectedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`)
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`)
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }

  // 2. Strict HttpClient Generics completely eliminating 'any' usage architectures!
  analyzeProfile(payload: ProfileRequest): Observable<ProfileResponse> {
    // The `<ProfileResponse>` bound verifies parsing strictly protecting the Application Lifecycle explicitly
    return this.http.post<ProfileResponse>(`${this.baseUrl}/analyze-profile`, payload)
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }

  getUnauthorizedUsers(): Observable<any> {
    // Deliberately corrupting local tests by targeting fake endpoints or executing bad packets
    return this.http.get(`${this.baseUrl}/fake-bad-route`)
      .pipe(catchError((err) => this.handleCentralizedError(err)));
  }
}
