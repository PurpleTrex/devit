# PowerShell script to setup local PostgreSQL and generate SQLx cache
param(
    [string]$PostgresPassword = "devit_password"
)

Write-Host "Setting up local PostgreSQL for SQLx cache generation..."

# Check if Docker is available
try {
    docker --version | Out-Null
    $dockerAvailable = $true
} catch {
    $dockerAvailable = $false
}

if ($dockerAvailable) {
    Write-Host "Using Docker to set up temporary PostgreSQL..."
    
    # Stop any existing container
    docker stop devit-postgres-temp 2>$null
    docker rm devit-postgres-temp 2>$null
    
    # Start PostgreSQL container
    docker run -d --name devit-postgres-temp `
        -e POSTGRES_PASSWORD=$PostgresPassword `
        -e POSTGRES_USER=devit `
        -e POSTGRES_DB=devit `
        -p 5432:5432 `
        postgres:14
    
    Write-Host "Waiting for PostgreSQL to start..."
    Start-Sleep -Seconds 10
    
    # Set environment variable for SQLx
    $env:DATABASE_URL = "postgresql://devit:$PostgresPassword@localhost:5432/devit"
    
    # Run migrations
    Write-Host "Running database migrations..."
    sqlx migrate run
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migrations successful. Generating SQLx cache..."
        
        # Generate SQLx cache
        cargo sqlx prepare
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SQLx cache generated successfully!"
            Write-Host "You can now build with SQLX_OFFLINE=true"
            
            # Update .env file to enable offline mode
            $envContent = Get-Content .env -Raw
            $envContent = $envContent -replace "# SQLX_OFFLINE=true", "SQLX_OFFLINE=true"
            Set-Content .env $envContent
            
            Write-Host "✅ Updated .env file to enable SQLX_OFFLINE=true"
        } else {
            Write-Host "❌ Failed to generate SQLx cache"
        }
    } else {
        Write-Host "❌ Failed to run migrations"
    }
    
    # Clean up
    Write-Host "Cleaning up temporary PostgreSQL container..."
    docker stop devit-postgres-temp
    docker rm devit-postgres-temp
    
} else {
    Write-Host "❌ Docker not available. Please install Docker or use GCP AlloyDB connection."
    Write-Host "Alternative: Use the GCP connection method by copying .env.gcp to .env"
}
