# DevIT MySQL GCP Deployment Guide 🚀

## 📋 Overview

Complete guide to deploy your converted MySQL Rust backend to Google Cloud Platform with production-ready setup.

## 🛠️ Prerequisites

### Required Tools
```bash
# Install Google Cloud CLI
# Windows: Download from https://cloud.google.com/sdk/docs/install
# macOS: brew install google-cloud-sdk
# Linux: Follow official docs

# Install Docker
# Download from https://docs.docker.com/get-docker/

# Verify installations
gcloud --version
docker --version
```

### GCP Setup
```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Set your project (replace with your project ID)
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# 3. Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sql-component.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  redis.googleapis.com

# 4. Application Default Credentials
gcloud auth application-default login
```

## 🗄️ Phase 1: Cloud SQL MySQL Setup

### Create MySQL Instance
```bash
# Set variables
export REGION="us-central1"
export DB_INSTANCE_NAME="devit-mysql"
export DB_NAME="devit"
export DB_USER="devit"
export DB_PASSWORD="$(openssl rand -base64 32)"

# Create Cloud SQL MySQL instance
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

# Create database and user
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME

gcloud sql users create $DB_USER \
  --instance=$DB_INSTANCE_NAME \
  --password=$DB_PASSWORD

# Save the password securely
echo "Database password: $DB_PASSWORD"
echo "Save this password - you'll need it for environment variables"
```

### Store Database Credentials in Secret Manager
```bash
# Create secrets
echo -n "$DB_PASSWORD" | gcloud secrets create mysql-password --data-file=-
echo -n "mysql://$DB_USER:$DB_PASSWORD@/$DB_NAME?socket=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE_NAME" | gcloud secrets create database-url --data-file=-

# Create JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
```

## 🐳 Phase 2: Container Setup

### Build and Push Images
```bash
# Set up Container Registry
gcloud auth configure-docker

# Build backend image
cd backend
docker build -f Dockerfile.gcp -t gcr.io/$PROJECT_ID/devit-backend:latest .

# Push to registry
docker push gcr.io/$PROJECT_ID/devit-backend:latest

# Build frontend image (if needed)
cd ../frontend
docker build -f Dockerfile.gcp -t gcr.io/$PROJECT_ID/devit-frontend:latest .
docker push gcr.io/$PROJECT_ID/devit-frontend:latest
```

## ☁️ Phase 3: Cloud Run Deployment

### Deploy Backend Service
```bash
# Deploy backend with Cloud SQL connection
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

# Get the backend URL
BACKEND_URL=$(gcloud run services describe devit-backend --region=$REGION --format="value(status.url)")
echo "Backend URL: $BACKEND_URL"
```

### Deploy Frontend Service
```bash
# Deploy frontend
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

# Get the frontend URL
FRONTEND_URL=$(gcloud run services describe devit-frontend --region=$REGION --format="value(status.url)")
echo "Frontend URL: $FRONTEND_URL"
```

## 🔄 Phase 4: Database Migration

### Run Migrations
```bash
# Connect to Cloud SQL and run migrations
gcloud sql connect $DB_INSTANCE_NAME --user=$DB_USER

# In MySQL shell, create tables:
```

