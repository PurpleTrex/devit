param(
    [string]$ProjectId = "devit-466014",
    [string]$Password = ""
)

Write-Host "Connecting to AlloyDB..." -ForegroundColor Green

# Get password if not provided
if (-not $Password) {
    $securePassword = Read-Host -Prompt "Enter your AlloyDB postgres password" -AsSecureString
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
}

# Update .env file
Write-Host "Updating .env file..." -ForegroundColor Blue

$envContent = "# GCP AlloyDB Configuration
SQLX_OFFLINE=false
DATABASE_URL=postgresql://postgres:$Password@localhost:5432/devit
GCP_PROJECT_ID=$ProjectId
ALLOYDB_CLUSTER_ID=devit-cluster
ALLOYDB_INSTANCE_ID=devit-primary
ALLOYDB_REGION=us-central1
USE_CLOUD_SQL_PROXY=true
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=devit
MINIO_SECRET_KEY=devit_password
JWT_SECRET=your-super-secret-jwt-key-change-in-production
HOST=0.0.0.0
PORT=8080
RUST_LOG=debug"

Set-Content -Path ".env" -Value $envContent
Write-Host "Environment file updated" -ForegroundColor Green

# Download proxy if needed
if (-not (Test-Path "cloud-sql-proxy.exe")) {
    Write-Host "Downloading Cloud SQL Auth Proxy..." -ForegroundColor Blue
    $proxyUrl = "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.2/cloud-sql-proxy.windows.amd64.exe"
    try {
        Invoke-WebRequest -Uri $proxyUrl -OutFile "cloud-sql-proxy.exe" -UseBasicParsing
        Write-Host "Proxy downloaded" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download proxy. Trying alternative..." -ForegroundColor Yellow
        $altUrl = "https://github.com/GoogleCloudPlatform/cloud-sql-proxy/releases/download/v2.8.2/cloud-sql-proxy.windows.amd64.exe"
        Invoke-WebRequest -Uri $altUrl -OutFile "cloud-sql-proxy.exe" -UseBasicParsing
        Write-Host "Proxy downloaded from GitHub" -ForegroundColor Green
    }
}

# Start proxy
$connectionName = "$ProjectId`:us-central1:devit-cluster:devit-primary"
Write-Host "Starting proxy for: $connectionName" -ForegroundColor Blue

Start-Process -FilePath "./cloud-sql-proxy.exe" -ArgumentList $connectionName, "--port=5432" -WindowStyle Minimized

Write-Host "Waiting for proxy to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "Ready! You can now run:" -ForegroundColor Green
Write-Host "   cargo check" -ForegroundColor White
Write-Host "   cargo run" -ForegroundColor White
