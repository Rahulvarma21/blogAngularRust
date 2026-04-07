import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, User } from '../../../core/services/api.service';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError, startWith, filter } from 'rxjs/operators';

interface DetailViewModel {
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-detail',
  standalone: false,
  templateUrl: './detail.html',
})
export class Detail implements OnInit {
  // 1. Reactive ViewModel Stream (Assignment 24 Core)
  // This single observable manages the entire data lifecycle: Loading -> Success OR Error.
  vm$!: Observable<DetailViewModel>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.initializeViewModel();
  }

  private initializeViewModel() {
    // 2. RxJS Operator Mastery: Using switchMap for Route Parameter Changes.
    // Why switchMap? It automatically cancels the inner API call if the route ID changes again rapidly!
    this.vm$ = this.route.paramMap.pipe(
      map(params => params.get('id')),
      filter((id): id is string => !!id),
      map(id => parseInt(id, 10)),
      switchMap(id => this.apiService.getUserById(id).pipe(
        // Mapping successful API responses to the ViewModel structure
        map(user => ({ user, loading: false, error: null })),
        
        // 3. Graceful Error Handling: Intercepts backend crashes natively
        catchError((err: Error) => of({ 
          user: null, 
          loading: false, 
          error: err.message || "Unable to parse User from Database constraints." 
        })),
        
        // 4. Reactive Loading State Initiation
        startWith({ user: null, loading: true, error: null })
      ))
    );
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
