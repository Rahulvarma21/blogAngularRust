# Pull Request: Rust REST Endpoints & Typed Models

## Description
This Pull Request expands upon the base Rust web server architecture, implementing specifically tailored REST API endpoints strictly leveraging typed models to demonstrate secure Serialization and Deserialization operations over the HTTP layer.

## Implemented Endpoint
**Endpoint Configuration:**
- **Route:** `/users`
- **Method:** `POST`

**Why `POST`?**
The `POST` method explicitly adheres to RESTful architectural principles when indicating to a backend that the client intends to synthesize or "create" a brand new entity resource mapping (a new User account in this case), unlike `GET` which should be purely idempotent data retrieval.

## Request & Response Models (Using Serde)
To prevent abstract or malicious untyped data from corrupting the application logic, models were rigorously typed.
1. **`CreateUser` (Request Model - Deserialize):** Expects precisely a `name` (String) and an `age` (i32).
2. **`UserResponse` (Response Model - Serialize):** Packages the outgoing confirmation payload bundling the newly generated mock `id`, the repeating `name`/`age`, and a success `message`. 

No loose or untyped anonymous JSON blobs are blindly parsed anywhere. Axum natively hooks `serde` trait configurations, blocking bad payload schemas immediately without invoking the handler!

## Execution & Local Testing
Start the backend easily:
```bash
cd backend
cargo run
```

To test the endpoint safely using cURL (or adapt it to an exact Postman body):
```bash
curl -X POST http://127.0.0.1:8080/users \
     -H "Content-Type: application/json" \
     -d '{"name": "Alice Backend", "age": 28}'
```

**Expected Successful Response:** (HTTP 201 Created)
```json
{
  "id": 101,
  "name": "Alice Backend",
  "age": 28,
  "message": "User successfully created!"
}
```

> Attach two crucial screenshots here! One of `cargo run` maintaining the server loop, and another of your `cURL` or Postman firing off and catching the perfect `User successfully created!` JSON response object!

--- 

# Video Presentation Script / Case Study Answers

*To be verbally explained in your video demo:*

**Case Study Question:**
Your Angular frontend needs to create a new resource using a POST request. Explain:
1. How Angular sends the request.
2. How Rust receives and validates the payload.
3. How the handler processes the request.
4. How a structured response is sent back.
5. How Angular would use the response to update the UI.

**Answer for Video:**
To initiate this interaction, Angular builds out a TypeScript payload object mapping matching our `CreateUser` schema natively on the frontend, and fires it over the wire utilizing `HttpClient.post('/users', payload)`. 

When those bytes land on the Rust Axum server, it hits our handler signature mapping to `Json(payload): Json<CreateUser>`. Axum specifically intercepts the execution cycle here and relies heavily on the `serde` crate implicitly invoking `Deserialize`! It rigorously mathematically verifies the incoming fields match the type boundaries explicitly (checking that `age` isn't a random String, and that `name` exists). If the validation blows up, Axum tosses an error *before* the handler even starts!

Since it survives, the handler body securely parses the typed `payload` properties applying local stub logic allocating a mock `101` ID database-entry and returning it encapsulated entirely inside of a brand new instance of a `UserResponse` struct.

Finally, we hit it with a perfectly structured Tuple return: `(StatusCode::CREATED, Json(new_user))`. Rust's `Serialize` trait automatically encodes our `UserResponse` struct directly back into raw raw JSON bytes attached to an HTTP `201` flag back across the pipe. 

In Angular, the `HttpClient.post()` Observable streams would resolve dynamically, catching this exact JSON object. The frontend could then parse the incoming `id: 101` cleanly updating a localized frontend array natively displaying our new User directly on-screen seamlessly integrating Full-Stack type adherence!
