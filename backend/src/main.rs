use axum::{
    routing::{get, post},
    Router, Json, http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::env;

async fn root() -> &'static str {
    "Rust backend is running"
}

// Health check endpoint explicitly answering GET /health
async fn health_check() -> &'static str {
    "OK - Backend is healthy"
}

// --- REST Endpoint Requirements ---

// 1. Definition of models used for request validation & response formatting
#[derive(Deserialize)]
struct CreateUser {
    name: String,
    age: i32,
}

#[derive(Serialize)]
struct UserResponse {
    id: i32,
    name: String,
    age: i32,
    message: String,
}

// 2. Handler Logic utilizing Typed Request Input
async fn create_user(
    // axum::Json automatically validates and deserializes the incoming request body against CreateUser
    Json(payload): Json<CreateUser>,
) -> (StatusCode, Json<UserResponse>) {
    // Applying generic mock logic
    let new_user = UserResponse {
        id: 101, // Mocked ID creation for demonstration
        name: payload.name,
        age: payload.age,
        message: "User successfully created!".to_string(),
    };

    // Return structured REST JSON response alongside HTTP 201 Created code
    (StatusCode::CREATED, Json(new_user))
}

#[tokio::main]
async fn main() {
    // 3. Registering the routes using the Axum Router
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/users", post(create_user)); // Setup POST target

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("127.0.0.1:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&bind_address)
        .await
        .unwrap();

    println!("Server listening on http://{}", bind_address);

    axum::serve(listener, app).await.unwrap();
}
