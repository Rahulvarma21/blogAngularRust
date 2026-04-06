# Pull Request: Rust Persistent Storage via PostgreSQL & SQLx

## Description
This Pull Request integrates persistent database storage securely into the Axum Backend using the powerful async-first `SQLx` ecosystem. It explicitly implements sophisticated state-handling ensuring the raw compilation and server execution cycle *never* panic or crash even if the upstream Postgres Container is taken fully offline maliciously!

## Setup Configuration
1. **Credentials Management:** Instead of explicitly hardcoding secrets, I pulled in `dotenvy`. Execution natively attempts traversing a local `.env` routing structure seeking a secure `DATABASE_URL=` variable securely configuring the `PgPoolOptions` instance.
2. **Why SQLx?**: `SQLx` was chosen over ORMs like SeaORM because SQLx natively adheres strictly to pure Postgres-SQL syntax directly preventing complex abstraction layers. Furthermore, its dynamic `sqlx::query()` macro actively generates Parameterized Output entirely removing SQL Injection payloads structurally!

## Endpoints & Database Operations Execution
- **Endpoint:** `POST /users`
- **Database Action:** Executes a robust `.bind()` SQL Injection safe insert:
```sql
INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email
```

## Error Handling & Graceful Degradation Edge Case
**Scenario Built:** Database Offline Trapping.
If the Postgres instance is simply completely shutoff or inaccessible across the network, most beginner Rust projects violently `.unwrap()` the connection attempt, immediately destroying the server's thread and taking the whole backend permanently offline for all users!

Instead, my implementation matches the `PgPoolOptions::connect()` Result. If it maps explicitly to an `Err`, I gracefully instantiate the Application State holding an `Option::None` Database reference. Axum boots successfully reporting a degraded state in the terminal log!

If a user naturally hits the `POST /users` endpoint requiring DB manipulation, the handler evaluates `state.db.as_ref().ok_or(ApiError::DatabaseOffline)?`. This trips instantly, cleanly ejecting an HTTP `503 Service Unavailable` JSON response native to Axum explicitly telling the client: *"The database is offline. Please try again later."* The backend thread survives completely!

## Local Testing
1. Configure `.env` placing your exact Postgres string.
2. Formulate execution via `cargo run`. 
3. Toss a payload via cURL:
```bash
curl -X POST http://127.0.0.1:8080/users -H "Content-Type: application/json" -d '{"name": "SQLx User", "email": "sqlx@test.com"}'
```

> Take Screenshots confirming two states: 1) The Terminal gracefully tracking a failed boot state into "Degraded State", 2) Firing a cURL hit executing the explicit `error: The database connection is currently offline` JSON bounce. 

--- 

# Video Presentation Script / Case Study Answers

*To be verbally explained in your video demo:*

**Case Study Question:**
A user submits a form from the Angular frontend to create a new record. Explain:
1. How the request reaches the Rust backend.
2. How the handler interacts with PostgreSQL.
3. How SQLx executes the query safely.
4. How errors are handled if the database is unavailable.
5. How the response is sent back to Angular.

**Answer for Video:**
To persist the form, Angular packages the payload utilizing `HttpClient.post()` and shoots the bytes toward the open `/users` port routing target explicitly managed by Tokio/Axum on the Rust backend layer.

Once it hits the endpoint logic, the Axum handler extracts two components dynamically: the JSON payload, and the specific isolated Database connection `PgPool` stored explicitly in the shared memory `State`. 

To safely touch Postgres, we load the command directly into `sqlx::query()`. Instead of executing malicious string interpolation creating lethal SQL Injection risks (`"INSERT INTO users VALUES (" + user.name + ")"`), SQLx perfectly leverages postgres parameterized placeholders natively! We map `$1` and `$2` values executing specific `.bind()` sequences safely sanitizing memory variables downstream structurally.

Crucially, what if the Database crashes globally? Our backend is structured with Rust's explicit error propagation layers. Because the connection pool resides natively inside an explicit `Option<PgPool>`, hitting that endpoint instantaneously realizes the connection states are nonexistent (`None`). Rather than violently executing an `.unwrap()` panic that kills the parent CPU Process Thread, the operator evaluates safely ejecting an `ApiError::DatabaseOffline`. This triggers the specific `IntoResponse` implementation mapping a crystal clear HTTP `503 Service Unavailable` JSON block natively back down the pipeline mapping back cleanly to the Angular UI telling the Client: *"Hey, server is fine, but Database is offline. Save draft!"*
