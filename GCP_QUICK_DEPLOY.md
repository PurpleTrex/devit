# Quick GCP Deployment Guide

## Prerequisites
1. **Install Google Cloud CLI**: https://cloud.google.com/sdk/docs/install
2. **Install Docker**: https://docs.docker.com/get-docker/
3. **Authenticate**: `gcloud auth login`

## Option 1: Automated Deployment (Recommended)

### Windows (PowerShell)
```powershell
# Run the automated deployment script
.\deploy-gcp.ps1
```

### Linux/macOS (Bash)
```bash
# Make the script executable
chmod +x deploy-gcp.sh

# Run the automated deployment script
./deploy-gcp.sh
```

## Option 2: Manual Deployment

### 1. Set up GCP Project
```bash
# Set your project ID
export PROJECT_ID="devit-production"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sql-component.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Create Cloud SQL MySQL Instance
```bash
# Create MySQL instance (takes 5-10 minutes)
gcloud sql instances create devit-mysql \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB

# Create database and user
gcloud sql databases create devit --instance=devit-mysql
gcloud sql users create devit --instance=devit-mysql --password=YOUR_SECURE_PASSWORD
```

### 3. Set up Secrets
```bash
# Create JWT secret
echo -n "your-super-secure-jwt-secret-key-here" | gcloud secrets create jwt-secret --data-file=-

# Create database URL secret
echo -n "mysql://devit:YOUR_PASSWORD@localhost/devit?socket=/cloudsql/PROJECT_ID:us-central1:devit-mysql" | gcloud secrets create database-url --data-file=-
```

### 4. Build and Deploy Backend
```bash
# Configure Docker
gcloud auth configure-docker

# Build and push backend
cd backend
docker build -f Dockerfile.gcp -t gcr.io/$PROJECT_ID/devit-backend:latest .
docker push gcr.io/$PROJECT_ID/devit-backend:latest

# Deploy to Cloud Run
gcloud run deploy devit-backend \
  --image=gcr.io/$PROJECT_ID/devit-backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --add-cloudsql-instances=$PROJECT_ID:us-central1:devit-mysql \
  --set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest"
```

### 5. Initialize Database
```bash
# Get your backend URL
BACKEND_URL=$(gcloud run services describe devit-backend --region=us-central1 --format="value(status.url)")

# The database will be automatically initialized when the backend starts
# Check the logs to ensure everything is working
gcloud logs tail --follow --filter="resource.labels.service_name=devit-backend"
```

## Testing Your Deployment

### Health Check
```bash
# Get your backend URL
BACKEND_URL=$(gcloud run services describe devit-backend --region=us-central1 --format="value(status.url)")

# Test the health endpoint (if implemented)
curl $BACKEND_URL/health
```

### API Tests
```bash
# Test user registration
curl -X POST $BACKEND_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test user login
curl -X POST $BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## Environment Variables Reference

Your Cloud Run service needs these environment variables:
- `DATABASE_URL`: MySQL connection string (from Secret Manager)
- `JWT_SECRET`: JWT signing key (from Secret Manager)
- `RUST_LOG`: Log level (info, debug, warn, error)

## Monitoring and Logs

### View Logs
```bash
# Follow live logs
gcloud logs tail --follow --filter="resource.labels.service_name=devit-backend"

# View error logs only
gcloud logs tail --filter="resource.labels.service_name=devit-backend AND severity>=ERROR"
```

### View Metrics
```bash
# Open Cloud Console monitoring
gcloud console --project=$PROJECT_ID
```

## Database Management

### Connect to Database
```bash
# Connect via Cloud SQL Proxy
gcloud sql connect devit-mysql --user=devit
```

### Run Migrations
Your Rust application should automatically run migrations on startup. If you need to run them manually:

```sql
-- Create tables (these should be in your migrations folder)
-- See backend/migrations/ for the complete schema
```

## Scaling and Configuration

### Scale Backend
```bash
# Update Cloud Run service
gcloud run services update devit-backend \
  --region=us-central1 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=20 \
  --min-instances=1
```

### Update Environment Variables
```bash
# Update secrets
echo -n "new-secret-value" | gcloud secrets versions add jwt-secret --data-file=-

# Update service to use new secret version
gcloud run services update devit-backend \
  --region=us-central1 \
  --set-secrets="JWT_SECRET=jwt-secret:latest"
```

## Costs Estimate

With the free tier and minimal resources:
- Cloud Run: ~$0-5/month (free tier: 2 million requests)
- Cloud SQL (db-f1-micro): ~$7-15/month
- Container Registry: ~$0-2/month
- Secret Manager: ~$0-1/month

**Total: ~$8-23/month for a production-ready setup**

## Troubleshooting

### Common Issues

1. **Build failures**: Check Docker configuration and dependencies
2. **Database connection errors**: Verify Secret Manager secrets and Cloud SQL instance
3. **Authentication errors**: Check JWT secret configuration
4. **Cold starts**: Consider setting min-instances=1 for better performance

### Debug Commands
```bash
# Check service status
gcloud run services describe devit-backend --region=us-central1

# View recent logs
gcloud logs tail --limit=50 --filter="resource.labels.service_name=devit-backend"

# Test database connection
gcloud sql connect devit-mysql --user=devit

# List secrets
gcloud secrets list
```

## Next Steps

1. **Domain Setup**: Configure custom domain for your API
2. **SSL/TLS**: Cloud Run provides HTTPS automatically
3. **Frontend Deployment**: Deploy your frontend to Cloud Run or Firebase
4. **CI/CD**: Set up automated deployments with Cloud Build
5. **Monitoring**: Set up alerting and monitoring dashboards
6. **Backup**: Configure automated database backups

Your DevIT backend is now running on Google Cloud Platform! 🎉
