use actix_web::{get, web, HttpResponse, Result};
use sqlx::MySqlPool;

#[get("/health")]
pub async fn health_check(pool: web::Data<MySqlPool>) -> Result<HttpResponse> {
    // Check database connection
    let db_status = match sqlx::query("SELECT 1").fetch_one(pool.get_ref()).await {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };

    let response = serde_json::json!({
        "status": if db_status == "healthy" { "healthy" } else { "unhealthy" },
        "service": "DevIT Backend",
        "version": env!("CARGO_PKG_VERSION"),
        "database": db_status,
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    if db_status == "healthy" {
        Ok(HttpResponse::Ok().json(response))
    } else {
        Ok(HttpResponse::ServiceUnavailable().json(response))
    }
}
