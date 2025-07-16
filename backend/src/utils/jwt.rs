use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use chrono::{Duration, Utc};
use actix_web::HttpRequest;
use crate::models::User;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // Subject (user ID)
    pub username: String,
    pub exp: i64, // Expiration time
    pub iat: i64, // Issued at
}

const JWT_SECRET: &str = "your-secret-key"; // In production, use environment variable

pub fn create_jwt(user_id: i32, username: &str) -> Result<String, String> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        exp: (now + Duration::hours(24)).timestamp(),
        iat: now.timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(JWT_SECRET.as_ref()),
    )
    .map_err(|e| format!("JWT creation error: {}", e))
}

pub fn verify_jwt(token: &str) -> Result<Claims, String> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET.as_ref()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|e| format!("JWT verification error: {}", e))
}

pub fn extract_user_from_token(req: &HttpRequest) -> Result<User, String> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .ok_or("Missing Authorization header")?
        .to_str()
        .map_err(|_| "Invalid Authorization header")?;

    if !auth_header.starts_with("Bearer ") {
        return Err("Invalid Authorization header format".to_string());
    }

    let token = &auth_header[7..]; // Remove "Bearer " prefix
    let claims = verify_jwt(token)?;

    // Create a User struct from claims
    // Note: This is a simplified version - in practice you might want to fetch from database
    Ok(User {
        id: claims.sub,
        username: claims.username,
        email: String::new(), // Not stored in JWT
        password_hash: String::new(), // Not stored in JWT for security
        full_name: None, // Not stored in basic JWT
        bio: None,
        avatar_url: None,
        website_url: None,
        location: None,
        company: None,
        is_admin: Some(0), // Default to false
        is_verified: Some(0), // Default to false
        created_at: Some(Utc::now()),
        updated_at: Some(Utc::now()),
    })
}
