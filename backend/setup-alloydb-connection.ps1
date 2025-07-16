# AlloyDB Connection Setup Script for Windows PowerShell

param(
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ClusterId = "devit-cluster",
    [string]$InstanceId = "devit-primary"
)

Write-Host "🔧 Setting up AlloyDB connection for DevIT..." -ForegroundColor Green

# Check if gcloud is installed
try {
    gcloud version | Out-Null
    Write-Host "✅ Google Cloud CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
$currentAccount = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
if (-not $currentAccount) {
    Write-Host "❌ Not authenticated with Google Cloud. Running authentication..." -ForegroundColor Red
    gcloud auth login
    gcloud auth application-default login
}

# Set project if provided
if ($ProjectId) {
    Write-Host "📝 Setting project to: $ProjectId" -ForegroundColor Blue
    gcloud config set project $ProjectId
} else {
    $ProjectId = gcloud config get-value project 2>$null
    if (-not $ProjectId) {
        Write-Host "❌ No project set. Please provide -ProjectId parameter" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🏗️ Current project: $ProjectId" -ForegroundColor Blue

# Enable required APIs
Write-Host "🔌 Enabling required APIs..." -ForegroundColor Blue
$apis = @(
    "alloydb.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "   Enabling $api..." -ForegroundColor Gray
    gcloud services enable $api --project=$ProjectId
}

# Get AlloyDB connection info
Write-Host "🔍 Getting AlloyDB connection information..." -ForegroundColor Blue
$alloydbInfo = gcloud alloydb instances describe $InstanceId --cluster=$ClusterId --region=$Region --project=$ProjectId --format="json" 2>$null | ConvertFrom-Json

if (-not $alloydbInfo) {
    Write-Host "❌ AlloyDB instance not found. Creating it..." -ForegroundColor Red
    Write-Host "📋 Please run the AlloyDB setup first." -ForegroundColor Yellow
    exit 1
}

$privateIp = $alloydbInfo.ipAddress
Write-Host "✅ AlloyDB Private IP: $privateIp" -ForegroundColor Green

# Download Cloud SQL Auth Proxy if not exists
$proxyPath = "./cloud-sql-proxy.exe"
if (-not (Test-Path $proxyPath)) {
    Write-Host "📥 Downloading Cloud SQL Auth Proxy..." -ForegroundColor Blue
    $proxyUrl = "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.7.0/cloud-sql-proxy.windows.amd64.exe"
    Invoke-WebRequest -Uri $proxyUrl -OutFile $proxyPath
    Write-Host "✅ Cloud SQL Auth Proxy downloaded" -ForegroundColor Green
}

# Create connection string
$connectionName = "${ProjectId}:${Region}:${ClusterId}:${InstanceId}"
$localPort = 5432

Write-Host "🔗 AlloyDB Connection Details:" -ForegroundColor Green
Write-Host "   Connection Name: $connectionName" -ForegroundColor White
Write-Host "   Private IP: $privateIp" -ForegroundColor White
Write-Host "   Local Port: $localPort" -ForegroundColor White

# Create .env.local with AlloyDB connection
$envContent = @"
# AlloyDB Development Connection
SQLX_OFFLINE=false

# AlloyDB Connection via Cloud SQL Proxy
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:$localPort/devit

# GCP Configuration
GCP_PROJECT_ID=$ProjectId
ALLOYDB_CLUSTER_ID=$ClusterId
ALLOYDB_INSTANCE_ID=$InstanceId
ALLOYDB_REGION=$Region
USE_CLOUD_SQL_PROXY=true

# Other settings
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=devit
MINIO_SECRET_KEY=devit_password
JWT_SECRET=your-super-secret-jwt-key-change-in-production
HOST=0.0.0.0
PORT=8080
RUST_LOG=debug
"@

Set-Content -Path ".env.local" -Value $envContent
Write-Host "✅ Created .env.local with AlloyDB connection settings" -ForegroundColor Green

# Create start script
$startScript = @"
# Start Cloud SQL Auth Proxy for AlloyDB
Write-Host "🚀 Starting Cloud SQL Auth Proxy for AlloyDB..." -ForegroundColor Green
Write-Host "🔗 Connecting to: $connectionName" -ForegroundColor Blue

# Start the proxy in background
Start-Process -FilePath "./cloud-sql-proxy.exe" -ArgumentList "$connectionName", "--port=$localPort" -WindowStyle Hidden

# Wait a moment for connection
Start-Sleep -Seconds 3

Write-Host "✅ Cloud SQL Auth Proxy started on localhost:$localPort" -ForegroundColor Green
Write-Host "💡 You can now connect to AlloyDB using:" -ForegroundColor Yellow
Write-Host "   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:$localPort/devit" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To start your Rust application:" -ForegroundColor Green
Write-Host "   Copy .env.local to .env" -ForegroundColor White
Write-Host "   Update the database password" -ForegroundColor White
Write-Host "   Run: cargo run" -ForegroundColor White
"@

Set-Content -Path "start-alloydb-proxy.ps1" -Value $startScript
Write-Host "✅ Created start-alloydb-proxy.ps1 script" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Copy .env.local to .env" -ForegroundColor White
Write-Host "2. Update DATABASE_URL with your AlloyDB password" -ForegroundColor White
Write-Host "3. Run: ./start-alloydb-proxy.ps1" -ForegroundColor White
Write-Host "4. Run: cargo run" -ForegroundColor White
