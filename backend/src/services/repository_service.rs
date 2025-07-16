use crate::models::Repository;
use sqlx::MySqlPool;

#[derive(Clone)]
pub struct RepositoryService {
    pool: MySqlPool,
}

impl RepositoryService {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }

    pub async fn get_repository(&self, owner: &str, name: &str) -> Result<Repository, String> {
        let repo = sqlx::query_as!(
            Repository,
            r#"
            SELECT 
                r.id, r.name, r.description, r.is_private, r.is_fork, r.is_archived,
                r.owner_id, r.organization_id, r.default_branch, r.language,
                r.star_count, r.fork_count, r.watch_count, r.size,
                r.created_at, r.updated_at, r.pushed_at
            FROM repositories r
            INNER JOIN users u ON r.owner_id = u.id
            WHERE u.username = ? AND r.name = ?
            "#,
            owner, name
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        repo.ok_or_else(|| "Repository not found".to_string())
    }

    pub async fn list_user_repositories(&self, username: &str) -> Result<Vec<Repository>, String> {
        let repos = sqlx::query_as!(
            Repository,
            r#"
            SELECT 
                r.id, r.name, r.description, r.is_private, r.is_fork, r.is_archived,
                r.owner_id, r.organization_id, r.default_branch, r.language,
                r.star_count, r.fork_count, r.watch_count, r.size,
                r.created_at, r.updated_at, r.pushed_at
            FROM repositories r
            INNER JOIN users u ON r.owner_id = u.id
            WHERE u.username = ?
            ORDER BY r.updated_at DESC
            "#,
            username
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(repos)
    }

    pub async fn create_repository(&self, owner_id: &str, name: &str, description: Option<&str>, is_private: bool) -> Result<Repository, String> {
        // Insert the repository
        let result = sqlx::query!(
            r#"
            INSERT INTO repositories (name, description, is_private, owner_id, default_branch, language, star_count, fork_count, watch_count, size, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'main', NULL, 0, 0, 0, 0, NOW(), NOW())
            "#,
            name, description, is_private, owner_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        let repo_id = result.last_insert_id().to_string();

        // Fetch the created repository
        let repo = sqlx::query_as!(
            Repository,
            r#"
            SELECT 
                id, name, description, is_private, is_fork, is_archived,
                owner_id, organization_id, default_branch, language,
                star_count, fork_count, watch_count, size,
                created_at, updated_at, pushed_at
            FROM repositories
            WHERE id = ?
            "#,
            repo_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(repo)
    }

    pub async fn update_repository(&self, repo_id: &str, name: Option<&str>, description: Option<&str>, is_private: Option<bool>) -> Result<Repository, String> {
        // Update the repository
        sqlx::query!(
            r#"
            UPDATE repositories 
            SET 
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                is_private = COALESCE(?, is_private),
                updated_at = NOW()
            WHERE id = ?
            "#,
            name, description, is_private, repo_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Fetch the updated repository
        let repo = sqlx::query_as!(
            Repository,
            r#"
            SELECT 
                id, name, description, is_private, is_fork, is_archived,
                owner_id, organization_id, default_branch, language,
                star_count, fork_count, watch_count, size,
                created_at, updated_at, pushed_at
            FROM repositories
            WHERE id = ?
            "#,
            repo_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(repo)
    }

    pub async fn delete_repository(&self, repo_id: &str) -> Result<(), String> {
        sqlx::query!(
            "DELETE FROM repositories WHERE id = ?",
            repo_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(())
    }

    pub async fn star_repository(&self, user_id: &str, repo_id: &str) -> Result<(), String> {
        // Insert star record
        sqlx::query!(
            "INSERT IGNORE INTO stars (user_id, repository_id, created_at) VALUES (?, ?, NOW())",
            user_id, repo_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Update star count
        sqlx::query!(
            "UPDATE repositories SET star_count = (SELECT COUNT(*) FROM stars WHERE repository_id = ?) WHERE id = ?",
            repo_id, repo_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(())
    }

    pub async fn unstar_repository(&self, user_id: &str, repo_id: &str) -> Result<(), String> {
        // Remove star record
        sqlx::query!(
            "DELETE FROM stars WHERE user_id = ? AND repository_id = ?",
            user_id, repo_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Update star count
        sqlx::query!(
            "UPDATE repositories SET star_count = (SELECT COUNT(*) FROM stars WHERE repository_id = ?) WHERE id = ?",
            repo_id, repo_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(())
    }

    pub async fn is_repository_starred(&self, user_id: &str, repo_id: &str) -> Result<bool, String> {
        let count = sqlx::query!(
            "SELECT COUNT(*) as count FROM stars WHERE user_id = ? AND repository_id = ?",
            user_id, repo_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(count.count > 0)
    }
}

