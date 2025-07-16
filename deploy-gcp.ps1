# DevIT GCP Deployment Script (PowerShell)
# This script deploys your MySQL Rust backend to Google Cloud Platform

param(
    [string]$ProjectId = "devit-466014",
    [string]$Region = "us-central1",
    [string]$DbInstanceName = "devit-mysql",
    [string]$DbName = "devit",
    [string]$DbUser = "devit"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "🚀 DevIT GCP Deployment Script" "Cyan"
Write-ColorOutput "================================" "Cyan"

# Set paths for tools
$GcloudPath = "C:\Users\meinr\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$env:PATH += ";C:\Program Files\Docker\Docker\resources\bin"

# Check prerequisites
Write-ColorOutput "📋 Checking prerequisites..." "Yellow"

try {
    & $GcloudPath version | Out-Null
} catch {
    Write-ColorOutput "❌ Google Cloud CLI not found. Please install it first." "Red"
    exit 1
}

try {
    docker version | Out-Null
} catch {
    Write-ColorOutput "❌ Docker not found. Please install it first." "Red"
    exit 1
}

# Set project
Write-ColorOutput "🔧 Setting up project: $ProjectId" "Yellow"
& $GcloudPath config set project $ProjectId

# Check if logged in
$activeAccount = & $GcloudPath auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $activeAccount -or $activeAccount -eq "") {
    Write-ColorOutput "🔐 Please login to Google Cloud..." "Yellow"
    & $GcloudPath auth login
}

# Enable required APIs
Write-ColorOutput "🔌 Enabling required APIs..." "Yellow"
& $GcloudPath services enable cloudbuild.googleapis.com run.googleapis.com sql-component.googleapis.com secretmanager.googleapis.com storage.googleapis.com

# Function to create secrets if they don't exist
function Create-SecretIfNotExists {
    param(
        [string]$SecretName,
        [string]$SecretValue
    )
    
    try {
        & $GcloudPath secrets describe $SecretName 2>$null | Out-Null
        Write-ColorOutput "✅ Secret $SecretName already exists" "Green"
    } catch {
        Write-ColorOutput "🔐 Creating secret: $SecretName" "Yellow"
        $SecretValue | & $GcloudPath secrets create $SecretName --data-file=-
    }
}

# Create JWT secret if not exists
try {
    & $GcloudPath secrets describe jwt-secret 2>$null | Out-Null
    Write-ColorOutput "✅ JWT secret already exists" "Green"
} catch {
    Write-ColorOutput "🔐 Creating JWT secret..." "Yellow"
    
    # Generate random base64 string for JWT secret
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $JwtSecret = [Convert]::ToBase64String($bytes)
    
    $JwtSecret | & $GcloudPath secrets create jwt-secret --data-file=-
    Write-ColorOutput "✅ JWT secret created" "Green"
}

