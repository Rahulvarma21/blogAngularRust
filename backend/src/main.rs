use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::env;
use std::sync::Arc;

// --- App State holding Optional Database Connection ---
// This handles the explicit "Database Connection Failure" edge case assigned!
// If Postgres is offline, the Axum server STILL RUNS, but Database-reliant routes return graceful API Errors!
struct AppState {
    db: Option<PgPool>,
}

// --- API Error Modeling ---
enum ApiError {
    DatabaseOffline,
    QueryFailed(anyhow::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::DatabaseOffline => (
                StatusCode::SERVICE_UNAVAILABLE,
                "The database connection is currently offline. Please ensure PostgreSQL is running.",
            ),
            ApiError::QueryFailed(err) => {
                eprintln!("Database Exception: {:?}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "A query execution failed internally.")
            }
        };

        (status, Json(json!({ "error": error_message }))).into_response()
    }
}

// --- Request / Response Models ---
#[derive(Deserialize)]
struct CreateUserRequest {
    name: String,
    email: String,
}

#[derive(Serialize)]
struct UserResponse {
    id: i32,
    name: String,
    email: String,
}

// --- Route Handlers ---
async fn root() -> &'static str {
    "Rust backend is running! (Postgres SQLx configuration active)"
}

// Target Endpoint safely executing SQL logic
async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), ApiError> {
    
    // EDGE CASE: Handle gracefully when Database Pool was never successfully created at boot!
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;

    // Execute safe Parameterized Query (Protection against SQL Injection)
    let sql = "
        INSERT INTO users (name, email) 
        VALUES ($1, $2) 
        RETURNING id, name, email
    ";

    // Because tables might not exist (due to lack of migrations in this snippet), we securely trap any DB query crash dynamically!
    let row = sqlx::query(sql)
        .bind(&payload.name)
        .bind(&payload.email)
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::QueryFailed(e.into()))?;

    let user = UserResponse {
        id: row.try_get("id").unwrap_or(0), 
        name: row.try_get("name").unwrap_or(payload.name),
        email: row.try_get("email").unwrap_or(payload.email),
    };

    Ok((StatusCode::CREATED, Json(user)))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 1. Initializing environment constants reliably
    dotenvy::dotenv().ok(); // Gracefully ignore if `.env` is purely missing

    // 2. Safely Attempt Database Connection
    let db_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://demo_user:demo_password@localhost:5432/angrustblog_db".to_string());
    
    println!("Booting... Attempting to connect to Postgres -> {}", db_url);

    // Instead of panicked unwrap(), we safely match the pool state ensuring Axum ALWAYS spins up regardless of DB status.
    let db_pool = match PgPoolOptions::new().max_connections(5).connect(&db_url).await {
        Ok(pool) => {
            println!(" ✅ PostgreSQL Connection Successfully Established!");
            Some(pool)
        }
        Err(e) => {
            println!(" ⚠️ PostgreSQL Connection Failed: {}. \n -> System will boot into degraded state natively handling dead DB interactions gracefully!", e);
            None
        }
    };

    // 3. Mount Application State & Routes
    let app_state = Arc::new(AppState { db: db_pool });

    let app = Router::new()
        .route("/", get(root))
        .route("/users", post(create_user))
        .with_state(app_state);

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("127.0.0.1:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&bind_address).await?;

    println!(" 🚀 Server listening on http://{}", bind_address);
    axum::serve(listener, app).await?;

    Ok(())
}
