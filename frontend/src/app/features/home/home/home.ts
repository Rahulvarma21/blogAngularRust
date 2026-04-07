import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { State, Product } from '../../../core/services/state';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
})
export class Home {
  availableProducts: Product[] = [
    { id: 1, name: 'Angular Developer Masterclass', price: 99.99 },
    { id: 2, name: 'RxJS Reactive E-Book', price: 29.99 },
    { id: 3, name: 'TypeScript Guide', price: 14.50 },
    { id: 4, name: 'Broken Product (Edge Case Demo)', price: -10 } 
  ];

  // Inject the State service via the constructor
  constructor(public stateService: State) {}

  add(product: Product) {
    // Modify shared state ONLY through exposed service methods
    this.stateService.addToCart(product);
  }
}
