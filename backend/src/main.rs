use axum::{
    extract::{Path, Query, State},
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

// 1. Definition for Query Parameters extracting dynamically
#[derive(Deserialize)]
struct PaginationQuery {
    page: Option<u32>,
    limit: Option<u32>,
    name: Option<String>,
}

async fn root() -> &'static str {
    "Rust backend actively managing SQLx Pagination & Filtering operations!"
}

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

    Ok((StatusCode::CREATED, Json(UserResponse {
        id: row.try_get("id").unwrap_or(0), 
        name: row.try_get("name").unwrap_or(payload.name),
        email: row.try_get("email").unwrap_or(payload.email),
    })))
}

// 2. NEW OPTIMIZED ENDPOINT: List Users (Fetching Multiple with Pagination & DB-Level Filters)
async fn list_users(
    State(state): State<Arc<AppState>>,
    Query(query): Query<PaginationQuery>,
) -> Result<Json<Vec<UserResponse>>, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;

    // Pagination Math utilizing sensible fallback defaults avoiding panics natively
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(10).min(100); 
    let offset = (page - 1) * limit;

    // Optional Filter prep cleanly wrapping wildcards specifically required for ILIKE bounds implicitly safely
    let filter_name = query.name.map(|n| format!("%{}%", n));

    // 3. Optimization Rules: 
    // - Select only precise columns avoiding `SELECT *` payload bloating
    // - Structure dynamic WHERE parameters enforcing `$1::text IS NULL` effectively preventing string-concatenation bugs completely
    // - Order sets properly preventing chaotic unordered DB streaming returns
    let sql = "
        SELECT id, name, email 
        FROM users 
        WHERE ($1::text IS NULL OR name ILIKE $1)
        ORDER BY id ASC
        LIMIT $2 OFFSET $3
    ";

    let rows = sqlx::query(sql)
        .bind(filter_name)
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(pool)
        .await
        .map_err(|e| ApiError::QueryFailed(e.into()))?;

    let users = rows.into_iter().map(|row| UserResponse {
        id: row.try_get("id").unwrap_or(0),
        name: row.try_get("name").unwrap_or_default(),
        email: row.try_get("email").unwrap_or_default(),
    }).collect();

    Ok(Json(users))
}


async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<i32>,
) -> Result<Json<UserResponse>, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;
    let sql = "SELECT id, name, email FROM users WHERE id = $1";
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

    let app = Router::new()
        .route("/", get(root))
        .route("/users", get(list_users).post(create_user)) // Newly Mounted GET Listing
        .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
        .with_state(app_state);

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("127.0.0.1:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&bind_address).await?;

    println!(" 🚀 Server listening on http://{}", bind_address);
    axum::serve(listener, app).await?;

    Ok(())
}
