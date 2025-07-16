use crate::models::{User, UserResponse, UpdateUserRequest};
use sqlx::MySqlPool;

#[derive(Clone)]
pub struct UserService {
    pool: MySqlPool,
}

impl UserService {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }

    pub async fn get_all_users(&self, limit: Option<i32>, offset: Option<i32>) -> Result<Vec<UserResponse>, String> {
        let limit = limit.unwrap_or(50).min(100); // Max 100 users per request
        let offset = offset.unwrap_or(0);

        let users = sqlx::query_as!(
            User,
            r#"
            SELECT 
                id, username, email, full_name, password_hash,
                avatar_url, bio, website_url, location, company, 
                is_admin, is_verified, created_at, updated_at
            FROM users 
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            "#,
            limit as i64,
            offset as i64
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(users.into_iter().map(UserResponse::from).collect())
    }

    pub async fn get_user_by_username(&self, username: &str) -> Result<UserResponse, String> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT 
                id, username, email, full_name, password_hash,
                avatar_url, bio, website_url, location, company, 
                is_admin, is_verified, created_at, updated_at
            FROM users 
            WHERE username = ?
            "#,
            username
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        user.map(UserResponse::from).ok_or("User not found".to_string())
    }

    pub async fn get_user_by_id(&self, user_id: &str) -> Result<UserResponse, String> {
        let user = sqlx::query_as!(
            User,
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

        user.map(UserResponse::from).ok_or("User not found".to_string())
    }

    pub async fn update_user(&self, user_id: &str, request: UpdateUserRequest) -> Result<UserResponse, String> {
        // Update the user
        sqlx::query!(
            r#"
            UPDATE users 
            SET 
                full_name = COALESCE(?, full_name),
                bio = COALESCE(?, bio),
                location = COALESCE(?, location),
                website_url = COALESCE(?, website_url),
                company = COALESCE(?, company),
                updated_at = NOW()
            WHERE id = ?
            "#,
            request.full_name,
            request.bio,
            request.location,
            request.website_url,
            request.company,
            user_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Fetch the updated user
        let user = sqlx::query_as!(
            User,
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

        user.map(UserResponse::from).ok_or("User not found".to_string())
    }

    pub async fn search_users(&self, query: &str, limit: Option<i32>) -> Result<Vec<UserResponse>, String> {
        let limit = limit.unwrap_or(20).min(50);
        let search_pattern = format!("%{}%", query);

        let users = sqlx::query_as!(
            User,
            r#"
            SELECT 
                id, username, email, full_name, password_hash,
                avatar_url, bio, website_url, location, company, 
                is_admin, is_verified, created_at, updated_at
            FROM users 
            WHERE (
                username LIKE ? 
                OR full_name LIKE ? 
                OR email LIKE ?
            )
            ORDER BY 
                CASE 
                    WHEN username LIKE ? THEN 1
                    WHEN full_name LIKE ? THEN 2
                    ELSE 3
                END,
                created_at DESC
            LIMIT ?
            "#,
            search_pattern,
            search_pattern,
            search_pattern,
            search_pattern,
            search_pattern,
            limit as i64
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(users.into_iter().map(UserResponse::from).collect())
    }

    pub async fn follow_user(&self, follower_id: &str, following_id: &str) -> Result<(), String> {
        if follower_id == following_id {
            return Err("Cannot follow yourself".to_string());
        }

        sqlx::query!(
            "INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)",
            follower_id,
            following_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(())
    }

    pub async fn unfollow_user(&self, follower_id: &str, following_id: &str) -> Result<(), String> {
        sqlx::query!(
            "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
            follower_id,
            following_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(())
    }

    pub async fn get_followers(&self, user_id: &str) -> Result<Vec<UserResponse>, String> {
        let users = sqlx::query_as!(
            User,
            r#"
            SELECT 
                u.id, u.username, u.email, u.full_name, u.password_hash,
                u.avatar_url, u.bio, u.website_url, u.location, u.company, 
                u.is_admin, u.is_verified, u.created_at, u.updated_at
            FROM users u
            INNER JOIN follows f ON u.id = f.follower_id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
            "#,
            user_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(users.into_iter().map(UserResponse::from).collect())
    }

    pub async fn get_following(&self, user_id: &str) -> Result<Vec<UserResponse>, String> {
        let users = sqlx::query_as!(
            User,
            r#"
            SELECT 
                u.id, u.username, u.email, u.full_name, u.password_hash,
                u.avatar_url, u.bio, u.website_url, u.location, u.company, 
                u.is_admin, u.is_verified, u.created_at, u.updated_at
            FROM users u
            INNER JOIN follows f ON u.id = f.following_id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
            "#,
            user_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(users.into_iter().map(UserResponse::from).collect())
    }
}

