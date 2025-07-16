use actix_web::{dev::ServiceRequest, Error, HttpMessage, web};
use actix_web_httpauth::extractors::bearer::{BearerAuth, Config};
use actix_web_httpauth::extractors::AuthenticationError;
use crate::services::AuthService;
use crate::config::AppConfig;
use sqlx::MySqlPool;

pub async fn validator(req: ServiceRequest, credentials: BearerAuth) -> Result<ServiceRequest, (Error, ServiceRequest)> {
    let pool = req.app_data::<web::Data<MySqlPool>>().unwrap();
    let config = req.app_data::<web::Data<AppConfig>>().unwrap();
    let auth_service = AuthService::new(pool.get_ref().clone(), config.jwt_secret.clone());
    
    match auth_service.validate_token(credentials.token()).await {
        Ok(user) => {
            req.extensions_mut().insert(user);
            Ok(req)
        }
        Err(_) => {
            let config = req.app_data::<Config>().cloned().unwrap_or_default();
            Err((AuthenticationError::from(config).into(), req))
        }
    }
}
