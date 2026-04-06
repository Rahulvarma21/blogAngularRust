# Pull Request: Full Rust Backend CRUD implementation via PostgreSQL & SQLx

## Description
This Pull Request vastly extends our existing Database architecture, structurally establishing all 4 distinct CRUD parameters explicitly interacting flawlessly against our Postgres deployment utilizing safe parameter binding preventing SQL Injections natively down the core routing pipeline!

## Implemented Endpoints & SQLx Queries
The Axum router was explicitly connected mapping dynamic `:id` execution tracking against our backend struct `AppState`:

1. **CREATE (`POST /users`)**
   ```sql
   INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email
   ```
   Safely captures a JSON payload matching `CreateUserRequest` constraints initializing rows in Postgres natively.

2. **READ (`GET /users/:id`)**
   ```sql
   SELECT id, name, email FROM users WHERE id = $1
   ```
   Dynamically intercepts URL IDs checking explicit user extraction mapping to output payloads.

3. **UPDATE (`PUT /users/:id`)**
   ```sql
   UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email
   ```
   Requires matching execution modifying records in-place natively.

4. **DELETE (`DELETE /users/:id`)**
   ```sql
   DELETE FROM users WHERE id = $1 RETURNING id
   ```
   Intercepts executions strictly stripping memory from SQL seamlessly.

## Safe Handling of `Record Not Found` Failures (404s)
When a user fires a `GET`, `PUT`, or `DELETE` hitting an ID that doesn't actually exist in the table `id = 99999`, Rust doesn't simply crash. I utilized `sqlx::fetch_optional()` explicitly instead of the brutal `fetch_one()` call!

If SQLx resolves scanning the tables and returning Zero rows, `fetch_optional` safely evaluates to `Option::None`. The Handler captures this checking `.ok_or_else()` and wraps it dynamically into:
`return Err(ApiError::NotFound("User ID not found".to_string()));`.

Because of our custom Enum framework implemented earlier, this automatically maps backwards rendering a pristine `HTTP 404 Not Found` JSON output: `{"error": "Update failed: User ID [99] absent from structure."}` entirely protecting system execution!

## Local Testing
Build and run the execution natively using `cargo run`. (Make sure you pass `sqlx migrate run` so the users table exists!)

- **Create User:**
  `curl -X POST http://127.0.0.1:8080/users -H "Content-Type: application/json" -d '{"name": "Admin", "email": "test@demo.com"}'`
- **Read User:**
  `curl -X GET http://127.0.0.1:8080/users/1`
- **Trigger `Record Not Found` Delete Error (404):**
  `curl -X DELETE http://127.0.0.1:8080/users/999` *(Takes a screenshot of the resultant JSON Error!)*

--- 

# Video Presentation Script / Case Study Answers

*To be verbally explained in your video demo:*

**Case Study Question:**
A user updates an existing record from the Angular frontend. Explain:
1. How the update request is sent.
2. How the Rust handler processes the request.
3. How SQLx executes the update query.
4. How the backend detects if the record does not exist.
5. How the final response is sent back to Angular.

**Answer for Video:**
To mutate Data, the Angular Frontend fires an `HttpClient.put()` payload targeting explicit routes matching the explicit database integer (e.g. `PUT /users/5`). This payload carries the brand new structure utilizing TypeScript objects (such as substituting the user's name or fixing a typo).

Across the boundary, the Axum server resolves `update_user()`. It explicitly deconstructs two objects from the URL execution path mapping: The literal URL payload integer via `Path(user_id)` and the JSON string payload executing down structurally deserializing flawlessly against our `CreateUserRequest` struct. 

Axum explicitly fires execution parsing our logic utilizing `sqlx::query("UPDATE...")`. We execute `.bind(&payload.name).bind(user_id)`. This securely executes explicit Postgres Parameter protections entirely circumventing chaotic injection attacks preventing hackers from dropping malicious strings wiping database infrastructures. 

Crucially! Because we execute our Database target via `sqlx::fetch_optional(pool)`, if the handler detects that User #5 doesn't exist anymore (perhaps another Admin deleted them manually natively without Angular registering the UI change), SQLx gracefully ejects an explicit `None` Option object! 

By checking `.ok_or_else(|| ApiError::NotFound(...))`, Rust intercepts the failure dynamically and perfectly generates an explicit HTTP `404 Not Found` JSON tuple routing straight back to Angular cleanly preventing unpredictable application crashes seamlessly! Angular's `catchError` RxJS block would organically catch that 404 cleanly popping up a Notification Toast complaining *"User no longer exists, please refresh the page."*
