# Pull Request: Angular Router Implementation & Data Persistence

## Description
This PR addresses the routing requirement by shifting the application architecture to be safely navigable utilizing the native Angular Router.

## Routing Structure
The application employs four distinct routes defined in `app.routes.ts`:
- **`/home`** -> The main landing area (`HomeComponent`). Maps correctly upon direct arrival at `/`.
- **`/login`** -> Houses the mocked authentication system (`LoginComponent`).
- **`/dashboard`** -> An authenticated listing view (`DashboardComponent`). Maps dynamically over a list of items using descriptive UI.
- **`/detail/:id`** -> A dynamically mapped view (`DetailComponent`) that displays individual specific configurations based on the `[routerLink]` clicked on the dashboard.

## Navigation Implementation & Services
All user-facing navigation in the core app shell uses robust `<a routerLink="...">` tags instead of outdated `href="...` traits, preventing jarring full-page browser reloads.

To maintain architecture stability, the actual data is handled via `DataService` (`core/data/data.service`). This service acts as our source of truth. 
1. `Dashboard` uses `.getItems()` locally rendering list elements.
2. Clicking 'Details' hits the router URL appending the item `id` dynamically.
3. The `Detail` component instantly interprets its URL via the injected `ActivatedRoute` instance (`route.snapshot.paramMap.get('id')`), parses the string parameter to an integer, and then issues a `.getItemById()` query to accurately pull the specific record gracefully. 
4. Edge Case: If an invalid detail `id` is somehow manipulated manually in the URL, `Detail` elegantly detects an undefined value and handles it showing an error message.
5. The specific item viewed is recorded safely into a `lastViewedId` property securely inside the `DataService`. When you click 'Back' to reach the dashboard, the data automatically persists without resetting, rendering "You recently viewed item #id"!

> Make sure to attach some screenshots demonstrating the Dashboard listing the features, and a subsequent screenshot showing a Details view explicitly displaying the URL parameters updating nicely!

--- 

# Video Presentation Script / Case Study Answers

*To be verbally explained in your video demo:*

**Case Study Question:**
Your application has a dashboard page and a detail page. When a user clicks an item on the dashboard, they are navigated to the detail page.
Explain:
1. How you configure the route for the detail page
2. How the item identifier is passed using route parameters
3. How the detail component reads the parameter
4. How a service helps fetch or maintain the selected item data

**Answer for Video:**
To establish this flow, I set up the detail route in `app.routes.ts` specifically as `path: 'detail/:id'`. That trailing `:id` syntax informs the Angular Router that it acts as a dynamic route parameter variable placeholder.

On the Dashboard side, each item block has an anchor tag taking advantage of Angular's structural directives. It implements Property Binding on the `routerLink` specifically as an array segment block: `[routerLink]="['/detail', item.id]"`. When the link is physically clicked, the router securely transforms the array segments to a string route like `/detail/1`.

Upon navigating into the `DetailComponent`, the TS logic taps into the `ActivatedRoute` Dependency. Within `ngOnInit()`, I utilize `this.route.snapshot.paramMap.get('id')` to isolate the dynamic id value directly from the active address bar! Note that you can also subscribe to `paramMap` but reading from the snapshot is perfect for single destination loads.

Finally, relying exclusively on an external injectable `DataService` to store our global object context ensures seamless data availability without bloating the components. `DetailComponent` passes the parsed identifier sequentially back into `DataService.getItemById()` which instantly traverses its array memory retaining the relevant data packet for displaying, guaranteeing zero disjointed HTTP refreshes!
