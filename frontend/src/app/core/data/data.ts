import { Injectable } from '@angular/core';

export interface Item {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private items: Item[] = [
    { id: 1, name: 'Angular Router', description: 'Enables navigation from one view to the next.' },
    { id: 2, name: 'Services & Dependency Injection', description: 'A great way to share information among classes.' },
    { id: 3, name: 'RxJS & Observables', description: 'Handle asynchronous operations smoothly.' }
  ];

  // Store the last viewed item to demonstrate maintaining state across route changes
  private lastViewedItemId: number | null = null;

  getItems(): Item[] {
    return this.items;
  }

  getItemById(id: number): Item | undefined {
    return this.items.find(item => item.id === id);
  }

  setLastViewed(id: number) {
    this.lastViewedItemId = id;
  }

  getLastViewed(): number | null {
    return this.lastViewedItemId;
  }
}
