use actix_web::{web, HttpResponse, Result, HttpRequest};
use serde::Deserialize;
use crate::services::RepositoryService;
use crate::models::{CreateRepositoryRequest, UpdateRepositoryRequest};
use crate::utils::jwt::extract_user_from_token;
use crate::utils::response::{success_response, error_response};

#[derive(Deserialize)]
pub struct ListReposQuery {
    pub username: Option<String>,
    pub org: Option<String>,
    pub type_filter: Option<String>, // all, owner, member, public, private
    pub sort: Option<String>, // created, updated, pushed, full_name
    pub direction: Option<String>, // asc, desc
}

pub async fn list_repos(
    query: web::Query<ListReposQuery>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let username = match &query.username {
        Some(user) => user,
        None => return Ok(error_response("Username parameter is required", 400)),
    };
    
    match repo_service.list_user_repositories(username).await {
        Ok(repos) => Ok(success_response(repos)),
        Err(err) => Ok(error_response(&err, 500)),
    }
}

pub async fn get_repo(
    path: web::Path<(String, String)>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, name) = path.into_inner();
    
    match repo_service.get_repository(&owner, &name).await {
        Ok(repo) => Ok(success_response(repo)),
        Err(err) => Ok(error_response(&err, 404)),
    }
}

pub async fn create_repo(
    req: HttpRequest,
    json: web::Json<CreateRepositoryRequest>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    let request = json.into_inner();
    
    match repo_service.create_repository(
        &current_user.id,
        &request.name,
        request.description.as_deref(),
        request.is_private
    ).await {
        Ok(repo) => Ok(success_response(repo)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn update_repo(
    req: HttpRequest,
    path: web::Path<(String, String)>,
    json: web::Json<UpdateRepositoryRequest>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, name) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Check if user owns the repository
    let repo = match repo_service.get_repository(&owner, &name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    if repo.owner_id != current_user.id {
        return Ok(error_response("Unauthorized to update this repository", 403));
    }
    
    let request = json.into_inner();
    
    match repo_service.update_repository(
        &repo.id,
        request.name.as_deref(),
        request.description.as_deref(),
        request.is_private
    ).await {
        Ok(updated_repo) => Ok(success_response(updated_repo)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn delete_repo(
    req: HttpRequest,
    path: web::Path<(String, String)>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, name) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Check if user owns the repository
    let repo = match repo_service.get_repository(&owner, &name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    if repo.owner_id != current_user.id {
        return Ok(error_response("Unauthorized to delete this repository", 403));
    }
    
    match repo_service.delete_repository(&repo.id).await {
        Ok(_) => Ok(success_response("Repository deleted successfully")),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn star_repo(
    req: HttpRequest,
    path: web::Path<(String, String)>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, name) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match repo_service.star_repository(&current_user.id, &repo.id).await {
        Ok(_) => Ok(success_response("Repository starred successfully")),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn unstar_repo(
    req: HttpRequest,
    path: web::Path<(String, String)>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, name) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match repo_service.unstar_repository(&current_user.id, &repo.id).await {
        Ok(_) => Ok(success_response("Repository unstarred successfully")),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn check_star_status(
    req: HttpRequest,
    path: web::Path<(String, String)>,
    repo_service: web::Data<RepositoryService>,
) -> Result<HttpResponse> {
    let (owner, name) = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get repository
    let repo = match repo_service.get_repository(&owner, &name).await {
        Ok(repo) => repo,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match repo_service.is_repository_starred(&current_user.id, &repo.id).await {
        Ok(is_starred) => Ok(success_response(serde_json::json!({ "starred": is_starred }))),
        Err(err) => Ok(error_response(&err, 500)),
    }
}

pub fn repo_routes() -> actix_web::Scope {
    web::scope("/repos")
        .route("", web::get().to(list_repos))
        .route("", web::post().to(create_repo))
        .route("/{owner}/{repo}", web::get().to(get_repo))
        .route("/{owner}/{repo}", web::put().to(update_repo))
        .route("/{owner}/{repo}", web::delete().to(delete_repo))
        .route("/{owner}/{repo}/star", web::put().to(star_repo))
        .route("/{owner}/{repo}/star", web::delete().to(unstar_repo))
        .route("/{owner}/{repo}/star", web::get().to(check_star_status))
}
