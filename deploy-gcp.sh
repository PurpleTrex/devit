#!/bin/bash

# DevIT GCP Deployment Script
# This script deploys your MySQL Rust backend to Google Cloud Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
PROJECT_ID="${PROJECT_ID:-devit-production}"
REGION="${REGION:-us-central1}"
DB_INSTANCE_NAME="${DB_INSTANCE_NAME:-devit-mysql}"
DB_NAME="${DB_NAME:-devit}"
DB_USER="${DB_USER:-devit}"

echo -e "${BLUE}🚀 DevIT GCP Deployment Script${NC}"
echo -e "${BLUE}================================${NC}"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}🔧 Setting up project: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${YELLOW}🔐 Please login to Google Cloud...${NC}"
    gcloud auth login
fi

# Enable required APIs
echo -e "${YELLOW}🔌 Enabling required APIs...${NC}"
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sql-component.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com

# Function to create secrets if they don't exist
create_secret_if_not_exists() {
    local secret_name=$1
    local secret_value=$2
    
    if ! gcloud secrets describe $secret_name &> /dev/null; then
        echo -e "${YELLOW}🔐 Creating secret: $secret_name${NC}"
        echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=-
    else
        echo -e "${GREEN}✅ Secret $secret_name already exists${NC}"
    fi
}

# Create JWT secret if not exists
if ! gcloud secrets describe jwt-secret &> /dev/null; then
    echo -e "${YELLOW}🔐 Creating JWT secret...${NC}"
    JWT_SECRET=$(openssl rand -base64 64)
    echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
    echo -e "${GREEN}✅ JWT secret created${NC}"
else
    echo -e "${GREEN}✅ JWT secret already exists${NC}"
fi

# Check if Cloud SQL instance exists
if ! gcloud sql instances describe $DB_INSTANCE_NAME &> /dev/null; then
    echo -e "${YELLOW}🗄️  Creating Cloud SQL MySQL instance...${NC}"
    echo -e "${YELLOW}⏳ This may take 5-10 minutes...${NC}"
    
    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create instance
    gcloud sql instances create $DB_INSTANCE_NAME \
      --database-version=MYSQL_8_0 \
      --tier=db-f1-micro \
      --region=$REGION \
      --storage-type=SSD \
      --storage-size=10GB \
      --storage-auto-increase \
      --backup-start-time=03:00 \
      --enable-bin-log \
      --maintenance-window-day=SUN \
      --maintenance-window-hour=04 \
      --deletion-protection
    
    # Create database
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
    
    # Create user
    gcloud sql users create $DB_USER \
      --instance=$DB_INSTANCE_NAME \
      --password=$DB_PASSWORD
    
    # Store secrets
    create_secret_if_not_exists "mysql-password" "$DB_PASSWORD"
    
    # Create database URL
    DATABASE_URL="mysql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME?socket=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE_NAME"
    create_secret_if_not_exists "database-url" "$DATABASE_URL"
    
    echo -e "${GREEN}✅ Cloud SQL instance created${NC}"
    echo -e "${YELLOW}💾 Database password stored in Secret Manager${NC}"
else
    echo -e "${GREEN}✅ Cloud SQL instance already exists${NC}"
fi

# Configure Docker for GCR
echo -e "${YELLOW}🐳 Configuring Docker...${NC}"
gcloud auth configure-docker --quiet

# Build and push backend image
echo -e "${YELLOW}🔨 Building backend image...${NC}"
cd backend
docker build -f Dockerfile.gcp -t gcr.io/$PROJECT_ID/devit-backend:latest .

echo -e "${YELLOW}📤 Pushing backend image...${NC}"
docker push gcr.io/$PROJECT_ID/devit-backend:latest

cd ..

# Deploy backend to Cloud Run
echo -e "${YELLOW}☁️  Deploying backend to Cloud Run...${NC}"
gcloud run deploy devit-backend \
  --image=gcr.io/$PROJECT_ID/devit-backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=0 \
  --concurrency=80 \
  --timeout=300 \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:$DB_INSTANCE_NAME \
  --set-env-vars="RUST_LOG=info" \
  --set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,MYSQL_PASSWORD=mysql-password:latest"

# Get backend URL
BACKEND_URL=$(gcloud run services describe devit-backend --region=$REGION --format="value(status.url)")

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo -e "${BLUE}📱 Backend URL: $BACKEND_URL${NC}"

# Test the deployment
echo -e "${YELLOW}🧪 Testing deployment...${NC}"
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check endpoint not responding (this might be normal if /health route isn't implemented)${NC}"
fi

# Display next steps
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "1. Test your API: ${BACKEND_URL}"
echo -e "2. View logs: ${YELLOW}gcloud logs tail --follow --filter=\"resource.labels.service_name=devit-backend\"${NC}"
echo -e "3. Connect to database: ${YELLOW}gcloud sql connect $DB_INSTANCE_NAME --user=$DB_USER${NC}"
echo -e "4. Update frontend with backend URL: ${BACKEND_URL}"
echo -e "${BLUE}================================${NC}"

# Optional: Deploy frontend if it exists
if [ -f "frontend/package.json" ]; then
    echo -e "${YELLOW}🌐 Frontend detected. Deploy frontend? (y/n)${NC}"
    read -r deploy_frontend
    
    if [ "$deploy_frontend" = "y" ] || [ "$deploy_frontend" = "Y" ]; then
        echo -e "${YELLOW}🔨 Building frontend image...${NC}"
        cd frontend
        docker build -f Dockerfile.gcp -t gcr.io/$PROJECT_ID/devit-frontend:latest .
        docker push gcr.io/$PROJECT_ID/devit-frontend:latest
        
        echo -e "${YELLOW}☁️  Deploying frontend to Cloud Run...${NC}"
        gcloud run deploy devit-frontend \
          --image=gcr.io/$PROJECT_ID/devit-frontend:latest \
          --region=$REGION \
          --platform=managed \
          --allow-unauthenticated \
          --port=3000 \
          --memory=512Mi \
          --cpu=1 \
          --max-instances=5 \
          --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL"
        
        FRONTEND_URL=$(gcloud run services describe devit-frontend --region=$REGION --format="value(status.url)")
        echo -e "${GREEN}✅ Frontend deployed: $FRONTEND_URL${NC}"
        cd ..
    fi
fi

echo -e "${GREEN}🎊 All done! Your DevIT application is now running on GCP!${NC}"
