use actix_cors::Cors;
use actix_web::http;

pub fn setup_cors() -> Cors {
    Cors::default()
        .allowed_origin("http://localhost:3003")
        .allowed_origin("http://localhost:3000")
        .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        .allowed_headers(vec![
            http::header::AUTHORIZATION,
            http::header::ACCEPT,
            http::header::CONTENT_TYPE,
        ])
        .max_age(3600)
}
