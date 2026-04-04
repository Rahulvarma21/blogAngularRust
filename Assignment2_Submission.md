# Pull Request: Angular Route Guard Access Control

## Description
This PR implements route-level security in the Angular application by introducing an Authentication Service and an `AuthGuard` using the `CanActivate` interface.

## Route Security Overview
- **Public Routes:** `/home` and `/login` are fully accessible to any user without logging in.
- **Protected Routes:** `/dashboard` cannot be accessed unless the user is securely logged in.

## How the Guard Works
The `AuthGuard` implements the `CanActivate` interface, injecting both the `AuthService` and `Router`. Whenever a user attempts to navigate to `/dashboard`, the Angular Router first pauses and triggers `canActivate()`.
1. The guard checks `authService.isLoggedIn()`.
2. If it returns `true`, the guard returns `true`, allowing navigation to proceed.
3. If it returns `false`, the guard explicitly prevents navigation by returning `false` AND fires `router.navigate(['/login'])` to redirect the user to the safe public route.

## Authentication State
The authentication state is tracked via a reactive `signal<boolean>` (or boolean property) initialized to `false` located in the `Auth` Service (`core/auth/auth.ts`). Components can inject `Auth` to either read state (`isLoggedIn()`) or toggle state (`login()` and `logout()`).

## Route Map
- `/` -> Redirects to `/home`
- `/home` -> `HomeComponent` *(Public)*
- `/login` -> `LoginComponent` *(Public)*
- `/dashboard` -> `DashboardComponent` *(Protected by `AuthGuard`)*

> Don't forget to attach screenshots demonstrating exactly how the app redirects you when attempting to access `/dashboard` whilst logged out! Also include screenshots of being able to view the Dashboard if you authenticate properly.

---

# Video Presentation Script / Case Study Answers

*To be verbally explained in your video demo:*

**Case Study Question:**
Your application has a public Home page and a protected Dashboard page.
Explain:
1. How you configure the routes
2. How the route guard checks authentication state
3. What happens when a logged-out user directly enters the dashboard URL
4. How redirection improves both security and user experience

**Answer for Video:**
To establish this setup, I configured the routes in `app.routes.ts` by mapping the paths to their respective components. The critical difference is that I added `canActivate: [AuthGuard]` exclusively to the Dashboard route object. 

The `AuthGuard` implements the classic `CanActivate` interface. Inside the `canActivate()` lifecycle method, it injects my `AuthService` and checks the `.isLoggedIn()` boolean. If the user is logged out, the Guard denies access by resolving to `false`.

If a logged-out user maliciously or accidentally tries to directly enter the `/dashboard` URL into their browser search bar, the Angular Router intercepts the request immediately. Instead of rendering the Dashboard, the `AuthGuard` determines the user is unauthenticated, blocks the routing event entirely, and then programmatically triggers a redirect instructing the router to navigate to `/login` without ever reloading the browser page!

This redirection paradigm massively improves security because the protected JavaScript and HTML templates are shielded from unauthorized visibility. Simultanously, it severely improves user experience (UX) because rather than trapping the user on a broken page or a dead-end Error 401 Screen, we seamlessly guide them to the action they *must* take first (Logging in) and we do so instantly and fluidly through Angular's Single Page Application architecture.
