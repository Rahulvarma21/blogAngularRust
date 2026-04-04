import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/auth/auth';
import { Router, RouterLink } from '@angular/router';
import { DataService, Item } from '../../core/data/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  items: Item[] = [];
  lastViewedId: number | null = null;

  constructor(
    private authService: Auth, 
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.items = this.dataService.getItems();
    this.lastViewedId = this.dataService.getLastViewed();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
