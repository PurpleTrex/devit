#!/bin/bash

# DevIT Frontend Deployment Script for GCP Cloud Run

set -e

PROJECT_ID=${1:-"your-devit-project"}
REGION=${2:-"us-central1"}
SERVICE_NAME="devit-frontend"

echo "🚀 Deploying DevIT Frontend to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Get backend URL
BACKEND_SERVICE_URL=$(gcloud run services describe devit-backend --region=$REGION --format="value(status.url)" --project=$PROJECT_ID 2>/dev/null || echo "")

if [ -z "$BACKEND_SERVICE_URL" ]; then
    echo "⚠️ Backend service not found. Deploy backend first with:"
    echo "   ./scripts/deploy-backend.sh $PROJECT_ID $REGION"
    exit 1
fi

# Build and submit to Cloud Build
echo "🔨 Building frontend image..."
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --project $PROJECT_ID \
    ./frontend

# Get database connection for frontend
DB_INSTANCE_NAME="devit-postgres"
DB_NAME="devit"
DB_USER="devit"
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password" --project=$PROJECT_ID)

DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE_NAME"

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --service-account devit-cloudrun@$PROJECT_ID.iam.gserviceaccount.com \
    --add-cloudsql-instances $PROJECT_ID:$REGION:$DB_INSTANCE_NAME \
    --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_SERVICE_URL" \
    --set-env-vars "NEXT_PUBLIC_APP_NAME=DevIT" \
    --set-env-vars "NEXT_PUBLIC_GCP_PROJECT_ID=$PROJECT_ID" \
    --set-env-vars "DATABASE_URL=$DATABASE_URL" \
    --set-env-vars "NODE_ENV=production" \
    --port 3000 \
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
echo "✅ Frontend deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo "🔗 Backend API: $BACKEND_SERVICE_URL"
echo ""
echo "📋 Service Configuration:"
echo "- Region: $REGION"
echo "- Connected to Backend API"
echo "- Connected to Database"
echo ""
echo "🔧 To view logs:"
echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit=50 --project=$PROJECT_ID"
echo ""
echo "🎉 DevIT is now live at: $SERVICE_URL"
