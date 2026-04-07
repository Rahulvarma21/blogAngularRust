import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private loggedIn = signal<boolean>(false);
  private baseUrl = 'http://127.0.0.1:8080';

  constructor(private http: HttpClient) {
    if (this.getToken()) {
      this.loggedIn.set(true);
    }
  }

  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_auth_token');
  }

  login(credentials: { email: string, password: string }): Observable<any> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        // Intercept validated token and store structurally guarding Auth persistence
        localStorage.setItem('jwt_auth_token', response.token);
        this.loggedIn.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem('jwt_auth_token');
    this.loggedIn.set(false);
  }
}
