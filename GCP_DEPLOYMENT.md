# DevIT GCP Deployment Guide

## 🚀 Complete GCP Implementation

This guide provides step-by-step instructions for deploying DevIT (GitHub alternative) to Google Cloud Platform with full production setup.

## 📋 Prerequisites

### Required Tools
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Docker](https://docs.docker.com/get-docker/)
- [Git](https://git-scm.com/downloads)
- Bash shell (Windows users: use Git Bash or WSL)

### GCP Account Setup
1. **Create GCP Account**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Enable Billing**: Required for Cloud Run, Cloud SQL, etc.
3. **Create Project**: Or use existing project
4. **Install gcloud CLI**: Follow [installation guide](https://cloud.google.com/sdk/docs/install)

### Authentication
```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable Application Default Credentials
gcloud auth application-default login
```

## 🏗️ Architecture Overview

### GCP Services Used
- **Cloud Run**: Containerized applications (Frontend + Backend)
- **Cloud SQL**: PostgreSQL database
- **Cloud Memorystore**: Redis cache
- **Cloud Storage**: File storage and assets
- **Cloud Build**: CI/CD pipeline
- **Cloud DNS**: Domain management
- **Cloud Monitoring**: Logging and metrics
- **Secret Manager**: Secure credential storage
- **Cloud Load Balancing**: SSL termination and routing

### Architecture Diagram
```
Internet → Cloud Load Balancer → Cloud Run (Frontend)
                                     ↓
                               Cloud Run (Backend)
                                     ↓
                         Cloud SQL (PostgreSQL)
                                     ↓
                        Cloud Memorystore (Redis)
                                     ↓
                        Cloud Storage (Files)
```

## � Deployment Options

### Option 1: One-Click Deployment (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd DevIT

# Make scripts executable
npm run gcp:setup

# Deploy everything with one command
./scripts/deploy-complete.sh YOUR_PROJECT_ID us-central1 your-domain.com
```

### Option 2: Step-by-Step Deployment

#### Step 1: Infrastructure Setup
```bash
./scripts/setup-gcp-infrastructure.sh YOUR_PROJECT_ID us-central1
```

#### Step 2: Deploy Backend
```bash
./scripts/deploy-backend.sh YOUR_PROJECT_ID us-central1
```

#### Step 3: Deploy Frontend
```bash
./scripts/deploy-frontend.sh YOUR_PROJECT_ID us-central1
```

### Option 3: Manual Cloud Build
```bash
# Submit build using Cloud Build
gcloud builds submit --config=cloudbuild.yaml
```

## 🔧 Configuration

### Environment Variables

#### Backend Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@/devit?host=/cloudsql/PROJECT:REGION:INSTANCE
JWT_SECRET=your-super-secret-jwt-key
REDIS_URL=redis://REDIS_HOST:6379
GCS_BUCKET_NAME=project-devit-storage
GOOGLE_CLOUD_PROJECT=your-project-id
RUST_LOG=info
HOST=0.0.0.0
PORT=8080
```

#### Frontend Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://devit-backend-region-project.a.run.app
NEXT_PUBLIC_APP_NAME=DevIT
NEXT_PUBLIC_GCP_PROJECT_ID=your-project-id
DATABASE_URL=postgresql://user:pass@/devit?host=/cloudsql/PROJECT:REGION:INSTANCE
NODE_ENV=production
```

### Custom Domain Setup

#### 1. Purchase Domain
Use any domain registrar (Google Domains, Namecheap, etc.)

#### 2. Configure DNS
Point your domain to Cloud Run:
```bash
# Get Cloud Run URLs
gcloud run services describe devit-frontend --region=us-central1 --format="value(status.url)"
gcloud run services describe devit-backend --region=us-central1 --format="value(status.url)"

# Configure DNS records:
# A record: your-domain.com → Cloud Run IP
# CNAME: www.your-domain.com → your-domain.com
# CNAME: api.your-domain.com → backend-url
```

#### 3. SSL Certificate
```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create devit-ssl-cert \
    --domains=your-domain.com,www.your-domain.com,api.your-domain.com \
    --global

# Create domain mappings
gcloud run domain-mappings create --service=devit-frontend --domain=your-domain.com --region=us-central1
gcloud run domain-mappings create --service=devit-backend --domain=api.your-domain.com --region=us-central1
```

## 💰 Cost Estimation

### Development Environment (Low Traffic)
| Service | Monthly Cost |
|---------|--------------|
| Cloud Run (2 services) | $5-15 |
| Cloud SQL (db-f1-micro) | $25-35 |
| Cloud Storage (10GB) | $2-5 |
| Cloud Memorystore (1GB) | $15-25 |
| Cloud Build (100 builds) | $5-10 |
| **Total** | **$52-90** |

### Production Environment (Medium Traffic)
| Service | Monthly Cost |
|---------|--------------|
| Cloud Run (2 services) | $50-150 |
| Cloud SQL (db-n1-standard-2) | $100-200 |
| Cloud Storage (100GB) | $20-30 |
| Cloud Memorystore (5GB) | $75-100 |
| Cloud Load Balancer | $20-30 |
| Cloud Build (500 builds) | $25-40 |
| **Total** | **$290-550** |

## � Monitoring & Maintenance

### Health Checks
```bash
# Check frontend health
curl https://your-domain.com/api/health

# Check backend health
curl https://api.your-domain.com/health
```

### Viewing Logs
```bash
# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=devit-frontend" --limit=50

# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=devit-backend" --limit=50

# Database logs
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=YOUR_INSTANCE_ID" --limit=50
```

### Scaling Configuration
```bash
# Update Cloud Run scaling
gcloud run services update devit-backend \
    --min-instances=1 \
    --max-instances=20 \
    --concurrency=100 \
    --region=us-central1

gcloud run services update devit-frontend \
    --min-instances=1 \
    --max-instances=10 \
    --concurrency=80 \
    --region=us-central1
```

### Database Backup
```bash
# Create backup
gcloud sql backups create --instance=devit-postgres

# List backups
gcloud sql backups list --instance=devit-postgres

# Restore from backup
gcloud sql backups restore BACKUP_ID --restore-instance=devit-postgres
```

## 🔒 Security Best Practices

### 1. IAM and Service Accounts
- ✅ Created dedicated service account for Cloud Run
- ✅ Minimal permissions (Cloud SQL Client, Storage Object Admin)
- ✅ No service account keys (using default credentials)

### 2. Network Security
- ✅ Private IP for Cloud SQL
- ✅ Cloud Run with ingress controls
- ✅ HTTPS enforced with managed SSL certificates

### 3. Data Protection
- ✅ Encrypted database with Cloud SQL
- ✅ Encrypted storage with Cloud Storage
- ✅ Secrets stored in Secret Manager

### 4. Additional Security Steps
```bash
# Enable Binary Authorization (optional)
gcloud container binauthz policy import policy.yaml

# Set up VPC firewall rules
gcloud compute firewall-rules create allow-cloud-run \
    --allow tcp:8080,tcp:3000 \
    --source-ranges 0.0.0.0/0

# Enable audit logging
gcloud logging sinks create devit-audit-sink \
    bigquery.googleapis.com/projects/PROJECT_ID/datasets/audit_logs
```

## � Troubleshooting

### Common Issues

#### 1. "Cloud SQL connection failed"
```bash
# Check Cloud SQL instance status
gcloud sql instances describe devit-postgres

# Verify Cloud Run has Cloud SQL IAM permissions
gcloud projects get-iam-policy PROJECT_ID

# Test connection from Cloud Shell
gcloud sql connect devit-postgres --user=devit
```

#### 2. "Backend service unavailable"
```bash
# Check Cloud Run service status
gcloud run services describe devit-backend --region=us-central1

# View recent logs
gcloud logging read "resource.type=cloud_run_revision" --limit=20

# Check service configuration
gcloud run services describe devit-backend --region=us-central1 --format=export
```

#### 3. "Build failed in Cloud Build"
```bash
# Check build history
gcloud builds list --limit=10

# View specific build logs
gcloud builds log BUILD_ID

# Check Docker file syntax
docker build -f backend/Dockerfile.gcp backend/
```

#### 4. "Domain mapping not working"
```bash
# Check domain mapping status
gcloud run domain-mappings describe --domain=your-domain.com --region=us-central1

# Verify DNS configuration
dig your-domain.com
nslookup your-domain.com

# Check SSL certificate status
gcloud compute ssl-certificates describe devit-ssl-cert
```

## � Support & Resources

### GCP Documentation
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)

### DevIT Support
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See `docs/` folder
- Community: Discord/Slack (links in main README)

### Cost Optimization
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [Cost Management Best Practices](https://cloud.google.com/docs/enterprise/best-practices-for-enterprise-organizations)

## 🎉 Success Checklist

After deployment, verify these items work:

- [ ] Frontend loads at your domain
- [ ] Backend health check responds
- [ ] User registration works
- [ ] User login works
- [ ] Repository creation works
- [ ] File upload works
- [ ] Database queries work
- [ ] Redis caching works
- [ ] SSL certificate is valid
- [ ] Monitoring is active
- [ ] Backups are configured

## 🔄 CI/CD Pipeline

### Automatic Deployments
Set up Cloud Build triggers for automatic deployment:

```bash
# Create trigger for main branch
gcloud builds triggers create github \
    --repo-name=your-repo \
    --repo-owner=your-username \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

### Development Workflow
1. Push code to feature branch
2. Create pull request
3. Code review and testing
4. Merge to main branch
5. Automatic deployment via Cloud Build
6. Monitor deployment in Cloud Console

---

**Congratulations! Your DevIT GitHub alternative is now running on Google Cloud Platform! 🚀**
