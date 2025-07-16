use crate::models::Issue;
use sqlx::MySqlPool;

#[derive(Clone)]
pub struct IssueService {
    pool: MySqlPool,
}

impl IssueService {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }

    pub async fn get_issue(&self, repo_id: &str, issue_number: i32) -> Result<Issue, String> {
        let issue = sqlx::query_as!(
            Issue,
            r#"
            SELECT 
                id, number, title, body, status, author_id, assignee_id,
                repository_id, created_at, updated_at, closed_at
            FROM issues
            WHERE repository_id = ? AND number = ?
            "#,
            repo_id, issue_number
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        issue.ok_or_else(|| "Issue not found".to_string())
    }

    pub async fn list_repository_issues(&self, repo_id: &str) -> Result<Vec<Issue>, String> {
        let issues = sqlx::query_as!(
            Issue,
            r#"
            SELECT 
                id, number, title, body, status, author_id, assignee_id,
                repository_id, created_at, updated_at, closed_at
            FROM issues
            WHERE repository_id = ?
            ORDER BY created_at DESC
            "#,
            repo_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(issues)
    }

    pub async fn create_issue(&self, repo_id: &str, author_id: &str, title: &str, body: Option<&str>) -> Result<Issue, String> {
        // Get the next issue number for this repository
        let next_number = sqlx::query!(
            "SELECT COALESCE(MAX(number), 0) + 1 as next_number FROM issues WHERE repository_id = ?",
            repo_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Insert the issue
        sqlx::query!(
            r#"
            INSERT INTO issues (number, title, body, status, author_id, repository_id, created_at, updated_at)
            VALUES (?, ?, ?, 'OPEN', ?, ?, NOW(), NOW())
            "#,
            next_number.next_number,
            title,
            body,
            author_id,
            repo_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Get the inserted issue by repository_id and number
        let issue = sqlx::query_as!(
            Issue,
            r#"
            SELECT 
                id, number, title, body, status, author_id, assignee_id,
                repository_id, created_at, updated_at, closed_at
            FROM issues
            WHERE repository_id = ? AND number = ?
            "#,
            repo_id,
            next_number.next_number
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(issue)
    }

    pub async fn update_issue(&self, issue_id: &str, title: Option<&str>, body: Option<&str>, status: Option<&str>) -> Result<Issue, String> {
        // Update the issue
        sqlx::query!(
            r#"
            UPDATE issues
            SET 
                title = COALESCE(?, title),
                body = COALESCE(?, body),
                status = COALESCE(?, status),
                updated_at = NOW(),
                closed_at = CASE WHEN ? = 'CLOSED' THEN NOW() ELSE closed_at END
            WHERE id = ?
            "#,
            title, body, status, status, issue_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Get the updated issue
        let issue = sqlx::query_as!(
            Issue,
            r#"
            SELECT 
                id, number, title, body, status, author_id, assignee_id,
                repository_id, created_at, updated_at, closed_at
            FROM issues
            WHERE id = ?
            "#,
            issue_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(issue)
    }

    pub async fn assign_issue(&self, issue_id: &str, assignee_id: Option<&str>) -> Result<Issue, String> {
        // Update the issue
        sqlx::query!(
            r#"
            UPDATE issues
            SET assignee_id = ?, updated_at = NOW()
            WHERE id = ?
            "#,
            assignee_id, issue_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        // Get the updated issue
        let issue = sqlx::query_as!(
            Issue,
            r#"
            SELECT 
                id, number, title, body, status, author_id, assignee_id,
                repository_id, created_at, updated_at, closed_at
            FROM issues
            WHERE id = ?
            "#,
            issue_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;

        Ok(issue)
    }

}

