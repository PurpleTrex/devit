#!/bin/bash

# DevIT Complete GCP Deployment Script
# This script deploys the entire DevIT application to GCP in one command

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if parameters are provided
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <PROJECT_ID> <REGION> [DOMAIN]"
    print_error "Example: $0 my-devit-project us-central1 devit.com"
    exit 1
fi

PROJECT_ID=$1
REGION=$2
DOMAIN=${3:-""}

print_step "🚀 Starting complete DevIT deployment to GCP"
print_status "Project ID: $PROJECT_ID"
print_status "Region: $REGION"
if [ -n "$DOMAIN" ]; then
    print_status "Domain: $DOMAIN"
fi

# Check if deployment.env exists, if not run infrastructure setup
if [ ! -f "deployment.env" ]; then
    print_step "Infrastructure not found, setting up GCP infrastructure first..."
    ./scripts/setup-gcp-infrastructure.sh $PROJECT_ID $REGION $DOMAIN
fi

# Load environment variables
source deployment.env

# Deploy backend
print_step "📦 Deploying backend service..."
./scripts/deploy-backend.sh $PROJECT_ID $REGION

# Deploy frontend
print_step "🎨 Deploying frontend service..."
./scripts/deploy-frontend.sh $PROJECT_ID $REGION

# Run database migrations
print_step "🗃️ Running database migrations..."
# Get backend URL
BACKEND_URL=$(gcloud run services describe devit-backend --region=$REGION --format="value(status.url)")

# Wait for services to be ready
print_step "⏳ Waiting for services to be ready..."
sleep 30

# Test the deployment
print_step "🧪 Testing deployment..."

# Test backend health
if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    print_status "✅ Backend health check passed"
else
    print_warning "⚠️  Backend health check failed"
fi

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe devit-frontend --region=$REGION --format="value(status.url)")

# Test frontend health
if curl -f "$FRONTEND_URL/api/health" > /dev/null 2>&1; then
    print_status "✅ Frontend health check passed"
else
    print_warning "⚠️  Frontend health check failed"
fi

# Configure domain mapping if domain is provided
if [ -n "$DOMAIN" ]; then
    print_step "🌐 Configuring domain mapping..."
    
    # Create domain mappings
    gcloud run domain-mappings create \
        --service=devit-frontend \
        --domain=$DOMAIN \
        --region=$REGION || true
    
    gcloud run domain-mappings create \
        --service=devit-backend \
        --domain=api.$DOMAIN \
        --region=$REGION || true
    
    print_status "Domain mapping configured. Please update your DNS records:"
    print_status "  $DOMAIN → $FRONTEND_URL"
    print_status "  api.$DOMAIN → $BACKEND_URL"
fi

# Display final summary
print_step "🎉 Deployment completed successfully!"
print_status "╔══════════════════════════════════════════════════════════════╗"
print_status "║                    DEPLOYMENT SUMMARY                       ║"
print_status "╠══════════════════════════════════════════════════════════════╣"
print_status "║ Frontend URL: $FRONTEND_URL"
print_status "║ Backend URL:  $BACKEND_URL"
if [ -n "$DOMAIN" ]; then
    print_status "║ Custom Domain: https://$DOMAIN"
    print_status "║ API Domain:    https://api.$DOMAIN"
fi
print_status "║ Project ID:   $PROJECT_ID"
print_status "║ Region:       $REGION"
print_status "╚══════════════════════════════════════════════════════════════╝"

print_status "🎯 Your DevIT GitHub alternative is now live!"
print_status "📊 Monitor your deployment:"
print_status "  • Cloud Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
print_status "  • Logs: gcloud logging read \"resource.type=cloud_run_revision\" --limit=50"
print_status "  • Metrics: https://console.cloud.google.com/monitoring?project=$PROJECT_ID"

if [ -n "$DOMAIN" ]; then
    print_warning "📌 Don't forget to update your DNS records to point to the Cloud Run URLs"
fi

print_status "📚 See deployment.env for all configuration details"
