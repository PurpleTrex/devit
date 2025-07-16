use actix_web::{HttpResponse, Result};
use serde::Serialize;
use serde_json::json;

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

pub fn success_response<T: Serialize>(data: T) -> HttpResponse {
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(data),
        message: None,
    })
}

pub fn error_response<S: AsRef<str>>(message: S, status_code: u16) -> HttpResponse {
    let mut response = match status_code {
        400 => HttpResponse::BadRequest(),
        401 => HttpResponse::Unauthorized(),
        403 => HttpResponse::Forbidden(),
        404 => HttpResponse::NotFound(),
        500 => HttpResponse::InternalServerError(),
        501 => HttpResponse::NotImplemented(),
        _ => HttpResponse::InternalServerError(),
    };

    response.json(ApiResponse::<()> {
        success: false,
        data: None,
        message: Some(message.as_ref().to_string()),
    })
}

pub fn message_response(message: &str) -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(json!({
        "success": true,
        "message": message
    })))
}
