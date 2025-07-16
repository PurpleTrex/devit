// Database models for DevIT - MySQL version

pub mod user;
pub mod repository;
pub mod issue;
pub mod pull_request;

// Re-export the MySQL models as the main models
pub use user::{User, UserWithPassword, UserResponse, CreateUserRequest, UpdateUserRequest};
pub use repository::{Repository, CreateRepositoryRequest, UpdateRepositoryRequest};
pub use issue::{Issue, CreateIssueRequest, UpdateIssueRequest};
pub use pull_request::{PullRequest, CreatePullRequestRequest, UpdatePullRequestRequest};
