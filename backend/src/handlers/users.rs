use actix_web::{web, HttpResponse, Result, HttpRequest};
use serde::Deserialize;
use crate::services::UserService;
use crate::models::UpdateUserRequest;
use crate::utils::jwt::extract_user_from_token;
use crate::utils::response::{success_response, error_response};

#[derive(Deserialize)]
pub struct ListUsersQuery {
    pub limit: Option<i32>,
    pub offset: Option<i32>,
    pub search: Option<String>,
}

pub async fn list_users(
    query: web::Query<ListUsersQuery>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    let users = if let Some(search_query) = &query.search {
        user_service.search_users(search_query, query.limit).await
    } else {
        user_service.get_all_users(query.limit, query.offset).await
    };

    match users {
        Ok(users) => Ok(success_response(users)),
        Err(err) => Ok(error_response(&err, 500)),
    }
}

pub async fn get_user(
    path: web::Path<String>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    let username = path.into_inner();
    
    match user_service.get_user_by_username(&username).await {
        Ok(user) => Ok(success_response(user)),
        Err(err) => Ok(error_response(&err, 404)),
    }
}

pub async fn update_user(
    req: HttpRequest,
    path: web::Path<String>,
    json: web::Json<UpdateUserRequest>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    let username = path.into_inner();
    
    // Extract user from JWT token
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Check if user is updating their own profile
    if current_user.username != username {
        return Ok(error_response("Unauthorized to update this user", 403));
    }
    
    match user_service.update_user(&current_user.id, json.into_inner()).await {
        Ok(user) => Ok(success_response(user)),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn follow_user(
    req: HttpRequest,
    path: web::Path<String>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    let username = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get the user to follow
    let target_user = match user_service.get_user_by_username(&username).await {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match user_service.follow_user(&current_user.id, &target_user.id).await {
        Ok(_) => Ok(success_response("User followed successfully")),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn unfollow_user(
    req: HttpRequest,
    path: web::Path<String>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    let username = path.into_inner();
    
    let current_user = match extract_user_from_token(&req) {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 401)),
    };
    
    // Get the user to unfollow
    let target_user = match user_service.get_user_by_username(&username).await {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match user_service.unfollow_user(&current_user.id, &target_user.id).await {
        Ok(_) => Ok(success_response("User unfollowed successfully")),
        Err(err) => Ok(error_response(&err, 400)),
    }
}

pub async fn get_user_followers(
    path: web::Path<String>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    let username = path.into_inner();
    
    // Get user ID first
    let user = match user_service.get_user_by_username(&username).await {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match user_service.get_followers(&user.id).await {
        Ok(followers) => Ok(success_response(followers)),
        Err(err) => Ok(error_response(&err, 500)),
    }
}

pub async fn get_user_following(
    path: web::Path<String>,
    user_service: web::Data<UserService>,
) -> Result<HttpResponse> {
    let username = path.into_inner();
    
    // Get user ID first
    let user = match user_service.get_user_by_username(&username).await {
        Ok(user) => user,
        Err(err) => return Ok(error_response(&err, 404)),
    };
    
    match user_service.get_following(&user.id).await {
        Ok(following) => Ok(success_response(following)),
        Err(err) => Ok(error_response(&err, 500)),
    }
}

pub fn user_routes() -> actix_web::Scope {
    web::scope("/users")
        .route("", web::get().to(list_users))
        .route("/{username}", web::get().to(get_user))
        .route("/{username}", web::put().to(update_user))
        .route("/{username}/follow", web::post().to(follow_user))
        .route("/{username}/unfollow", web::delete().to(unfollow_user))
        .route("/{username}/followers", web::get().to(get_user_followers))
        .route("/{username}/following", web::get().to(get_user_following))
}
