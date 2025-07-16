use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub full_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub website_url: Option<String>,
    pub location: Option<String>,
    pub company: Option<String>,
    pub is_admin: Option<i8>, // MySQL TINYINT(1)
    pub is_verified: Option<i8>, // MySQL TINYINT(1)
    pub created_at: Option<DateTime<Utc>>, // MySQL TIMESTAMP
    pub updated_at: Option<DateTime<Utc>>, // MySQL TIMESTAMP
}

// For backwards compatibility with the auth service that expects a 'password' field
// This matches the actual MySQL column types
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserWithPassword {
    pub id: String,
    pub username: String,
    pub email: String,
    pub full_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub website_url: Option<String>,
    pub location: Option<String>,
    pub company: Option<String>,
    pub is_admin: Option<i8>, // MySQL TINYINT(1)
    pub is_verified: Option<i8>, // MySQL TINYINT(1)
    pub password_hash: String,
    pub created_at: Option<DateTime<Utc>>, // MySQL TIMESTAMP
    pub updated_at: Option<DateTime<Utc>>, // MySQL TIMESTAMP
}

impl User {
    // Helper methods to convert MySQL types to bool
    pub fn is_admin_bool(&self) -> bool {
        self.is_admin.unwrap_or(0) != 0
    }
    
    pub fn is_verified_bool(&self) -> bool {
        self.is_verified.unwrap_or(0) != 0
    }
    
    // Helper methods to handle optional timestamps
    pub fn created_at_utc(&self) -> DateTime<Utc> {
        self.created_at.unwrap_or_else(|| Utc::now())
    }
    
    pub fn updated_at_utc(&self) -> DateTime<Utc> {
        self.updated_at.unwrap_or_else(|| Utc::now())
    }
}

impl UserWithPassword {
    // Helper methods to convert MySQL types to bool
    pub fn is_admin_bool(&self) -> bool {
        self.is_admin.unwrap_or(0) != 0
    }
    
    pub fn is_verified_bool(&self) -> bool {
        self.is_verified.unwrap_or(0) != 0
    }
    
    // Helper methods to handle optional timestamps
    pub fn created_at_utc(&self) -> DateTime<Utc> {
        self.created_at.unwrap_or_else(|| Utc::now())
    }
    
    pub fn updated_at_utc(&self) -> DateTime<Utc> {
        self.updated_at.unwrap_or_else(|| Utc::now())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum UserStatus {
    Active,
    Inactive,
    Suspended,
    Pending,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub username: String,
    pub email: String,
    pub full_name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub website_url: Option<String>,
    pub location: Option<String>,
    pub company: Option<String>,
    pub is_admin: bool,
    pub is_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id.clone(),
            username: user.username.clone(),
            email: user.email.clone(),
            full_name: user.full_name.clone(),
            avatar_url: user.avatar_url.clone(),
            bio: user.bio.clone(),
            website_url: user.website_url.clone(),
            location: user.location.clone(),
            company: user.company.clone(),
            is_admin: user.is_admin_bool(),
            is_verified: user.is_verified_bool(),
            created_at: user.created_at_utc(),
            updated_at: user.updated_at_utc(),
        }
    }
}

impl From<UserWithPassword> for UserResponse {
    fn from(user: UserWithPassword) -> Self {
        Self {
            id: user.id.clone(),
            username: user.username.clone(),
            email: user.email.clone(),
            full_name: user.full_name.clone(),
            avatar_url: user.avatar_url.clone(),
            bio: user.bio.clone(),
            website_url: user.website_url.clone(),
            location: user.location.clone(),
            company: user.company.clone(),
            is_admin: user.is_admin_bool(),
            is_verified: user.is_verified_bool(),
            created_at: user.created_at_utc(),
            updated_at: user.updated_at_utc(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username_or_email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub full_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub website_url: Option<String>,
    pub location: Option<String>,
    pub company: Option<String>,
}
