import { Injectable, signal, computed } from '@angular/core';

export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface CartItem extends Product {
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class State {
  // Using Angular Signals as best-practices for single source of truth reactive state
  private cartItems = signal<CartItem[]>([]);
  public cartItems$ = computed(() => this.cartItems());

  private error = signal<string | null>(null);
  public error$ = computed(() => this.error());

  // Exposed API to interact with the state securely
  addToCart(product: Product) {
    this.error.set(null); // Reset error state on new action

    // EDGE CASE Handling: Invalid item check
    if (!product || product.price < 0) {
      this.error.set('Invalid product: Cannot add product with negative price or null properties.');
      return;
    }

    this.cartItems.update((currentItems) => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      // If the item exists in the cart, increase quantity instead of pushing a duplicate
      if (existingItem) {
        return currentItems.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentItems, { ...product, quantity: 1 }];
    });
  }

  removeFromCart(id: number) {
    // EDGE CASE Handling: Prevent modifying cart if empty
    if (this.cartItems().length === 0) {
      this.error.set('Cart is already empty, nothing to remove.');
      return;
    }
    
    this.cartItems.update((currentItems) => 
      currentItems.filter(item => item.id !== id)
    );
  }

  clearCart() {
    this.cartItems.set([]);
    this.error.set(null);
  }

  isCartEmpty(): boolean {
    return this.cartItems().length === 0;
  }
}
