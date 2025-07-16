use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Repository {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_private: Option<i8>, // MySQL TINYINT(1)
    pub is_fork: Option<i8>, // MySQL TINYINT(1)
    pub is_archived: Option<i8>, // MySQL TINYINT(1)
    pub owner_id: String,
    pub organization_id: Option<String>,
    pub default_branch: String,
    pub language: Option<String>,
    pub star_count: i32,
    pub fork_count: i32,
    pub watch_count: i32,
    pub size: i64,
    pub created_at: Option<DateTime<Utc>>, // MySQL TIMESTAMP
    pub updated_at: Option<DateTime<Utc>>, // MySQL TIMESTAMP
    pub pushed_at: Option<DateTime<Utc>>, // MySQL TIMESTAMP
}

impl Repository {
    // Helper methods to convert MySQL types to bool
    pub fn is_private_bool(&self) -> bool {
        self.is_private.unwrap_or(0) != 0
    }
    
    pub fn is_fork_bool(&self) -> bool {
        self.is_fork.unwrap_or(0) != 0
    }
    
    pub fn is_archived_bool(&self) -> bool {
        self.is_archived.unwrap_or(0) != 0
    }
    
    pub fn created_at_utc(&self) -> DateTime<Utc> {
        self.created_at.unwrap_or_else(|| Utc::now())
    }
    
    pub fn updated_at_utc(&self) -> DateTime<Utc> {
        self.updated_at.unwrap_or_else(|| Utc::now())
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateRepositoryRequest {
    pub name: String,
    pub description: Option<String>,
    pub is_private: bool,
    pub auto_init: Option<bool>,
    pub gitignore_template: Option<String>,
    pub license_template: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRepositoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_private: Option<bool>,
    pub is_archived: Option<bool>,
    pub default_branch: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RepositoryResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_private: bool,
    pub is_fork: bool,
    pub is_archived: bool,
    pub owner_id: String,
    pub organization_id: Option<String>,
    pub default_branch: String,
    pub language: Option<String>,
    pub star_count: i32,
    pub fork_count: i32,
    pub watch_count: i32,
    pub size: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub pushed_at: Option<DateTime<Utc>>,
}

impl From<Repository> for RepositoryResponse {
    fn from(repo: Repository) -> Self {
        RepositoryResponse {
            id: repo.id.clone(),
            name: repo.name.clone(),
            description: repo.description.clone(),
            is_private: repo.is_private_bool(),
            is_fork: repo.is_fork_bool(),
            is_archived: repo.is_archived_bool(),
            owner_id: repo.owner_id.clone(),
            organization_id: repo.organization_id.clone(),
            default_branch: repo.default_branch.clone(),
            language: repo.language.clone(),
            star_count: repo.star_count,
            fork_count: repo.fork_count,
            watch_count: repo.watch_count,
            size: repo.size,
            created_at: repo.created_at_utc(),
            updated_at: repo.updated_at_utc(),
            pushed_at: repo.pushed_at,
        }
    }
}
