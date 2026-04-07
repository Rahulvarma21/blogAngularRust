use axum::{
    extract::{Path, Query, Request, State},
    http::{header, Method, StatusCode, HeaderValue},
    middleware::Next,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::env;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use chrono::{Utc, Duration, DateTime};

const JWT_SECRET: &[u8] = b"HYPER_SECRET_PRODUCTION_KEY_DO_NOT_LEAK";

// --- Optimized Shared State --- //
struct AppState {
    db: Option<PgPool>,
    // 1. Efficient Resource Management: Data computed ONCE at startup and shared via Arc.
    // This avoids redundant logic and overhead on every request.
    version: String,
    start_time: DateTime<Utc>,
    environment: String,
}

enum ApiError {
    DatabaseOffline,
    NotFound(String),
    QueryFailed(anyhow::Error),
    Unauthorized(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::DatabaseOffline => (StatusCode::SERVICE_UNAVAILABLE, "The database connection is currently offline.".to_string()),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            ApiError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg), 
            ApiError::QueryFailed(err) => {
                eprintln!("Database Exception: {:?}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "A query execution failed internally.".to_string())
            }
        };
        (status, Json(json!({ "error": error_message }))).into_response()
    }
}

// --- JWT Implementations --- //
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String, 
    exp: usize,  
}

#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String, 
}

#[derive(Serialize)]
struct LoginResponse {
    token: String,
}

// Async Handler Implementation: All handlers use async/await non-blocking I/O
async fn login_handler(Json(payload): Json<LoginRequest>) -> Result<Json<LoginResponse>, ApiError> {
    if payload.email.is_empty() || payload.password != "supersecret" {
        return Err(ApiError::Unauthorized("Invalid Email or Password combinations.".to_string()));
    }

    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(1))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: payload.email.clone(),
        exp: expiration,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET),
    ).map_err(|_| ApiError::Unauthorized("Token Formulation Panic".to_string()))?;

    Ok(Json(LoginResponse { token }))
}

// Lightweight Middleware: Cryptographically Validates Token Signature without DB hits
async fn require_auth(req: Request, next: Next) -> Result<Response, ApiError> {
    let auth_header = req.headers().get(header::AUTHORIZATION);
    let auth_str = match auth_header {
        Some(t) => t.to_str().unwrap_or(""),
        None => return Err(ApiError::Unauthorized("Access Denied: Missing Authorization Header!".to_string())),
    };

    if !auth_str.starts_with("Bearer ") {
        return Err(ApiError::Unauthorized("Access Denied: Unrecognized Token Architecture!".to_string()));
    }
    
    let token = &auth_str[7..];
    let validation = Validation::new(Algorithm::HS256);
    let _token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET),
        &validation
    ).map_err(|_| ApiError::Unauthorized("Access Denied: Token Invalid or EXPIRED!".to_string()))?;

    Ok(next.run(req).await)
}


#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")] 
struct ProfileRequest {
    first_name: String,
    last_name: String,
    age: u8,
    bio: Option<String>, 
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProfileResponse {
    full_name: String,
    is_adult: bool,
    provided_bio: Option<String>, 
    status: String,
}

async fn analyze_profile_handler(Json(payload): Json<ProfileRequest>) -> Result<Json<ProfileResponse>, ApiError> {
    let response = ProfileResponse {
        full_name: format!("{} {}", payload.first_name, payload.last_name),
        is_adult: payload.age >= 18,
        provided_bio: payload.bio,
        status: "Profile serialized correctly matching End-To-End typing guarantees!".to_string(),
    };
    Ok(Json(response))
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

#[derive(Deserialize)]
struct PaginationQuery {
    page: Option<u32>,
    limit: Option<u32>,
    name: Option<String>,
}

async fn root() -> &'static str { "Performance-optimized Rust backend with Axum & Tokio!" }
async fn health_check() -> &'static str { "OK - Backend is healthy (PUBLIC)" }

// 2. Reducing Redundant Work: Returns pre-computed metadata from shared application state.
// This endpoint is critical for showing efficient resource management.
#[derive(Serialize)]
struct SystemInfoResponse {
    version: String,
    uptime_seconds: i64,
    environment: String,
    db_connected: bool,
}

async fn system_info(State(state): State<Arc<AppState>>) -> Json<SystemInfoResponse> {
    let uptime = Utc::now().signed_duration_since(state.start_time).num_seconds();
    Json(SystemInfoResponse {
        version: state.version.clone(),
        uptime_seconds: uptime,
        environment: state.environment.clone(),
        db_connected: state.db.is_some(),
    })
}

async fn create_user(State(state): State<Arc<AppState>>, Json(payload): Json<CreateUserRequest>) -> Result<(StatusCode, Json<UserResponse>), ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;
    let sql = "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email";
    let row = sqlx::query(sql).bind(&payload.name).bind(&payload.email).fetch_one(pool).await.map_err(|e| ApiError::QueryFailed(e.into()))?;
    Ok((StatusCode::CREATED, Json(UserResponse { id: row.try_get("id").unwrap_or(0), name: row.try_get("name").unwrap_or(payload.name), email: row.try_get("email").unwrap_or(payload.email) })))
}

async fn list_users(State(state): State<Arc<AppState>>, Query(query): Query<PaginationQuery>) -> Result<Json<Vec<UserResponse>>, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(10).min(100); 
    let offset = (page - 1) * limit;
    let filter_name = query.name.map(|n| format!("%{}%", n));
    let sql = "SELECT id, name, email FROM users WHERE ($1::text IS NULL OR name ILIKE $1) ORDER BY id ASC LIMIT $2 OFFSET $3";
    let rows = sqlx::query(sql).bind(filter_name).bind(limit as i64).bind(offset as i64).fetch_all(pool).await.map_err(|e| ApiError::QueryFailed(e.into()))?;
    let users = rows.into_iter().map(|row| UserResponse { id: row.try_get("id").unwrap_or(0), name: row.try_get("name").unwrap_or_default(), email: row.try_get("email").unwrap_or_default() }).collect();
    Ok(Json(users))
}

