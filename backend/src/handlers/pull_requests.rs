use actix_web::{web, HttpResponse, Result, HttpRequest};
use serde::Deserialize;
use crate::services::{PullRequestService, RepositoryService};
use crate::models::{CreatePullRequestRequest, UpdatePullRequestRequest};
use crate::utils::jwt::extract_user_from_token;
use crate::utils::response::{success_response, error_response};

#[derive(Deserialize)]
pub struct PullRequestQuery {
    pub state: Option<String>, // open, closed, merged, all
    pub head: Option<String>,
    pub base: Option<String>,
    pub sort: Option<String>, // created, updated, popularity
    pub direction: Option<String>, // asc, desc
}

pub async fn list_pull_requests(
    path: web::Path<(String, String)>,
    _query: web::Query<PullRequestQuery>,
    pr_service: web::Data<PullRequestService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name) = path.into_inner();
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match pr_service.list_repository_pull_requests(&repo.id).await {
        Ok(prs) => Ok(success_response(prs)),
        Err(err) => Ok(error_response(&err, 500)),
    }
}

pub async fn get_pull_request(
    path: web::Path<(String, String, i32)>,
    pr_service: web::Data<PullRequestService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name, pr_number) = path.into_inner();
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match pr_service.get_pull_request(&repo.id, pr_number).await {
        Ok(pr) => Ok(success_response(pr)),
        Err(err) => Ok(error_response(&err, 404)),
    }
}

pub async fn create_pull_request(
    req: HttpRequest,
    path: web::Path<(String, String)>,
    json: web::Json<CreatePullRequestRequest>,
    pr_service: web::Data<PullRequestService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    let request = json.into_inner();
    
    match pr_service.create_pull_request(
        &repo.id,
        &current_user.id,
        &request.title,
        request.body.as_deref(),
        &request.base_branch,
        &request.head_branch
    ).await {
        Ok(pr) => Ok(success_response(pr)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn update_pull_request(
    req: HttpRequest,
    path: web::Path<(String, String, i32)>,
    json: web::Json<UpdatePullRequestRequest>,
    pr_service: web::Data<PullRequestService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name, pr_number) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    // Get the pull request to verify it exists
    let pr = match pr_service.get_pull_request(&repo.id, pr_number).await {
        Ok(pr) => pr,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    let request = json.into_inner();
    
    match pr_service.update_pull_request(
        &pr.id,
        request.title.as_deref(),
        request.body.as_deref(),
        request.status.as_deref()
    ).await {
        Ok(updated_pr) => Ok(success_response(updated_pr)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn merge_pull_request(
    req: HttpRequest,
    path: web::Path<(String, String, i32)>,
    json: web::Json<serde_json::Value>,
    pr_service: web::Data<PullRequestService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name, pr_number) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    // Get the pull request
    let pr = match pr_service.get_pull_request(&repo.id, pr_number).await {
        Ok(pr) => pr,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    // Verify user has permission to merge (owner or admin)
    if repo.owner_id != current_user.id {
        return Ok(error_response("Insufficient permissions to merge", 403));
    }
    
    let merge_message = json.get("commit_message")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("Merge pull request #{} from {}", pr.number, pr.head_branch));

    match pr_service.merge_pull_request(&pr.id, &current_user.id, &merge_message).await {
        Ok(merged_pr) => Ok(success_response(merged_pr)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn close_pull_request(
    req: HttpRequest,
    path: web::Path<(String, String, i32)>,
    pr_service: web::Data<PullRequestService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name, pr_number) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    // Get the pull request
    let pr = match pr_service.get_pull_request(&repo.id, pr_number).await {
        Ok(pr) => pr,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    // Verify user can close PR (author or repo owner)
    if pr.author_id != current_user.id && repo.owner_id != current_user.id {
        return Ok(error_response("Insufficient permissions to close", 403));
    }
    
    match pr_service.update_pull_request(&pr.id, None, None, Some("closed")).await {
        Ok(closed_pr) => Ok(success_response(closed_pr)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn reopen_pull_request(
    req: HttpRequest,
    path: web::Path<(String, String, i32)>,
    pr_service: web::Data<PullRequestService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name, pr_number) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    // Get the pull request
    let pr = match pr_service.get_pull_request(&repo.id, pr_number).await {
        Ok(pr) => pr,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    // Verify user can reopen PR (author or repo owner)
    if pr.author_id != current_user.id && repo.owner_id != current_user.id {
        return Ok(error_response("Insufficient permissions to reopen", 403));
    }
    
    match pr_service.update_pull_request(&pr.id, None, None, Some("open")).await {
        Ok(reopened_pr) => Ok(success_response(reopened_pr)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub fn pull_request_routes() -> actix_web::Scope {
    web::scope("/repos/{owner}/{repo}/pulls")
        .route("", web::get().to(list_pull_requests))
        .route("", web::post().to(create_pull_request))
        .route("/{number}", web::get().to(get_pull_request))
        .route("/{number}", web::patch().to(update_pull_request))
        .route("/{number}/merge", web::put().to(merge_pull_request))
        .route("/{number}/close", web::patch().to(close_pull_request))
        .route("/{number}/reopen", web::patch().to(reopen_pull_request))
}
