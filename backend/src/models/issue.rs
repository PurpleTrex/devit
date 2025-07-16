use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Issue {
    pub id: String,
    pub number: i32,
    pub title: String,
    pub body: Option<String>,
    pub status: String,
    pub repository_id: String,
    pub author_id: String,
    pub assignee_id: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub closed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateIssueRequest {
    pub title: String,
    pub body: Option<String>,
    pub assignee_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateIssueRequest {
    pub title: Option<String>,
    pub body: Option<String>,
    pub status: Option<String>,
    pub assignee_id: Option<String>,
}
