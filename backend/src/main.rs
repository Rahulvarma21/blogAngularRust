use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::env;
use std::sync::Arc;

struct AppState {
    db: Option<PgPool>,
}

enum ApiError {
    DatabaseOffline,
    NotFound(String),
    QueryFailed(anyhow::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::DatabaseOffline => (
                StatusCode::SERVICE_UNAVAILABLE,
                "The database connection is currently offline. Please ensure PostgreSQL is running.".to_string(),
            ),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            ApiError::QueryFailed(err) => {
                eprintln!("Database Exception: {:?}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "A query execution failed internally.".to_string())
            }
        };

        (status, Json(json!({ "error": error_message }))).into_response()
    }
}

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

async fn root() -> &'static str {
    "Rust backend actively managing SQLx CRUD operations!"
}

// 1. CREATE OPERATION
async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;

    let sql = "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email";

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

// 2. READ OPERATION
async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i32>,
) -> Result<Json<UserResponse>, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;

    let sql = "SELECT id, name, email FROM users WHERE id = $1";

    // Safely evaluate potential missing entries gracefully via fetch_optional mapping into explicit HTTP 404
    let row = sqlx::query(sql)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::QueryFailed(e.into()))?
        .ok_or_else(|| ApiError::NotFound(format!("Fetch failed: User ID [{}] not found.", user_id)))?;

    Ok(Json(UserResponse {
        id: row.try_get("id").unwrap_or(0),
        name: row.try_get("name").unwrap_or_default(),
        email: row.try_get("email").unwrap_or_default(),
    }))
}

// 3. UPDATE OPERATION
async fn update_user(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i32>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserResponse>, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;

    let sql = "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email";

    let row = sqlx::query(sql)
        .bind(&payload.name)
        .bind(&payload.email)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::QueryFailed(e.into()))?
        .ok_or_else(|| ApiError::NotFound(format!("Update failed: User ID [{}] absent from structure.", user_id)))?;

    Ok(Json(UserResponse {
        id: row.try_get("id").unwrap_or(0),
        name: row.try_get("name").unwrap_or_default(),
        email: row.try_get("email").unwrap_or_default(),
    }))
}

// 4. DELETE OPERATION
async fn delete_user(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i32>,
) -> Result<StatusCode, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;

    let sql = "DELETE FROM users WHERE id = $1 RETURNING id";

    let row = sqlx::query(sql)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::QueryFailed(e.into()))?;

    if row.is_none() {
        return Err(ApiError::NotFound(format!("Cannot delete, User ID [{}] un-identified.", user_id)));
    }

    Ok(StatusCode::NO_CONTENT)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok(); 

    let db_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://demo_user:demo_password@localhost:5432/angrustblog_db".to_string());
    
    println!("Booting... Attempting Postgres connections -> {}", db_url);

    let db_pool = match PgPoolOptions::new().max_connections(5).connect(&db_url).await {
        Ok(pool) => {
            println!(" ✅ PostgreSQL Connection Successfully Established!");
            Some(pool)
        }
        Err(e) => {
            println!(" ⚠️ PostgreSQL Offline. System booting natively via Safe Handlers handling DB Absence:\n {}", e);
            None
        }
    };

    let app_state = Arc::new(AppState { db: db_pool });

    // Safely mapping ALL explicit CRUD Axum endpoints over our Application State
    let app = Router::new()
        .route("/", get(root))
        .route("/users", post(create_user))
        .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
        .with_state(app_state);

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("127.0.0.1:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&bind_address).await?;

    println!(" 🚀 Server listening on http://{}", bind_address);
    axum::serve(listener, app).await?;

    Ok(())
}
