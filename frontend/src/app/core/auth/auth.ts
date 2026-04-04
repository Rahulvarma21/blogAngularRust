import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // Stores login state
  private loggedIn = signal<boolean>(false);

  // Exposes method to check login state
  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  // Toggles for demo purposes
  login() {
    this.loggedIn.set(true);
  }

  logout() {
    this.loggedIn.set(false);
  }
}
