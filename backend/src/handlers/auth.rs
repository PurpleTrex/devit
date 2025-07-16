use actix_web::{web, HttpResponse, Result, HttpRequest};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::MySqlPool;
use crate::services::AuthService;
use crate::models::{CreateUserRequest, UserResponse};
use crate::config::AppConfig;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username_or_email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub message: String,
    pub token: Option<String>,
    pub user: Option<UserResponse>,
}

pub async fn register(
    pool: web::Data<MySqlPool>,
    config: web::Data<AppConfig>,
    request: web::Json<CreateUserRequest>
) -> Result<HttpResponse> {
    let auth_service = AuthService::new(pool.get_ref().clone(), config.jwt_secret.clone());
    let req = request.into_inner();
    
    match auth_service.register(&req.username, &req.email, &req.password, req.full_name.as_deref()).await {
        Ok(token) => {
            // Get user details after registration
            match auth_service.validate_token(&token).await {
                Ok(user) => Ok(HttpResponse::Created().json(AuthResponse {
                    success: true,
                    message: "User registered successfully".to_string(),
                    token: Some(token),
                    user: Some(user.into()),
                })),
                Err(_) => Ok(HttpResponse::Created().json(AuthResponse {
                    success: true,
                    message: "User registered successfully".to_string(),
                    token: Some(token),
                    user: None,
                }))
            }
        },
        Err(error) => Ok(HttpResponse::BadRequest().json(AuthResponse {
            success: false,
            message: error,
            token: None,
            user: None,
        }))
    }
}

pub async fn login(
    pool: web::Data<MySqlPool>,
    config: web::Data<AppConfig>,
    request: web::Json<LoginRequest>
) -> Result<HttpResponse> {
    let auth_service = AuthService::new(pool.get_ref().clone(), config.jwt_secret.clone());
    
    match auth_service.authenticate(&request.username_or_email, &request.password).await {
        Ok(token) => {
            // Get user details for response
            match auth_service.validate_token(&token).await {
                Ok(user) => Ok(HttpResponse::Ok().json(AuthResponse {
                    success: true,
                    message: "Login successful".to_string(),
                    token: Some(token),
                    user: Some(user.into()),
                })),
                Err(_) => Ok(HttpResponse::InternalServerError().json(AuthResponse {
                    success: false,
                    message: "Authentication successful but failed to retrieve user details".to_string(),
                    token: Some(token),
                    user: None,
                }))
            }
        },
        Err(error) => Ok(HttpResponse::Unauthorized().json(AuthResponse {
            success: false,
            message: error,
            token: None,
            user: None,
        }))
    }
}

pub async fn logout() -> Result<HttpResponse> {
    // Since we're using stateless JWT tokens, logout is handled client-side
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": "Logged out successfully"
    })))
}

pub async fn me(
    pool: web::Data<MySqlPool>,
    config: web::Data<AppConfig>,
    req: HttpRequest
) -> Result<HttpResponse> {
    // Extract token from Authorization header
    let auth_header = req.headers().get("Authorization");
    
    if let Some(auth_value) = auth_header {
        if let Ok(auth_str) = auth_value.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                let auth_service = AuthService::new(pool.get_ref().clone(), config.jwt_secret.clone());
                
                match auth_service.validate_token(token).await {
                    Ok(user) => return Ok(HttpResponse::Ok().json(json!({
                        "success": true,
                        "user": UserResponse::from(user)
                    }))),
                    Err(error) => return Ok(HttpResponse::Unauthorized().json(json!({
                        "success": false,
                        "message": error
                    })))
                }
            }
        }
    }
    
    Ok(HttpResponse::Unauthorized().json(json!({
        "success": false,
        "message": "Authorization header missing or invalid"
    })))
}

pub async fn refresh_token(
    pool: web::Data<MySqlPool>,
    config: web::Data<AppConfig>,
    req: HttpRequest
) -> Result<HttpResponse> {
    // Extract current token and generate new one
    let auth_header = req.headers().get("Authorization");
    
    if let Some(auth_value) = auth_header {
        if let Ok(auth_str) = auth_value.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                let auth_service = AuthService::new(pool.get_ref().clone(), config.jwt_secret.clone());
                
                match auth_service.validate_token(token).await {
                    Ok(user) => {
                        match auth_service.refresh_token(&user.id).await {
                            Ok(new_token) => return Ok(HttpResponse::Ok().json(json!({
                                "success": true,
                                "token": new_token,
                                "message": "Token refreshed successfully"
                            }))),
                            Err(error) => return Ok(HttpResponse::InternalServerError().json(json!({
                                "success": false,
                                "message": error
                            })))
                        }
                    },
                    Err(error) => return Ok(HttpResponse::Unauthorized().json(json!({
                        "success": false,
                        "message": error
                    })))
                }
            }
        }
    }
    
    Ok(HttpResponse::Unauthorized().json(json!({
        "success": false,
        "message": "Authorization header missing or invalid"
    })))
}

pub fn auth_routes() -> actix_web::Scope {
    web::scope("/auth")
        .route("/register", web::post().to(register))
        .route("/login", web::post().to(login))
        .route("/logout", web::post().to(logout))
        .route("/me", web::get().to(me))
        .route("/refresh", web::post().to(refresh_token))
}
