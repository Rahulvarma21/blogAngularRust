import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for Two-Way Binding

@Component({
  selector: 'app-binding-demo',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './binding-demo.html',
  styleUrl: './binding-demo.css'
})
export class BindingDemo {
  // A. Interpolation
  title: string = "Binding Demo Component";

  // B. Property Binding
  isDisabled: boolean = false;
  imgUrl: string = "https://picsum.photos/150";

  // C. Event Binding
  count: number = 0;

  increment() {
    this.count++;
  }

  // D. Two-Way Binding
  username: string = "";

  // Helper properties and methods for the Case Study
  cartQuantity: number = 1;

  decreaseCart() {
    if (this.cartQuantity > 1) {
      this.cartQuantity--;
    }
  }

  increaseCart() {
    this.cartQuantity++;
  }
}
