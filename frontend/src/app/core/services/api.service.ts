import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  // Native Component Separation: Angular Components shouldn't touch `HttpClient` directly!
  getProtectedUsers(): Observable<User[]> {
    // 1. We specifically append our explicit explicit Authentication Header
    const headers = new HttpHeaders({
        'Authorization': 'Bearer safe-angular-token'
    });

    // 2. We execute hitting the CORS-protected Axum structure 
    return this.http.get<User[]>(`${this.baseUrl}/users`, { headers });
  }

  // Demonstration: Hitting API WITHOUT valid token to intentionally cause an HTTP 401 Rejection Error!
  getUnauthorizedUsers(): Observable<any> {
    const headers = new HttpHeaders({
        'Authorization': 'Bearer bad-token-hacker'
    });
    return this.http.get(`${this.baseUrl}/users`, { headers });
  }
}
