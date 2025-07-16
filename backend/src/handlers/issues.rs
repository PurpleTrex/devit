use actix_web::{web, HttpResponse, Result, HttpRequest};
use serde::Deserialize;
use crate::services::{IssueService, RepositoryService, UserService};
use crate::models::{CreateIssueRequest, UpdateIssueRequest};
use crate::utils::jwt::extract_user_from_token;
use crate::utils::response::{success_response, error_response};

#[derive(Deserialize)]
pub struct IssueQuery {
    pub state: Option<String>, // open, closed, all
    pub assignee: Option<String>,
    pub labels: Option<String>,
    pub sort: Option<String>, // created, updated, comments
    pub direction: Option<String>, // asc, desc
}

pub async fn list_issues(
    path: web::Path<(String, String)>,
    _query: web::Query<IssueQuery>,
    issue_service: web::Data<IssueService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name) = path.into_inner();
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    // Use repository ID as String (MySQL VARCHAR)
    let repo_id = repo.id.clone();
    
    match issue_service.list_repository_issues(&repo_id).await {
        Ok(issues) => Ok(success_response(issues)),
        Err(err) => Ok(error_response(&err, 500)),
    }
}

pub async fn get_issue(
    path: web::Path<(String, String, i32)>,
    issue_service: web::Data<IssueService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name, issue_number) = path.into_inner();
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    let repo_id = repo.id.clone();
    
    match issue_service.get_issue(&repo_id, issue_number).await {
        Ok(issue) => Ok(success_response(issue)),
        Err(err) => Ok(error_response(&err, 404)),
    }
}

pub async fn create_issue(
    req: HttpRequest,
    path: web::Path<(String, String)>,
    json: web::Json<CreateIssueRequest>,
    issue_service: web::Data<IssueService>,
    repo_service: web::Data<RepositoryService>,
    _user_service: web::Data<UserService>,
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
    
    let repo_id = repo.id.clone();
    
    // Get current user's ID as String (MySQL VARCHAR)
    let current_user_id = current_user.id.clone();
    
    let request = json.into_inner();
    
    match issue_service.create_issue(
        &repo_id,
        &current_user_id,
        &request.title,
        request.body.as_deref()
    ).await {
        Ok(issue) => Ok(success_response(issue)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn update_issue(
    req: HttpRequest,
    path: web::Path<(String, String, i32)>,
    json: web::Json<UpdateIssueRequest>,
    issue_service: web::Data<IssueService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name, issue_number) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    let repo_id = repo.id.clone();
    
    // Get the issue to verify it exists and get its ID
    let issue = match issue_service.get_issue(&repo_id, issue_number).await {
        Ok(issue) => issue,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    let request = json.into_inner();
    
    match issue_service.update_issue(
        &issue.id,
        request.title.as_deref(),
        request.body.as_deref(),
        request.status.as_deref()
    ).await {
        Ok(updated_issue) => Ok(success_response(updated_issue)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn assign_issue(
    req: HttpRequest,
    path: web::Path<(String, String, i32)>,
    json: web::Json<serde_json::Value>,
    issue_service: web::Data<IssueService>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, repo_name, issue_number) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &repo_name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    let repo_id = repo.id.clone();
    
    // Get the issue
    let issue = match issue_service.get_issue(&repo_id, issue_number).await {
        Ok(issue) => issue,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    let assignee_id = json.get("assignee_id").and_then(|v| v.as_str());
    
    match issue_service.assign_issue(&issue.id, assignee_id).await {
        Ok(updated_issue) => Ok(success_response(updated_issue)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub fn issue_routes() -> actix_web::Scope {
    web::scope("/repos/{owner}/{repo}/issues")
        .route("", web::get().to(list_issues))
        .route("", web::post().to(create_issue))
        .route("/{number}", web::get().to(get_issue))
        .route("/{number}", web::patch().to(update_issue))
        .route("/{number}/assignees", web::post().to(assign_issue))
}
