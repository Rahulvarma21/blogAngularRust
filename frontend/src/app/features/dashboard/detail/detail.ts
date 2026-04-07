import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, User } from '../../../core/services/api.service';

@Component({
  selector: 'app-detail',
  standalone: false,
  templateUrl: './detail.html',
})
export class Detail implements OnInit {
  user: User | undefined;
  errorMsg: string | null = null;
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService // Identical Service seamlessly injected here!
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam !== null) {
      const id = parseInt(idParam, 10);
      this.fetchTargetUser(id);
    }
  }

  fetchTargetUser(id: number) {
    this.isLoading = true;
    this.errorMsg = null;
    
    // Natively fetching exact database IDs abstracting logic securely!
    this.apiService.getUserById(id).subscribe({
      next: (data) => {
        this.user = data;
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.isLoading = false;
        // React strictly to mapped centralized Service Error strings avoiding duplicating code structurally
        this.errorMsg = err.message;
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
