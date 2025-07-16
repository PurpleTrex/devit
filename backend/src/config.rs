#[derive(Clone)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub minio_endpoint: String,
    pub minio_access_key: String,
    pub minio_secret_key: String,
    // AlloyDB specific configurations
    pub alloydb_instance_id: String,
    pub alloydb_cluster_id: String,
    pub alloydb_region: String,
    pub gcp_project_id: String,
    pub use_cloud_sql_proxy: bool,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            host: std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .expect("PORT must be a valid number"),
            database_url: std::env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            redis_url: std::env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            jwt_secret: std::env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            minio_endpoint: std::env::var("MINIO_ENDPOINT")
                .unwrap_or_else(|_| "localhost:9000".to_string()),
            minio_access_key: std::env::var("MINIO_ACCESS_KEY")
                .unwrap_or_else(|_| "devit".to_string()),
            minio_secret_key: std::env::var("MINIO_SECRET_KEY")
                .unwrap_or_else(|_| "devit_password".to_string()),
            // AlloyDB configurations for GCP
            alloydb_instance_id: std::env::var("ALLOYDB_INSTANCE_ID")
                .unwrap_or_else(|_| "devit-instance".to_string()),
            alloydb_cluster_id: std::env::var("ALLOYDB_CLUSTER_ID")
                .unwrap_or_else(|_| "devit-cluster".to_string()),
            alloydb_region: std::env::var("ALLOYDB_REGION")
                .unwrap_or_else(|_| "us-central1".to_string()),
            gcp_project_id: std::env::var("GCP_PROJECT_ID")
                .expect("GCP_PROJECT_ID must be set for AlloyDB"),
            use_cloud_sql_proxy: std::env::var("USE_CLOUD_SQL_PROXY")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
        }
    }

    // Helper method to construct AlloyDB connection string
    pub fn get_alloydb_connection_string(&self) -> String {
        if self.use_cloud_sql_proxy {
            // When using Cloud SQL Proxy (recommended for Cloud Run)
            format!(
                "postgresql://{}:{}@localhost:5432/{}",
                std::env::var("DB_USER").unwrap_or_else(|_| "devit".to_string()),
                std::env::var("DB_PASSWORD").expect("DB_PASSWORD must be set"),
                std::env::var("DB_NAME").unwrap_or_else(|_| "devit".to_string())
            )
        } else {
            // Direct connection to AlloyDB (requires proper network configuration)
            format!(
                "postgresql://{}:{}@{}/{}?sslmode=require",
                std::env::var("DB_USER").unwrap_or_else(|_| "devit".to_string()),
                std::env::var("DB_PASSWORD").expect("DB_PASSWORD must be set"),
                std::env::var("ALLOYDB_PRIVATE_IP").expect("ALLOYDB_PRIVATE_IP must be set for direct connection"),
                std::env::var("DB_NAME").unwrap_or_else(|_| "devit".to_string())
            )
        }
    }
}
