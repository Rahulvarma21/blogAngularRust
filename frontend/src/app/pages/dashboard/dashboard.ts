import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/auth/auth';
import { Router } from '@angular/router';
import { ApiService, User } from '../../core/services/api.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, throttleTime, tap } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  users: User[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = false;
  
  // 1. Debounce Implementation: Limits API calls while typing
  private searchSubject = new Subject<string>();
  
  // 2. Throttle Implementation: Limits high-frequency clicks (e.g. Refresh button)
  private refreshSubject = new Subject<void>();
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: Auth, 
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.setupSubjects();
    this.fetchUsersSafely();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubjects() {
    // Debounce for search: Wait until user stops typing for 400ms!
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => this.isLoading = true),
      switchMap(query => this.apiService.searchUsers(query)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.handleErrorResponse(err);
      }
    });

    // Throttle for refresh: Limit to one call per 2 seconds to prevent button mashing!
    this.refreshSubject.pipe(
      throttleTime(2000),
      tap(() => this.fetchUsersSafely(true)), // Forced refresh specifically clears the cache!
      takeUntil(this.destroy$)
    ).subscribe();
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  onRefresh() {
    this.refreshSubject.next();
  }

  fetchUsersSafely(force: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getProtectedUsers(force).subscribe({
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
    if (this.isLoading) return; 
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getUnauthorizedUsers().subscribe({
      next: (data) => {
        console.log("Unauthorized hit succeeded unexpectedly!", data);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.handleErrorResponse(err);
      }
    });
  }

  handleErrorResponse(err: any) {
    this.errorMessage = err.message || "An unknown error occurred.";
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
