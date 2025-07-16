use actix_web::middleware::Logger;
use env_logger::Env;

pub fn setup_logging() {
    env_logger::init_from_env(Env::default().default_filter_or("info"));
}

pub fn get_logger() -> Logger {
    Logger::default()
}
