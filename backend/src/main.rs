use axum::{Router, routing::get};

async fn root() -> &'static str {
    "Rust backend is running"
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(root));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080")
        .await
        .unwrap();

    println!("Server running at http://localhost:8080");

    axum::serve(listener, app).await.unwrap();
}