# Check if Cloud SQL instance exists
try {
    & $GcloudPath sql instances describe $DbInstanceName 2>$null | Out-Null
    Write-ColorOutput "✅ Cloud SQL instance already exists" "Green"
} catch {
    Write-ColorOutput "🗄️  Creating Cloud SQL MySQL instance..." "Yellow"
    Write-ColorOutput "⏳ This may take 5-10 minutes..." "Yellow"
    
    # Generate random password
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $DbPassword = [Convert]::ToBase64String($bytes)
    
    # Create instance
    & $GcloudPath sql instances create $DbInstanceName `
        --database-version=MYSQL_8_0 `
        --tier=db-f1-micro `
        --region=$Region `
        --storage-type=SSD `
        --storage-size=10GB `
        --storage-auto-increase `
        --backup-start-time=03:00 `
        --enable-bin-log `
        --maintenance-window-day=SUN `
        --maintenance-window-hour=04 `
        --deletion-protection
    
    # Create database
    & $GcloudPath sql databases create $DbName --instance=$DbInstanceName
    
    # Create user
    & $GcloudPath sql users create $DbUser --instance=$DbInstanceName --password=$DbPassword
    
    # Store secrets
    Create-SecretIfNotExists "mysql-password" $DbPassword
    
    # Create database URL
    $DatabaseUrl = "mysql://$DbUser`:$DbPassword@localhost/$DbName`?socket=/cloudsql/$ProjectId`:$Region`:$DbInstanceName"
    Create-SecretIfNotExists "database-url" $DatabaseUrl
    
    Write-ColorOutput "✅ Cloud SQL instance created" "Green"
    Write-ColorOutput "💾 Database password stored in Secret Manager" "Yellow"
}

# Configure Docker for GCR
Write-ColorOutput "🐳 Configuring Docker..." "Yellow"
& $GcloudPath auth configure-docker --quiet

# Build and push backend image
Write-ColorOutput "🔨 Building backend image..." "Yellow"
Set-Location backend
docker build -f Dockerfile.gcp -t gcr.io/$ProjectId/devit-backend:latest .

Write-ColorOutput "📤 Pushing backend image..." "Yellow"
docker push gcr.io/$ProjectId/devit-backend:latest

Set-Location ..

# Deploy backend to Cloud Run
Write-ColorOutput "☁️  Deploying backend to Cloud Run..." "Yellow"
& $GcloudPath run deploy devit-backend `
    --image=gcr.io/$ProjectId/devit-backend:latest `
    --region=$Region `
    --platform=managed `
    --allow-unauthenticated `
    --port=8080 `
    --memory=1Gi `
    --cpu=1 `
    --max-instances=10 `
    --min-instances=0 `
    --concurrency=80 `
    --timeout=300 `
    --add-cloudsql-instances=$ProjectId`:$Region`:$DbInstanceName `
    --set-env-vars="RUST_LOG=info" `
    --set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,MYSQL_PASSWORD=mysql-password:latest"

# Get backend URL
$BackendUrl = & $GcloudPath run services describe devit-backend --region=$Region --format="value(status.url)"

Write-ColorOutput "✅ Backend deployed successfully!" "Green"
Write-ColorOutput "📱 Backend URL: $BackendUrl" "Cyan"

# Test the deployment
Write-ColorOutput "🧪 Testing deployment..." "Yellow"
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -Method GET -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-ColorOutput "✅ Health check passed!" "Green"
    }
} catch {
    Write-ColorOutput "⚠️  Health check endpoint not responding (this might be normal if /health route isn't implemented)" "Yellow"
}

# Display next steps
Write-ColorOutput "🎉 Deployment completed successfully!" "Green"
Write-ColorOutput "================================" "Cyan"
Write-ColorOutput "📋 Next Steps:" "Cyan"
Write-ColorOutput "1. Test your API: $BackendUrl" "White"
Write-ColorOutput "2. View logs: gcloud logs tail --follow --filter=`"resource.labels.service_name=devit-backend`"" "Yellow"
Write-ColorOutput "3. Connect to database: gcloud sql connect $DbInstanceName --user=$DbUser" "Yellow"
Write-ColorOutput "4. Update frontend with backend URL: $BackendUrl" "White"
Write-ColorOutput "================================" "Cyan"

# Optional: Deploy frontend if it exists
if (Test-Path "frontend/package.json") {
    $deployFrontend = Read-Host "🌐 Frontend detected. Deploy frontend? (y/n)"
    
    if ($deployFrontend -eq "y" -or $deployFrontend -eq "Y") {
        Write-ColorOutput "🔨 Building frontend image..." "Yellow"
        Set-Location frontend
        docker build -f Dockerfile.gcp -t gcr.io/$ProjectId/devit-frontend:latest .
        docker push gcr.io/$ProjectId/devit-frontend:latest
        
        Write-ColorOutput "☁️  Deploying frontend to Cloud Run..." "Yellow"
        gcloud run deploy devit-frontend `
            --image=gcr.io/$ProjectId/devit-frontend:latest `
            --region=$Region `
            --platform=managed `
            --allow-unauthenticated `
            --port=3000 `
            --memory=512Mi `
            --cpu=1 `
            --max-instances=5 `
            --set-env-vars="NEXT_PUBLIC_API_URL=$BackendUrl"
        
        $FrontendUrl = gcloud run services describe devit-frontend --region=$Region --format="value(status.url)"
        Write-ColorOutput "✅ Frontend deployed: $FrontendUrl" "Green"
        Set-Location ..
    }
}

Write-ColorOutput "🎊 All done! Your DevIT application is now running on GCP!" "Green"
