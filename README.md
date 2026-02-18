# 1. API Explanation (Route → Handler → Logic → Response)

## Route → Handler Mapping

Rust uses a router to map HTTP requests to specific handler functions.

### Example

```rust
Router::new()
    .route("/posts", post(create_post))
    .route("/posts", get(get_all_posts))
```

* **POST /posts** → `create_post` handler
* **GET /posts** → `get_all_posts` handler

The router ensures the correct handler executes based on **HTTP method and endpoint**.

---

## Handler: Receiving and Processing Request

When Angular sends JSON data, Rust converts it into a typed struct.

### Example

```rust
pub async fn create_post(
    Json(payload): Json<CreatePostRequest>,
    State(db): State<PgPool>,
) -> Result<Json<PostResponse>, StatusCode> {
```

### Processing Steps

1. Receive JSON request from Angular
2. Convert JSON → Rust struct
3. Validate input fields
4. Apply business logic
5. Insert into PostgreSQL
6. Return JSON response

---

## Type-Safe Structs (Input & Output Safety)

Rust uses strongly typed structs to enforce safe API communication.

### Request Struct

```rust
#[derive(Deserialize)]
pub struct CreatePostRequest {
    pub title: String,
    pub content: String,
}
```

### Response Struct

```rust
#[derive(Serialize)]
pub struct PostResponse {
    pub id: i32,
    pub title: String,
    pub content: String,
}
```

### Benefits

* Prevents invalid or missing fields
* Ensures correct data types
* Compile-time validation
* Predictable API structure
* Safer frontend-backend communication

---

## JSON Response Handling

Rust automatically converts response structs into JSON using **Serde**.

### Example

```rust
Ok(Json(PostResponse {
    id: post.id,
    title: post.title,
    content: post.content,
}))
```

Angular receives structured JSON and updates the UI accordingly.

---

## Database Interaction (SQLx / SeaORM → PostgreSQL)

The backend interacts with PostgreSQL using **SQLx (or SeaORM)**.

### Example (SQLx)

```rust
let post = sqlx::query_as!(
    Post,
    "INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING id, title, content",
    payload.title,
    payload.content
)
.fetch_one(&db)
.await?;
```

### Flow

1. Rust executes parameterized SQL query
2. PostgreSQL safely executes query
3. Inserted row is returned
4. Rust maps DB row → Rust struct
5. Struct returned as JSON

This ensures **type-safe, secure, and injection-safe database access**.

---

# 2. End-to-End API Request Flow

## Architecture Flow

```
Angular Service (HTTP POST /posts)
        ↓
Rust Router
        ↓
Rust Handler
(JSON → Struct, Validation, Business Logic)
        ↓
SQLx / SeaORM Query
(INSERT INTO posts)
        ↓
PostgreSQL Database
        ↓
Rust JSON Response (PostResponse)
        ↓
Angular receives response
        ↓
UI updates (New Blog Post displayed)
```

*(Architecture diagram attached in PR)*

---

# 3. Reflection

## Why are type-safe, strongly validated Rust APIs important?

Type-safe Rust APIs are critical in modern backend systems because they provide **reliability, safety, and predictability**. Rust’s strong type system ensures invalid data cannot pass through the API, preventing runtime crashes and unexpected behavior. Compile-time checks catch errors early, reducing production failures. Rust’s strict error handling forces developers to explicitly manage failures, improving backend robustness. Overall, strongly typed Rust APIs lead to secure, stable, and maintainable backend services.

---

# 4. AI Feedback Improvement

Before finalizing this PR, I reviewed my API explanation using an AI assistant to improve clarity and architectural understanding.

### AI Suggestions

* Improve explanation of Route → Handler mapping
* Add clearer explanation of typed struct safety
* Expand database interaction section
* Improve end-to-end API flow description

Based on this feedback, the documentation was revised for better clarity and completeness.

---

# API Endpoints

## Create Blog Post

**POST /posts**

### Request Body

```json
{
  "title": "My First Blog",
  "content": "This is my blog content"
}
```

### Success Response

```json
{
  "id": 1,
  "title": "My First Blog",
  "content": "This is my blog content"
}
```

---

## Get All Blog Posts

**GET /posts**

### Success Response

```json
[
  {
    "id": 1,
    "title": "My First Blog",
    "content": "This is my blog content"
  }
]
```
