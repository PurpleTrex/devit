use actix_web::{web, App, HttpServer, middleware::Logger};
use actix_cors::Cors;
use dotenv::dotenv;
use sqlx::mysql::MySqlPoolOptions;
use std::env;

mod config;
mod handlers;
mod models;
mod services;
mod middleware;
mod utils;

use config::AppConfig;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let config = AppConfig::from_env();
    
    // Initialize database connection for AlloyDB
    let database_url = if config.use_cloud_sql_proxy {
        config.get_alloydb_connection_string()
    } else {
        env::var("DATABASE_URL").unwrap_or_else(|_| config.get_alloydb_connection_string())
    };
    
    let pool = MySqlPoolOptions::new()
        .max_connections(20) // Increased for MySQL performance
        .min_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .idle_timeout(std::time::Duration::from_secs(600))
        .max_lifetime(std::time::Duration::from_secs(1800))
        .connect(&database_url)
        .await
        .expect("Failed to connect to MySQL");

    // Run database migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to migrate the database");

    log::info!("Starting DevIT Backend server on {}:{}", config.host, config.port);

    let bind_address = format!("{}:{}", config.host, config.port);

    // Initialize services (start with minimal working set)
    let auth_service = services::auth_service::AuthService::new(pool.clone(), config.jwt_secret.clone());

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .supports_credentials();

        App::new()
            .app_data(web::Data::new(config.clone()))
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(auth_service.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .service(
                web::scope("/api/v1")
                    .service(handlers::auth::auth_routes())
            )
            .service(handlers::health::health_check)
    })
    .bind(bind_address)?
    .run()
    .await
}
