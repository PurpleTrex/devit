#!/bin/bash

# DevIT GCP Infrastructure Setup Script
# This script sets up the complete GCP infrastructure for DevIT

set -e

# Configuration
PROJECT_ID=${1:-"your-devit-project"}
REGION=${2:-"us-central1"}
DB_INSTANCE_NAME="devit-postgres"
DB_NAME="devit"
DB_USER="devit"
REDIS_INSTANCE_NAME="devit-redis"
BUCKET_NAME="${PROJECT_ID}-devit-storage"

echo "🚀 Setting up DevIT infrastructure on GCP"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Set project
echo "📋 Setting up GCP project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sql-component.googleapis.com \
    sqladmin.googleapis.com \
    redis.googleapis.com \
    storage.googleapis.com \
    secretmanager.googleapis.com \
    monitoring.googleapis.com \
    logging.googleapis.com \
    clouddns.googleapis.com

# Create Cloud SQL instance
echo "🗄️ Creating Cloud SQL PostgreSQL instance..."
gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=02:00 \
    --enable-bin-log \
    --deletion-protection

# Set database password
echo "🔐 Setting database password..."
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users set-password postgres \
    --instance=$DB_INSTANCE_NAME \
    --password=$DB_PASSWORD

# Create database user
echo "👤 Creating database user..."
gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE_NAME \
    --password=$DB_PASSWORD

# Create database
echo "📊 Creating database..."
gcloud sql databases create $DB_NAME \
    --instance=$DB_INSTANCE_NAME

# Create Redis instance
echo "🔄 Creating Redis instance..."
gcloud redis instances create $REDIS_INSTANCE_NAME \
    --size=1 \
    --region=$REGION \
    --redis-version=redis_6_x \
    --tier=basic

# Create Cloud Storage bucket
echo "🪣 Creating Cloud Storage bucket..."
gsutil mb -l $REGION gs://$BUCKET_NAME
gsutil versioning set on gs://$BUCKET_NAME

# Set bucket permissions
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Create secrets
echo "🔑 Creating secrets..."
echo -n "$DB_PASSWORD" | gcloud secrets create db-password --data-file=-
echo -n "$(openssl rand -base64 64)" | gcloud secrets create jwt-secret --data-file=-

# Create service account for Cloud Run
echo "🔐 Creating service account..."
gcloud iam service-accounts create devit-cloudrun \
    --display-name="DevIT Cloud Run Service Account"

# Grant necessary permissions
echo "🛡️ Setting up permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:devit-cloudrun@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:devit-cloudrun@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:devit-cloudrun@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/redis.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:devit-cloudrun@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Get Redis host
REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --format="value(host)")

# Create Cloud Build substitutions file
echo "📝 Creating build configuration..."
cat > cloudbuild-substitutions.yaml << EOF
substitutions:
  _REGION: '$REGION'
  _DB_INSTANCE_NAME: '$DB_INSTANCE_NAME'
  _DB_NAME: '$DB_NAME'
  _DB_PASSWORD: '$DB_PASSWORD'
  _REDIS_HOST: '$REDIS_HOST'
  _GCS_BUCKET_NAME: '$BUCKET_NAME'
EOF

echo ""
echo "✅ Infrastructure setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "------------------------"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Database Instance: $DB_INSTANCE_NAME"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Redis Instance: $REDIS_INSTANCE_NAME"
echo "Storage Bucket: $BUCKET_NAME"
echo ""
echo "🔐 Security Information:"
echo "Database Password: $DB_PASSWORD"
echo "Redis Host: $REDIS_HOST"
echo ""
echo "🚀 Next Steps:"
echo "1. Run: gcloud builds submit --config=cloudbuild.yaml"
echo "2. Configure your domain in Cloud DNS"
echo "3. Set up SSL certificate"
echo "4. Configure monitoring and alerts"
echo ""
echo "📚 Documentation: See GCP_DEPLOYMENT.md for detailed instructions"
