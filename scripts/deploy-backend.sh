#!/bin/bash

# DevIT Backend Deployment Script for GCP Cloud Run

set -e

PROJECT_ID=${1:-"your-devit-project"}
REGION=${2:-"us-central1"}
SERVICE_NAME="devit-backend"

echo "🚀 Deploying DevIT Backend to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Build and submit to Cloud Build
echo "🔨 Building backend image..."
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --project $PROJECT_ID \
    ./backend

# Get database connection string
DB_INSTANCE_NAME="devit-postgres"
DB_NAME="devit"
DB_USER="devit"
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password" --project=$PROJECT_ID)
JWT_SECRET=$(gcloud secrets versions access latest --secret="jwt-secret" --project=$PROJECT_ID)

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE_NAME"

# Get Redis connection
REDIS_INSTANCE_NAME="devit-redis"
REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --format="value(host)" --project=$PROJECT_ID)
REDIS_URL="redis://$REDIS_HOST:6379"

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --service-account devit-cloudrun@$PROJECT_ID.iam.gserviceaccount.com \
    --add-cloudsql-instances $PROJECT_ID:$REGION:$DB_INSTANCE_NAME \
    --set-env-vars "DATABASE_URL=$DATABASE_URL" \
    --set-env-vars "JWT_SECRET=$JWT_SECRET" \
    --set-env-vars "REDIS_URL=$REDIS_URL" \
    --set-env-vars "GCS_BUCKET_NAME=$PROJECT_ID-devit-storage" \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
    --set-env-vars "RUST_LOG=info" \
    --set-env-vars "HOST=0.0.0.0" \
    --set-env-vars "PORT=8080" \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80 \
    --project $PROJECT_ID

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" --project=$PROJECT_ID)

echo ""
echo "✅ Backend deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo "🔍 Health Check: $SERVICE_URL/health"
echo ""
echo "📋 Service Configuration:"
echo "- Region: $REGION"
echo "- Database: Connected to Cloud SQL"
echo "- Redis: Connected to Memorystore"
echo "- Storage: Connected to Cloud Storage"
echo ""
echo "🔧 To view logs:"
echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit=50 --project=$PROJECT_ID"
