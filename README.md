# 1. Angular UI Feature Explanation (Component + Service)

## Component Created — `PostListComponent`

The UI feature implemented is a **Post List Component**, which fetches and displays blog posts from the Rust backend.

### Purpose of Component

* Display list of blog posts
* Handle user interaction
* Call Angular service
* Render backend data in UI

---

## User Interaction Handling

The UI includes a **"View Posts"** button.

### Flow

1. User clicks **View Posts**
2. Angular triggers `loadPosts()` function
3. Component calls Angular service
4. Data fetched from Rust backend
5. UI updates automatically using Angular binding

---

## Angular Service — `PostService`

Angular services handle **API calls and business logic** separately from UI components.

The `PostService` uses **HttpClient** to communicate with the Rust backend.

### Service Method

```ts
getPosts(): Observable<Post[]> {
  return this.http.get<Post[]>('http://localhost:3000/posts');
}
```

### Service Flow

1. Angular sends **HTTP GET request → Rust `/posts`**
2. Rust route maps to handler
3. Handler fetches data from PostgreSQL
4. Rust returns JSON response
5. Angular service passes data to component

---

## UI Update from Backend Data

The component subscribes to the service:

```ts
this.postService.getPosts().subscribe(data => {
  this.posts = data;
});
```

When `posts` variable updates, Angular automatically **re-renders the UI**.

---

# 2. End-to-End Frontend → Backend Flow

## Architecture Flow

```
User clicks "View Posts"
        ↓
Angular Component (PostListComponent)
        ↓
Angular Service (HttpClient GET /posts)
        ↓
Rust API Route (/posts)
        ↓
Rust Handler + Business Logic
        ↓
PostgreSQL Query (Fetch posts)
        ↓
Rust JSON Response
        ↓
Angular Component receives data
        ↓
UI re-renders and displays posts
```

*(Architecture diagram image attached in PR)*

---

# 3. Code Implementation

## Angular Component

### `post-list.component.ts`

```ts
import { Component } from '@angular/core';
import { PostService } from '../services/post.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html'
})
export class PostListComponent {

  posts: any[] = [];

  constructor(private postService: PostService) {}

  loadPosts() {
    this.postService.getPosts().subscribe(data => {
      this.posts = data;
    });
  }
}
```

---

### `post-list.component.html`

```html
<button (click)="loadPosts()">View Posts</button>

<div *ngFor="let post of posts" class="post">
  <h3>{{ post.title }}</h3>
  <p>{{ post.content }}</p>
</div>
```

---

## Angular Service

### `post.service.ts`

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private apiUrl = 'http://localhost:3000/posts';

  constructor(private http: HttpClient) {}

  getPosts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
```

---

# 4. Reflection

## How Components and Services Improve Scalability and Maintainability

Using components and services makes Angular applications scalable and maintainable because it promotes **modularity, reusability, and separation of concerns**.

Components handle only UI and user interaction, while services manage API communication and business logic. This separation allows code to be easily maintained, tested, and reused across multiple components. As the application grows, modular architecture helps keep the system organized and prevents complexity from increasing.

---

# 5. AI Feedback Improvement

Before finalizing this PR, I reviewed my explanation using an AI assistant to improve clarity and structure.

### AI Suggestions Applied

* Improved explanation of component-service separation
* Added clearer step-by-step data flow
* Expanded UI update explanation
* Improved architecture clarity

The documentation was revised accordingly.

---

# Case Study (Used in Video)

## Scenario: User clicks **"View Posts"**

1. User clicks **View Posts** button in UI
2. Angular component triggers `loadPosts()`
3. Component calls Angular service
4. Service sends **GET request → Rust `/posts`**
5. Rust route maps to handler
6. Handler fetches posts from PostgreSQL
7. Rust returns JSON response
8. Angular receives data
9. UI automatically updates and displays posts