use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PullRequest {
    pub id: String,
    pub number: i32,
    pub title: String,
    pub body: Option<String>,
    pub status: String,
    pub repository_id: String,
    pub author_id: String,
    pub head_branch: String,
    pub base_branch: String,
    pub is_merged: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub merged_at: Option<DateTime<Utc>>,
    pub closed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePullRequestRequest {
    pub title: String,
    pub body: Option<String>,
    pub base_branch: String,
    pub head_branch: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePullRequestRequest {
    pub title: Option<String>,
    pub body: Option<String>,
    pub status: Option<String>,
}
