# GCP Setup Guide for DevIT Application

## Step-by-Step Setup from Scratch

### Prerequisites
- GCP Account (✅ You have this)
- Credit card on file for billing
- Local machine with internet access

---

## Phase 1: Initial GCP Setup (15 minutes)

### Step 1: Create and Configure Project

1. **Go to GCP Console**: https://console.cloud.google.com/
2. **Create New Project**:
   - Click "Select a project" dropdown at top
   - Click "NEW PROJECT"
   - Project name: `devit-production`
   - Project ID: `devit-prod-[random-string]` (note this down!)
   - Click "CREATE"

3. **Enable Billing**:
   - Go to "Billing" in the left menu
   - Link your credit card if not already done
   - Verify billing is enabled for your project

### Step 2: Install Google Cloud CLI

**Windows:**
```powershell
# Download and install from: https://cloud.google.com/sdk/docs/install
# Or using PowerShell:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**After installation:**
```bash
# Initialize gcloud
gcloud init

# Select your project
gcloud config set project devit-prod-[your-project-id]

# Authenticate
gcloud auth login
```

### Step 3: Enable Required APIs

```bash
# Enable all required APIs
gcloud services enable \
    alloydb.googleapis.com \
    compute.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    storage.googleapis.com \
    redis.googleapis.com \
    secretmanager.googleapis.com \
    container.googleapis.com \
    sql.googleapis.com \
    servicenetworking.googleapis.com \
    vpcaccess.googleapis.com
```

---

## Phase 2: Network Setup (10 minutes)

### Step 4: Create VPC Network

```bash
# Set variables
export PROJECT_ID=$(gcloud config get-value project)
export REGION="us-central1"

# Create VPC network
gcloud compute networks create devit-vpc \
    --subnet-mode=regional \
    --bgp-routing-mode=regional

# Create subnet
gcloud compute networks subnets create devit-subnet \
    --network=devit-vpc \
    --range=10.1.0.0/24 \
    --region=$REGION

# Create private service connection for AlloyDB
gcloud compute addresses create devit-private-ip \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length=16 \
    --network=devit-vpc

gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges=devit-private-ip \
    --network=devit-vpc
```

---

## Phase 3: AlloyDB Setup (20 minutes)

### Step 5: Create AlloyDB Cluster

```bash
# Create AlloyDB cluster (this takes 10-15 minutes)
gcloud alloydb clusters create devit-cluster \
    --region=$REGION \
    --network=devit-vpc \
    --password=DevIT2025SecurePassword! \
    --automated-backup-policy-location=$REGION \
    --automated-backup-policy-backup-window-start-time="02:00" \
    --automated-backup-policy-days-of-week=MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY

# Wait for cluster creation (monitor in console or wait for command completion)

# Create primary instance
gcloud alloydb instances create devit-primary \
    --cluster=devit-cluster \
    --region=$REGION \
    --instance-type=PRIMARY \
    --cpu-count=2 \
    --availability-type=ZONAL

# Get the private IP (save this!)
gcloud alloydb instances describe devit-primary \
    --cluster=devit-cluster \
    --region=$REGION \
    --format="value(ipAddress)"
```

**Important**: Note down the private IP address that appears!

---

## Phase 4: Secrets Management (5 minutes)

### Step 6: Create Secrets

```bash
# Create database password secret
echo -n "DevIT2025SecurePassword!" | gcloud secrets create alloydb-password --data-file=-

# Create JWT secret (generate random 256-bit key)
openssl rand -base64 32 | gcloud secrets create jwt-secret --data-file=-

# Create NextAuth secret
openssl rand -base64 32 | gcloud secrets create nextauth-secret --data-file=-

# Grant Cloud Run access to secrets
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

---

## Phase 5: Cloud Storage Setup (5 minutes)

### Step 7: Create Storage Buckets

```bash
# Create bucket for application storage
gsutil mb -l $REGION gs://$PROJECT_ID-devit-storage

# Create bucket for static assets
gsutil mb -l $REGION gs://$PROJECT_ID-devit-static

# Set CORS for frontend access
echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://$PROJECT_ID-devit-storage
```

---

## Phase 6: Cloud Build Setup (10 minutes)

### Step 8: Grant Cloud Build Permissions

