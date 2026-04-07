import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from './auth';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const router = inject(Router);
  
  // Natively skips attempting to embed strings tracking public login configurations structurally!
  const isApiUrl = req.url.startsWith('http://127.0.0.1:8080');
  const isAuthRoute = req.url.includes('/login');

  let activeRequest = req;

  // Centralized Token Attachment!
  if (isApiUrl && !isAuthRoute) {
    const token = authService.getToken();
    if (token) {
      activeRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(activeRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Architectural Hook catching 401/403 tokens universally parsing expiration inherently!
      if (error.status === 401 || error.status === 403) {
        console.warn("Security Alert: Token structurally invalidated natively!");
        authService.logout(); // Natively drops Local Storage Token
        router.navigate(['/login']); // Redirect securely
      }
      return throwError(() => error);
    })
  );
};