async fn get_user(State(state): State<Arc<AppState>>, Path(user_id): Path<i32>) -> Result<Json<UserResponse>, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;
    let sql = "SELECT id, name, email FROM users WHERE id = $1";
    let row = sqlx::query(sql).bind(user_id).fetch_optional(pool).await.map_err(|e| ApiError::QueryFailed(e.into()))?.ok_or_else(|| ApiError::NotFound(format!("Fetch failed: User ID [{}] not found.", user_id)))?;
    Ok(Json(UserResponse { id: row.try_get("id").unwrap_or(0), name: row.try_get("name").unwrap_or_default(), email: row.try_get("email").unwrap_or_default() }))
}

async fn update_user(State(state): State<Arc<AppState>>, Path(user_id): Path<i32>, Json(payload): Json<CreateUserRequest>) -> Result<Json<UserResponse>, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;
    let sql = "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email";
    let row = sqlx::query(sql).bind(&payload.name).bind(&payload.email).bind(user_id).fetch_optional(pool).await.map_err(|e| ApiError::QueryFailed(e.into()))?.ok_or_else(|| ApiError::NotFound(format!("Update failed: User ID [{}] absent from structure.", user_id)))?;
    Ok(Json(UserResponse { id: row.try_get("id").unwrap_or(0), name: row.try_get("name").unwrap_or_default(), email: row.try_get("email").unwrap_or_default() }))
}

async fn delete_user(State(state): State<Arc<AppState>>, Path(user_id): Path<i32>) -> Result<StatusCode, ApiError> {
    let pool = state.db.as_ref().ok_or(ApiError::DatabaseOffline)?;
    let sql = "DELETE FROM users WHERE id = $1 RETURNING id";
    let row = sqlx::query(sql).bind(user_id).fetch_optional(pool).await.map_err(|e| ApiError::QueryFailed(e.into()))?;
    if row.is_none() { return Err(ApiError::NotFound(format!("Cannot delete, User ID [{}] un-identified.", user_id))); }
    Ok(StatusCode::NO_CONTENT)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok(); 
    let db_url = env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://demo_user:demo_password@localhost:5432/angrustblog_db".to_string());
    
    // Connection pool is created ONCE and shared via Arc for maximum efficiency
    let db_pool = match PgPoolOptions::new().max_connections(5).connect(&db_url).await {
        Ok(pool) => Some(pool), Err(_) => None,
    };
    
    let app_state = Arc::new(AppState { 
        db: db_pool,
        version: "1.2.0".to_string(),
        start_time: Utc::now(),
        environment: "development".to_string(),
    });

    let cors_layer = CorsLayer::new()
        .allow_origin("http://localhost:4200".parse::<HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // PROTECTED TARGETS
    let protected_routes = Router::new()
        .route("/users", get(list_users).post(create_user)) 
        .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
        .route("/analyze-profile", post(analyze_profile_handler))
        .route_layer(axum::middleware::from_fn(require_auth)); 

    // PUBLIC TARGETS
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/system-info", get(system_info)) // Pre-computed optimization
        .route("/login", post(login_handler))
        .merge(protected_routes)
        .with_state(app_state)
        .layer(cors_layer);

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("127.0.0.1:{}", port);
    
    let listener = tokio::net::TcpListener::bind(&bind_address).await?;
    println!(" 🚀 Scalable Rust Server booting via Axum at http://{}", bind_address);
    axum::serve(listener, app).await?;

    Ok(())
}
