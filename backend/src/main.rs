use axum::{
    routing::{get, post},
    Router, Json, http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::env;

async fn root() -> &'static str {
    "Rust backend is running"
}

async fn health_check() -> &'static str {
    "OK - Backend is healthy"
}

// Assignment 7: User implementation
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

async fn create_user(
    Json(payload): Json<CreateUser>,
) -> (StatusCode, Json<UserResponse>) {
    let new_user = UserResponse {
        id: 101, 
        name: payload.name,
        age: payload.age,
        message: "User successfully created!".to_string(),
    };
    (StatusCode::CREATED, Json(new_user))
}

// Assignment 8: Serde Profile implementation
#[derive(Deserialize)]
struct CreateProfileRequest {
    name: String,
    email: String,
}

#[derive(Serialize)]
struct ProfileResponse {
    id: i32,
    name: String,
    email: String,
}

async fn create_profile(
    // Automatic Serde deserialization handles payload rejection if invalid JSON or missing fields
    Json(payload): Json<CreateProfileRequest>,
) -> (StatusCode, Json<ProfileResponse>) {
    // Generate the serialized response
    let profile_response = ProfileResponse {
        id: 504, 
        name: payload.name,
        email: payload.email,
    };

    (StatusCode::CREATED, Json(profile_response))
}


#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/users", post(create_user))
        .route("/profile", post(create_profile)); // Added Serde Profile Route

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("127.0.0.1:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&bind_address)
        .await
        .unwrap();

    println!("Server listening on http://{}", bind_address);

    axum::serve(listener, app).await.unwrap();
}
