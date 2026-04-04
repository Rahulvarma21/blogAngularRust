# Pull Request: Angular Services & Dependency Injection 

## Description
This PR integrates an Angular Service (`StateService`) specifically purposed to establish a strictly maintained Single-Source-of-Truth architecture, removing business state logic directly from our view components.

## Architecture & Dependency Injection Concept
Instead of retaining transient cart data inside Component-level properties (which die as soon as the user routes away or refreshes the view), I shifted the state persistence into an Angular `@Injectable` service (`core/services/state`). 

Because it's registered with `providedIn: 'root'`, Angular's exact **Dependency Injection (DI)** container treats it as a Singleton. I injected the service into both `HomeComponent` and `DashboardComponent` purely by listing it as a constructor parameter (`constructor(public stateService: State) {}`). Angular automatically detects the requested type and seamlessly provides the exact same persistent instance memory object to both discrete pages. This completely prevents manual `new State()` instantiation failures.

## Shared State & Edge Cases Handled
The app uses the `HomeComponent` purely as a generic Product List providing an `Add to Cart` functionality targeting the shared memory pool, and it uses `DashboardComponent` exclusively as the Cart Summary view capable of checking items out. Both directly map to `stateService.cartItems$()` computed signals ensuring reactive synchronization.

**Implemented Edge Cases (Safety Nets):**
1. **Empty Data State**: When navigating to the Dashboard while the list is functionally empty (`isCartEmpty()`), it triggers an `ngIf` directive elegantly hiding the empty array loops and replacing the table with a clean fallback message instructing the user to gather items!
2. **Invalid Update Attempt**: On the `HomeComponent` product list, clicking "Add To Cart" on the purposefully broken Product Object (`price: -10`) is intercepted by the core Service! The service explicitly rejects the state mutation, preventing corrupt items from populating the DOM, and pushes an actionable error to local reactive state `error$()`, displaying an explicit `ngIf` red dialogue on screen instantly!
3. **Duplicate Modification Avoidance**: Rather than injecting cloned objects into the array when requesting a duplicate item mapping, the service surgically maps over existing entities and safely increments a `quantity` integer locally. 

> Remember to attach screenshots depicting the `HomeComponent` pushing data to Cart, the `DashboardComponent` evaluating the full arrays, and the Edge Case Red-Box error triggering!

--- 

# Video Presentation Script / Case Study Answers

*To be verbally explained in your video demo:*

**Case Study Question:**
Your application has a product list and a cart summary displayed on different routes.
Explain how you would:
1. Store cart data in a service
2. Inject the service into both components
3. Ensure cart updates reflect instantly across the app
4. Handle the case where the cart is empty

**Answer for Video:**
To establish a stable data-passing cycle across views, I generated an Angular Service using the CLI and tracked a private `cartItems` array containing product definitions inside of it. 

To give my Product List and Cart Summary templates real-time visibility over that service storage array, I injected the service straight into their respective TS controller constructors relying strictly on Angular’s powerful Dependency Injection system! Because Angular services are provided at the root level, both components automatically latch onto the same Singleton instance inherently in-memory.

To guarantee that any state mutation explicitly cascades across the active DOMs immediately without complex polling, I adopted Angular Signals for the State variables. Whenever the user triggers the exposed `.addToCart()` method, the `cartItems` signal natively updates, instantly blasting the reactivity stream changes toward every currently subscribed view! 

Finally, since the views don’t process logic themselves, the Cart Summary gracefully checks `.isCartEmpty()` against that service. If it evaluates to zero elements, Angular structural directives gracefully swap out the empty list table for a nice "Your cart is empty! Go browse the catalog." message, establishing clean exception protections!
