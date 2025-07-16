use crate::models::PullRequest;
use sqlx::MySqlPool;

#[derive(Clone)]
pub struct PullRequestService {
    pool: MySqlPool,
}

impl PullRequestService {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }

    pub async fn get_pull_request(&self, repo_id: &str, pr_number: i32) -> Result<PullRequest, String> {
        let pr = sqlx::query_as!(
            PullRequest,
            r#"
            SELECT 
                id, number, title, body, status, author_id,
                repository_id, base_branch, head_branch, 
                is_merged as "is_merged: bool",
                created_at, updated_at, merged_at, closed_at
            FROM pull_requests
            WHERE repository_id = ? AND number = ?
            "#,
            repo_id, pr_number
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        pr.ok_or_else(|| "Pull request not found".to_string())
    }

    pub async fn list_repository_pull_requests(&self, repo_id: &str) -> Result<Vec<PullRequest>, String> {
        let prs = sqlx::query_as!(
            PullRequest,
            r#"
            SELECT 
                id, number, title, body, status, author_id,
                repository_id, base_branch, head_branch, 
                is_merged as "is_merged: bool",
                created_at, updated_at, merged_at, closed_at
            FROM pull_requests
            WHERE repository_id = ?
            ORDER BY created_at DESC
            "#,
            repo_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(prs)
    }

    pub async fn create_pull_request(&self, repo_id: &str, author_id: &str, title: &str, body: Option<&str>, base_branch: &str, head_branch: &str) -> Result<PullRequest, String> {
        // Get the next PR number for this repository
        let next_number = sqlx::query!(
            "SELECT COALESCE(MAX(number), 0) + 1 as next_number FROM pull_requests WHERE repository_id = ?",
            repo_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Insert the pull request
        let result = sqlx::query!(
            r#"
            INSERT INTO pull_requests (
                number, title, body, status, author_id, repository_id,
                base_branch, head_branch, is_merged,
                created_at, updated_at
            )
            VALUES (?, ?, ?, 'open', ?, ?, ?, ?, false, NOW(), NOW())
            "#,
            next_number.next_number,
            title,
            body,
            author_id,
            repo_id,
            base_branch,
            head_branch
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        let pr_id = result.last_insert_id().to_string();

        // Fetch the created pull request
        let pr = sqlx::query_as!(
            PullRequest,
            r#"
            SELECT 
                id, number, title, body, status, author_id,
                repository_id, base_branch, head_branch, 
                is_merged as "is_merged: bool",
                created_at, updated_at, merged_at, closed_at
            FROM pull_requests
            WHERE id = ?
            "#,
            pr_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(pr)
    }

    pub async fn update_pull_request(&self, pr_id: &str, title: Option<&str>, body: Option<&str>, status: Option<&str>) -> Result<PullRequest, String> {
        // Update the pull request
        sqlx::query!(
            r#"
            UPDATE pull_requests
            SET 
                title = COALESCE(?, title),
                body = COALESCE(?, body),
                status = COALESCE(?, status),
                updated_at = NOW(),
                closed_at = CASE WHEN ? = 'closed' THEN NOW() ELSE closed_at END
            WHERE id = ?
            "#,
            title, body, status, status, pr_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Fetch the updated pull request
        let pr = sqlx::query_as!(
            PullRequest,
            r#"
            SELECT 
                id, number, title, body, status, author_id,
                repository_id, base_branch, head_branch, 
                is_merged as "is_merged: bool",
                created_at, updated_at, merged_at, closed_at
            FROM pull_requests
            WHERE id = ?
            "#,
            pr_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(pr)
    }

    pub async fn merge_pull_request(&self, pr_id: &str, _merged_by_id: &str, _merge_commit_sha: &str) -> Result<PullRequest, String> {
        // Update the pull request
        sqlx::query!(
            r#"
            UPDATE pull_requests
            SET 
                status = 'merged',
                is_merged = true,
                merged_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
            "#,
            pr_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Fetch the updated pull request
        let pr = sqlx::query_as!(
            PullRequest,
            r#"
            SELECT 
                id, number, title, body, status, author_id,
                repository_id, base_branch, head_branch, 
                is_merged as "is_merged: bool",
                created_at, updated_at, merged_at, closed_at
            FROM pull_requests
            WHERE id = ?
            "#,
            pr_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(pr)
    }
}

