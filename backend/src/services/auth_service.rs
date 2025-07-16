use crate::models::UserWithPassword;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::MySqlPool;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub email: String,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Clone)]
pub struct AuthService {
    pool: MySqlPool,
    jwt_secret: String,
}

impl AuthService {
    pub fn new(pool: MySqlPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }

    pub async fn register(&self, username: &str, email: &str, password: &str, full_name: Option<&str>) -> Result<String, String> {
        // Validate input
        if username.is_empty() || email.is_empty() || password.is_empty() {
            return Err("Username, email, and password are required".to_string());
        }

        if password.len() < 8 {
            return Err("Password must be at least 8 characters long".to_string());
        }

        if !email.contains('@') {
            return Err("Invalid email format".to_string());
        }

        // Check if user already exists
        let existing_user = sqlx::query!(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            username,
            email
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        if existing_user.is_some() {
            return Err("User with this username or email already exists".to_string());
        }

        // Hash password
        let password_hash = hash(password, DEFAULT_COST)
            .map_err(|e| format!("Password hashing error: {}", e))?;

        // Start transaction for data consistency
        let mut transaction = self.pool.begin().await
            .map_err(|e| format!("Transaction error: {}", e))?;

        // Create user with proper ID generation
        let user_id = format!("user_{}", Uuid::new_v4().to_string().replace("-", ""));

        sqlx::query!(
            "INSERT INTO users (id, username, email, full_name, password_hash, is_admin, is_verified) VALUES (?, ?, ?, ?, ?, 0, 0)",
            user_id,
            username,
            email,
            full_name,
            password_hash
        )
        .execute(&mut *transaction)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Commit transaction
        transaction.commit().await
            .map_err(|e| format!("Transaction commit error: {}", e))?;

        // Get the created user
        let user = sqlx::query_as!(
            UserWithPassword,
            r#"
            SELECT 
                id, username, email, full_name, password_hash, 
                avatar_url, bio, website_url, location, company, 
                is_admin, is_verified, created_at, updated_at
            FROM users 
            WHERE id = ?
            "#,
            user_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        self.generate_token(&user)
    }

    pub async fn authenticate(&self, username_or_email: &str, password: &str) -> Result<String, String> {
        // Validate input
        if username_or_email.is_empty() || password.is_empty() {
            return Err("Username/email and password are required".to_string());
        }

        // Start transaction
        let mut transaction = self.pool.begin().await
            .map_err(|e| format!("Transaction error: {}", e))?;

        // Find user by username or email
        let user = sqlx::query_as!(
            UserWithPassword,
            r#"
            SELECT 
                id, username, email, full_name, password_hash, 
                avatar_url, bio, website_url, location, company, 
                is_admin, is_verified, created_at, updated_at
            FROM users 
            WHERE username = ? OR email = ?
            "#,
            username_or_email,
            username_or_email
        )
        .fetch_optional(&mut *transaction)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        let user = user.ok_or("Invalid credentials".to_string())?;

        // Verify password
        if !verify(password, &user.password_hash)
            .map_err(|e| format!("Password verification error: {}", e))? {
            return Err("Invalid credentials".to_string());
        }

        // Update last login timestamp
        sqlx::query!(
            "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            user.id
        )
        .execute(&mut *transaction)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Commit transaction
        transaction.commit().await
            .map_err(|e| format!("Transaction commit error: {}", e))?;

        self.generate_token(&user)
    }

    pub async fn validate_token(&self, token: &str) -> Result<UserWithPassword, String> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::default()
        )
        .map_err(|e| format!("Invalid token: {}", e))?;

        let user = sqlx::query_as!(
            UserWithPassword,
            r#"
            SELECT 
                id, username, email, full_name, password_hash, 
                avatar_url, bio, website_url, location, company, 
                is_admin, is_verified, created_at, updated_at
            FROM users 
            WHERE id = ?
            "#,
            token_data.claims.sub
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        user.ok_or("User not found".to_string())
    }

    pub async fn refresh_token(&self, user_id: &str) -> Result<String, String> {
        let user = sqlx::query_as!(
            UserWithPassword,
            r#"
            SELECT 
                id, username, email, full_name, password_hash, 
                avatar_url, bio, website_url, location, company, 
                is_admin, is_verified, created_at, updated_at
            FROM users 
            WHERE id = ?
            "#,
            user_id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        let user = user.ok_or("User not found".to_string())?;
        self.generate_token(&user)
    }

    fn generate_token(&self, user: &UserWithPassword) -> Result<String, String> {
        let now = Utc::now();
        let exp = (now + Duration::hours(24)).timestamp() as usize;
        let iat = now.timestamp() as usize;

        let claims = Claims {
            sub: user.id.clone(),
            username: user.username.clone(),
            email: user.email.clone(),
            exp,
            iat,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref())
        )
        .map_err(|e| format!("Token generation error: {}", e))
    }
}
