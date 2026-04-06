use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env;

// --- Models ---
#[derive(Deserialize)]
struct TaskRequest {
    title: String,
    // Demonstrating `Option` for optional/missing values instead of crashing when mapping fails explicitly
    description: Option<String>, 
}

#[derive(Serialize)]
struct TaskResponse {
    message: String,
    internal_id: i32,
}

// --- Custom API Error Model ---
// This enum centralizes API failure formatting!
enum ApiError {
    BadRequest(String),
    InternalServerError(anyhow::Error),
}

// Convert our custom error natively into a perfectly shaped Axum HTTP HTTP Response!
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            ApiError::InternalServerError(err) => {
                // Log the exact `anyhow` trace secretly in the server logs...
                eprintln!("INTERNAL SYSTEM FAILURE: {:?}", err);
                
                // ... But return a sanitized safe string directly to the client
                (StatusCode::INTERNAL_SERVER_ERROR, "An internal server error occurred.".to_string())
            }
        };

        // Construct a structured Custom JSON format returning specifically {"error": "..."}
        let body = Json(json!({
            "error": error_message
        }));

        (status, body).into_response()
    }
}

// --- Internal Business Logic (Using Anyhow) ---
// Simulates an unpredictable internal backend action (like a Database Call or file write)
fn mock_db_save(task_title: &str) -> anyhow::Result<i32> {
    if task_title == "CRASH_DB" { // Magic String for Demo Purposes
        // `anyhow::bail!` generates an explicit Err safely. Alternatively, we use `?` operator on failing functions!
        anyhow::bail!("Database connection randomly severed while saving!");
    }
    
    // Simulate successful database insertion ID assignment
    Ok(999) 
}

// --- Main Handler ---
async fn create_task(
    // Axum automatically rejects explicitly malformed blobs, but passes through verified typed boundaries
    Json(payload): Json<TaskRequest>,
) -> Result<Json<TaskResponse>, ApiError> {

    // 1. Validating User Input safely (No unchecked unwraps!)
    if payload.title.trim().is_empty() {
        return Err(ApiError::BadRequest("Title field cannot be strictly empty whitespace!".into()));
    }

    // 2. Safely pulling Option parameters utilizing Rust matching (rather than blinding unwrapping)
    let desc = match payload.description {
        Some(d) if !d.is_empty() => d,
        _ => "No description provided by client.".to_string(),
    };

    println!("Attempting to save: {} - {}", payload.title, desc);

    // 3. Passing to inner logic tracking Anyhow errors. E.g mapping Anyhow -> ApiError cleanly
    let db_id = mock_db_save(&payload.title)
        .map_err(ApiError::InternalServerError)?; // The ? Operator elegantly propagates the mapped error returning early!

    // 4. Wrap the beautiful success!
    Ok(Json(TaskResponse {
        message: "Successfully drafted Task in DB".to_string(),
        internal_id: db_id,
    }))
}

// Basic root functions ensuring server is alive
async fn root() -> &'static str { "Rust backend is running" }
async fn health_check() -> &'static str { "OK - Backend is healthy" }


#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/task", post(create_task)); // Our Safe Error Handled Pipeline

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("127.0.0.1:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&bind_address)
        .await
        .unwrap();

    println!("Server listening on http://{}", bind_address);
    axum::serve(listener, app).await.unwrap();
}
