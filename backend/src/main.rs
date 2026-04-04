use axum::{Router, routing::get};
use std::env;

async fn root() -> &'static str {
    "Rust backend is running"
}

// Health check endpoint explicitly answering GET /health
async fn health_check() -> &'static str {
    "OK - Backend is healthy"
}

#[tokio::main]
async fn main() {
    // Registering the routes using the Axum Router
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check));

    // Allow port configuration safely falling back to 8080
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("127.0.0.1:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&bind_address)
        .await
        .unwrap();

    println!("Server listening on http://{}", bind_address);

    axum::serve(listener, app).await.unwrap();
}
