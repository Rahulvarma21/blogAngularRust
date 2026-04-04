import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/auth/auth';
import { Router } from '@angular/router';
import { State } from '../../core/services/state';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  // Inject BOTH Auth Service for routing AND our new State Service for Cart Data
  constructor(
    private authService: Auth, 
    private router: Router,
    public stateService: State
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