```sql
USE devit;

-- Users table
CREATE TABLE users (
    id VARCHAR(30) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    website_url VARCHAR(255),
    location VARCHAR(100),
    company VARCHAR(100),
    is_admin TINYINT(1) DEFAULT 0,
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Repositories table  
CREATE TABLE repositories (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_private TINYINT(1) DEFAULT 0,
    is_fork TINYINT(1) DEFAULT 0,
    is_archived TINYINT(1) DEFAULT 0,
    owner_id VARCHAR(30) NOT NULL,
    organization_id VARCHAR(30),
    default_branch VARCHAR(100) DEFAULT 'main',
    language VARCHAR(50),
    star_count INT DEFAULT 0,
    fork_count INT DEFAULT 0,
    watch_count INT DEFAULT 0,
    size BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    pushed_at TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_repo_per_owner (owner_id, name)
);

-- Issues table
CREATE TABLE issues (
    id VARCHAR(30) PRIMARY KEY,
    number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    status ENUM('open', 'closed') DEFAULT 'open',
    author_id VARCHAR(30) NOT NULL,
    assignee_id VARCHAR(30),
    repository_id VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_issue_per_repo (repository_id, number)
);

-- Pull Requests table
CREATE TABLE pull_requests (
    id VARCHAR(30) PRIMARY KEY,
    number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    status ENUM('open', 'closed', 'merged') DEFAULT 'open',
    author_id VARCHAR(30) NOT NULL,
    repository_id VARCHAR(30) NOT NULL,
    base_branch VARCHAR(100) NOT NULL,
    head_branch VARCHAR(100) NOT NULL,
    is_merged TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    merged_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_pr_per_repo (repository_id, number)
);

-- Stars table
CREATE TABLE stars (
    user_id VARCHAR(30),
    repository_id VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, repository_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
);

-- Follows table
CREATE TABLE follows (
    follower_id VARCHAR(30),
    following_id VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_issues_repository_status ON issues(repository_id, status);
CREATE INDEX idx_issues_author ON issues(author_id);
CREATE INDEX idx_prs_repository_status ON pull_requests(repository_id, status);
CREATE INDEX idx_prs_author ON pull_requests(author_id);
CREATE INDEX idx_repos_owner ON repositories(owner_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

## 🔧 Phase 5: Environment Configuration

### Update Backend Configuration
Create a production config for your Rust backend:

```bash
# Create config directory in your backend
mkdir -p backend/config
```

## 🔄 Phase 6: CI/CD Setup

### Cloud Build Configuration
Your `cloudbuild.yaml` needs updating for MySQL. Here's the enhanced version:

```yaml
# Enhanced cloudbuild.yaml for MySQL backend
steps:
  # Build Backend for MySQL
  - name: 'gcr.io/cloud-builders/docker'
    args: 
      - 'build'
      - '-f'
      - 'backend/Dockerfile.gcp'
      - '-t'
      - 'gcr.io/${PROJECT_ID}/devit-backend:${BUILD_ID}'
      - '-t'
      - 'gcr.io/${PROJECT_ID}/devit-backend:latest'
      - '.'
    
  # Build Frontend
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'frontend/Dockerfile.gcp'
      - '-t'
      - 'gcr.io/${PROJECT_ID}/devit-frontend:${BUILD_ID}'
      - '-t'
      - 'gcr.io/${PROJECT_ID}/devit-frontend:latest'
      - '.'

  # Push Images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/${PROJECT_ID}/devit-backend:${BUILD_ID}']
    
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/${PROJECT_ID}/devit-frontend:${BUILD_ID}']

  # Deploy Backend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'devit-backend'
      - '--image=gcr.io/${PROJECT_ID}/devit-backend:${BUILD_ID}'
      - '--region=${_REGION}'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--add-cloudsql-instances=${PROJECT_ID}:${_REGION}:${_DB_INSTANCE}'
      - '--set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest'

  # Deploy Frontend  
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'devit-frontend'
      - '--image=gcr.io/${PROJECT_ID}/devit-frontend:${BUILD_ID}'
      - '--region=${_REGION}'
      - '--platform=managed'
      - '--allow-unauthenticated'

substitutions:
  _REGION: 'us-central1'
  _DB_INSTANCE: 'devit-mysql'

options:
  machineType: 'E2_HIGHCPU_8'
  timeout: '1200s'
```

## 🌐 Phase 7: Domain & SSL Setup

```bash
# Reserve static IP
gcloud compute addresses create devit-ip --global

# Get the IP address
gcloud compute addresses describe devit-ip --global --format="value(address)"

# Set up custom domain (optional)
# 1. Point your domain to the static IP
# 2. Create SSL certificate
# 3. Set up load balancer
```

## 📊 Phase 8: Monitoring & Logging

```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# View logs
gcloud logs tail --follow

# View backend logs specifically
gcloud logs tail --follow --filter="resource.labels.service_name=devit-backend"
```

## 🧪 Phase 9: Testing

```bash
# Test backend health
curl $BACKEND_URL/health

# Test user registration
curl -X POST $BACKEND_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123","full_name":"Test User"}'

# Test frontend
open $FRONTEND_URL
```

## 💰 Cost Optimization

### Free Tier Limits
- Cloud Run: 2 million requests/month
- Cloud SQL: db-f1-micro instance
- Secret Manager: 6 active secrets
- Cloud Build: 120 build minutes/day

### Production Scaling
```bash
# Scale up for production
gcloud run services update devit-backend \
  --region=$REGION \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=50 \
  --min-instances=2

# Upgrade database
gcloud sql instances patch $DB_INSTANCE_NAME \
  --tier=db-n1-standard-1
```

## 🔒 Security Best Practices

1. **Never hardcode secrets** - Use Secret Manager
2. **Enable VPC** - For production environments
3. **Set up IAM** - Principle of least privilege
4. **Enable audit logs** - Track all activities
5. **Regular backups** - Automated daily backups
6. **SSL/TLS** - HTTPS everywhere

## 🚀 Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
set -e

# Configuration
PROJECT_ID="your-project-id"
REGION="us-central1"

echo "🚀 Deploying DevIT to GCP..."

# Build and push
docker build -f backend/Dockerfile.gcp -t gcr.io/$PROJECT_ID/devit-backend:latest .
docker push gcr.io/$PROJECT_ID/devit-backend:latest

# Deploy
gcloud run deploy devit-backend \
  --image=gcr.io/$PROJECT_ID/devit-backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated

echo "✅ Deployment complete!"
```

## 📞 Support

If you encounter issues:
1. Check Cloud Run logs: `gcloud logs tail --follow`
2. Verify Secret Manager access
3. Test database connectivity
4. Check IAM permissions

## 🎉 Next Steps

Once deployed:
1. Set up custom domain
2. Configure CI/CD triggers
3. Add monitoring alerts
4. Implement caching with Redis
5. Set up CDN for static assets

Your MySQL Rust backend is now ready for production on GCP! 🚀
