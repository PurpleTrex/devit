use sqlx::MySqlPool;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Test MySQL connection
    let database_url = "mysql://devit:Friezavegeta9%40@localhost:3306/devit";
    
    println!("Connecting to MySQL...");
    let pool = MySqlPool::connect(database_url).await?;
    
    println!("Connection successful!");
    
    // Test a simple query
    let result = sqlx::query!("SELECT COUNT(*) as count FROM users")
        .fetch_one(&pool)
        .await?;
    
    println!("Users table has {} rows", result.count);
    
    // Test creating a user
    let user_id = format!("user_test_{}", chrono::Utc::now().timestamp());
    
    sqlx::query!(
        "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)",
        user_id,
        "testuser",
        "test@example.com", 
        "dummy_hash"
    )
    .execute(&pool)
    .await?;
    
    println!("Test user created successfully!");
    
    // Clean up test user
    sqlx::query!("DELETE FROM users WHERE id = ?", user_id)
        .execute(&pool)
        .await?;
    
    println!("Test user cleaned up. MySQL setup is working!");
    
    Ok(())
}
