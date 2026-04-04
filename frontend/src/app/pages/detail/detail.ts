import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService, Item } from '../../core/data/data';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail.html',
})
export class Detail implements OnInit {
  item: Item | undefined;
  errorMsg: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    // Read route parameter 'id'
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam !== null) {
      const id = parseInt(idParam, 10);
      this.item = this.dataService.getItemById(id);
      
      if (this.item) {
        // Track the state in our shared service
        this.dataService.setLastViewed(id);
      } else {
        this.errorMsg = 'Item not found (edge case handled)';
      }
    }
  }

  // Programmatic navigation demonstration
  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