```bash
# Get Cloud Build service account
export CLOUDBUILD_SA=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")@cloudbuild.gserviceaccount.com

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$CLOUDBUILD_SA" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$CLOUDBUILD_SA" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$CLOUDBUILD_SA" \
    --role="roles/alloydb.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$CLOUDBUILD_SA" \
    --role="roles/secretmanager.secretAccessor"

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com
```

---

## Phase 7: Database Setup (15 minutes)

### Step 9: Initialize Database Schema

**First, let's connect to AlloyDB and create the database:**

```bash
# Install Cloud SQL Proxy
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
chmod +x cloud_sql_proxy

# Connect via proxy (in one terminal)
./cloud_sql_proxy -instances=$PROJECT_ID:$REGION:devit-cluster &

# Connect with psql (install if needed: apt-get install postgresql-client)
PGPASSWORD="DevIT2025SecurePassword!" psql -h 127.0.0.1 -U postgres -d postgres
```

**In the psql session, run:**
```sql
-- Create the DevIT database
CREATE DATABASE devit;

-- Connect to the DevIT database
\c devit;

-- Create extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exit
\q
```

---

## Phase 8: Deploy Application (20 minutes)

### Step 10: Update Environment Variables

Update your local `.env.production` with real values:

```bash
# GCP Project Configuration
GCP_PROJECT_ID=your-actual-project-id
GCP_REGION=us-central1

# AlloyDB Configuration  
ALLOYDB_CLUSTER_ID=devit-cluster
ALLOYDB_INSTANCE_ID=devit-primary
ALLOYDB_REGION=us-central1
USE_CLOUD_SQL_PROXY=true
ALLOYDB_PRIVATE_IP=your-alloydb-private-ip

# Database Connection
DATABASE_URL=postgresql://postgres:DevIT2025SecurePassword!@127.0.0.1:5432/devit
DB_USER=postgres
DB_PASSWORD=DevIT2025SecurePassword!
DB_NAME=devit

# Domain (you can change this later)
NEXT_PUBLIC_DOMAIN=your-project-id.app
NEXT_PUBLIC_API_URL=https://devit-backend-xyz-uc.a.run.app
```

### Step 11: Deploy to Cloud Run

```bash
# Navigate to your project directory
cd /path/to/your/devit/project

# Build and deploy backend
gcloud builds submit ./backend \
    --config=cloudbuild.yaml \
    --substitutions=_SERVICE_NAME=devit-backend

# Build and deploy frontend  
gcloud builds submit ./frontend \
    --config=frontend-cloudbuild.yaml \
    --substitutions=_SERVICE_NAME=devit-frontend
```

---

## Phase 9: Verification (10 minutes)

### Step 12: Test Deployment

```bash
# Get backend URL
gcloud run services describe devit-backend --region=$REGION --format="value(status.url)"

# Test health endpoint
curl https://devit-backend-xyz-uc.a.run.app/health

# Get frontend URL
gcloud run services describe devit-frontend --region=$REGION --format="value(status.url)"
```

---

## Phase 10: Domain Setup (Optional - 15 minutes)

### Step 13: Custom Domain

```bash
# Map custom domain (if you have one)
gcloud run domain-mappings create \
    --service=devit-frontend \
    --domain=devit.yourdomain.com \
    --region=$REGION

# Verify domain ownership in Google Search Console
# Update DNS records as instructed
```

---

## Cost Estimation

**Monthly costs (approximate):**
- AlloyDB (2 vCPU): $200-300/month
- Cloud Run: $10-50/month (depending on usage)
- Cloud Storage: $5-20/month
- Cloud Build: $10-30/month
- Networking: $5-15/month
- **Total: ~$230-415/month**

---

## Next Steps After Setup

1. **Run database migrations** (we'll set these up)
2. **Configure monitoring and logging**
3. **Set up CI/CD pipelines**
4. **Configure custom domain and SSL**
5. **Set up backup and disaster recovery**

---

## Troubleshooting Common Issues

### AlloyDB Connection Issues:
```bash
# Check cluster status
gcloud alloydb clusters describe devit-cluster --region=$REGION

# Check instance status  
gcloud alloydb instances describe devit-primary --cluster=devit-cluster --region=$REGION
```

### Cloud Run Deployment Issues:
```bash
# Check build logs
gcloud builds list --limit=5

# Check service logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

### Permission Issues:
```bash
# Re-grant permissions if needed
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="user:your-email@gmail.com" \
    --role="roles/owner"
```

Let me know when you complete each phase, and I'll help you with any issues that come up!
