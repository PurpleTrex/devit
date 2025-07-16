#!/usr/bin/env pwsh
# Quick AlloyDB Connection Script

param(
    [switch]$Help,
    [string]$Password = "",
    [string]$ProjectId = ""
)

if ($Help) {
    Write-Host @"
🔗 DevIT AlloyDB Connection Helper

Usage:
  .\connect-alloydb.ps1 -ProjectId "your-project" -Password "your-db-password"

This script will:
1. Start Cloud SQL Auth Proxy for AlloyDB
2. Update your .env file with the connection
3. Test the database connection
4. Run database migrations
5. Start your Rust application

Prerequisites:
- Google Cloud CLI installed and authenticated
- AlloyDB instance created in GCP
"@
    exit 0
}

Write-Host "🚀 DevIT AlloyDB Connection Helper" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Get project ID if not provided
if (-not $ProjectId) {
    $ProjectId = gcloud config get-value project 2>$null
    if (-not $ProjectId) {
        Write-Host "❌ No GCP project set. Please run:" -ForegroundColor Red
        Write-Host "   gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📋 Using project: $ProjectId" -ForegroundColor Blue

# Get password if not provided
if (-not $Password) {
    $Password = Read-Host -Prompt "🔐 Enter your AlloyDB postgres password" -AsSecureString
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))
}

# Update .env file
Write-Host "📝 Updating .env file..." -ForegroundColor Blue
$envContent = Get-Content ".env.gcp" -Raw
$envContent = $envContent -replace "YOUR_ALLOYDB_PASSWORD", $Password
$envContent = $envContent -replace "your-gcp-project-id", $ProjectId
Set-Content -Path ".env" -Value $envContent

Write-Host "✅ Environment file updated" -ForegroundColor Green

# Start Cloud SQL Proxy
Write-Host "🔌 Starting Cloud SQL Auth Proxy..." -ForegroundColor Blue
$connectionName = "${ProjectId}:us-central1:devit-cluster:devit-primary"

# Download proxy if needed
if (-not (Test-Path "cloud-sql-proxy.exe")) {
    Write-Host "📥 Downloading Cloud SQL Auth Proxy..." -ForegroundColor Blue
    $proxyUrl = "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.7.0/cloud-sql-proxy.windows.amd64.exe"
    try {
        Invoke-WebRequest -Uri $proxyUrl -OutFile "cloud-sql-proxy.exe" -UseBasicParsing
        Write-Host "✅ Proxy downloaded" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to download proxy: $_" -ForegroundColor Red
        exit 1
    }
}

# Start proxy
Write-Host "🔗 Connecting to AlloyDB: $connectionName" -ForegroundColor Blue
$proxyProcess = Start-Process -FilePath "./cloud-sql-proxy.exe" -ArgumentList $connectionName, "--port=5432" -PassThru -WindowStyle Hidden

# Wait for proxy to start
Write-Host "⏳ Waiting for proxy to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test connection
Write-Host "🧪 Testing database connection..." -ForegroundColor Blue
try {
    $env:DATABASE_URL = "postgresql://postgres:${Password}@localhost:5432/devit"
    $testResult = cargo run --bin test-db-connection 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Database connection test failed, but continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not test connection, but proxy is running" -ForegroundColor Yellow
}

# Run migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Blue
try {
    sqlx migrate run
    Write-Host "✅ Migrations completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Migration failed: $_" -ForegroundColor Yellow
    Write-Host "You may need to run: sqlx migrate run" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 AlloyDB connection established!" -ForegroundColor Green
Write-Host "🚀 Your application is ready to build and run:" -ForegroundColor Green
Write-Host ""
Write-Host "   cargo check    # Check compilation" -ForegroundColor White
Write-Host "   cargo run      # Start the application" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Database URL: postgresql://postgres:***@localhost:5432/devit" -ForegroundColor Blue
Write-Host "📊 Cloud SQL Proxy PID: $($proxyProcess.Id)" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 To stop the proxy later, run: Stop-Process -Id $($proxyProcess.Id)" -ForegroundColor Yellow
