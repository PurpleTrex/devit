# AlloyDB Setup for DevIT Application

## Overview
AlloyDB is Google Cloud's fully managed PostgreSQL-compatible database service that provides:
- Up to 4x faster analytical queries than standard PostgreSQL
- Built-in machine learning capabilities
- Columnar engine for analytics
- 99.99% availability SLA
- PostgreSQL compatibility (version 14+)

## Architecture for DevIT

```
Cloud Run (Backend) → Cloud SQL Proxy → AlloyDB Cluster → Primary Instance
                                      ↓
                                   Read Replicas (for scaling reads)
```

## Setup Instructions

### 1. Create AlloyDB Cluster and Instance

```bash
# Set environment variables
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export CLUSTER_ID="devit-cluster"
export INSTANCE_ID="devit-primary"
export PASSWORD="your-secure-password"

# Enable AlloyDB API
gcloud services enable alloydb.googleapis.com

# Create AlloyDB cluster
gcloud alloydb clusters create $CLUSTER_ID \
    --password=$PASSWORD \
    --network=default \
    --region=$REGION \
    --project=$PROJECT_ID

# Create primary instance
gcloud alloydb instances create $INSTANCE_ID \
    --instance-type=PRIMARY \
    --cpu-count=2 \
    --cluster=$CLUSTER_ID \
    --region=$REGION \
    --project=$PROJECT_ID

# Optional: Create read replica for scaling
gcloud alloydb instances create devit-read-replica \
    --instance-type=READ_POOL \
    --cpu-count=2 \
    --cluster=$CLUSTER_ID \
    --region=$REGION \
    --project=$PROJECT_ID
```

### 2. Environment Variables for Production

```bash
# AlloyDB Configuration
ALLOYDB_CLUSTER_ID=devit-cluster
ALLOYDB_INSTANCE_ID=devit-primary
ALLOYDB_REGION=us-central1
GCP_PROJECT_ID=your-gcp-project-id

# Database Connection
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=devit
USE_CLOUD_SQL_PROXY=true

# For Cloud Run deployment, the connection string will be:
# postgresql://postgres:password@localhost:5432/devit
```

### 3. Cloud Run Deployment with AlloyDB

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/devit-backend:$COMMIT_SHA', '.']
    dir: 'backend'

  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/devit-backend:$COMMIT_SHA']

  # Deploy to Cloud Run with AlloyDB connection
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'devit-backend'
      - '--image=gcr.io/$PROJECT_ID/devit-backend:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--add-cloudsql-instances=$PROJECT_ID:us-central1:devit-cluster'
      - '--set-env-vars=USE_CLOUD_SQL_PROXY=true'
      - '--set-env-vars=DB_USER=postgres'
      - '--set-env-vars=DB_NAME=devit'
      - '--set-env-vars=GCP_PROJECT_ID=$PROJECT_ID'
      - '--set-env-vars=ALLOYDB_CLUSTER_ID=devit-cluster'
      - '--set-env-vars=ALLOYDB_INSTANCE_ID=devit-primary'
      - '--set-env-vars=ALLOYDB_REGION=us-central1'
      - '--set-secrets=DB_PASSWORD=db-password:latest'
      - '--set-secrets=JWT_SECRET=jwt-secret:latest'

options:
  logging: CLOUD_LOGGING_ONLY
```

### 4. Update Dockerfile for AlloyDB

```dockerfile
FROM rust:1.70 as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim

# Install Cloud SQL Proxy for AlloyDB connection
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download and install Cloud SQL Proxy
RUN curl -o /usr/local/bin/cloud_sql_proxy \
    https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 \
    && chmod +x /usr/local/bin/cloud_sql_proxy

COPY --from=builder /app/target/release/devit-backend /usr/local/bin/devit-backend

# Create startup script
RUN echo '#!/bin/bash\n\
# Start Cloud SQL Proxy in background\n\
if [ "$USE_CLOUD_SQL_PROXY" = "true" ]; then\n\
    cloud_sql_proxy -instances=$GCP_PROJECT_ID:$ALLOYDB_REGION:$ALLOYDB_CLUSTER_ID=tcp:5432 &\n\
    # Wait for proxy to be ready\n\
    sleep 5\n\
fi\n\
\n\
# Start the application\n\
exec devit-backend' > /usr/local/bin/start.sh \
    && chmod +x /usr/local/bin/start.sh

EXPOSE 8080

CMD ["/usr/local/bin/start.sh"]
```

### 5. Performance Optimizations for AlloyDB

#### Connection Pool Settings (in main.rs):
```rust
let pool = PgPoolOptions::new()
    .max_connections(20)  // AlloyDB can handle more connections
    .min_connections(5)   // Keep minimum connections warm
    .acquire_timeout(Duration::from_secs(30))
    .idle_timeout(Duration::from_secs(600))   // 10 minutes
    .max_lifetime(Duration::from_secs(1800))  // 30 minutes
    .connect(&database_url)
    .await?;
```

#### Query Optimizations:
- Use prepared statements (already implemented with SQLx)
- Leverage AlloyDB's columnar engine for analytics queries
- Use read replicas for read-heavy operations

### 6. Monitoring and Logging

```bash
# Enable monitoring
gcloud alloydb clusters update $CLUSTER_ID \
    --enable-google-cloud-managed-backup \
    --region=$REGION

# Set up alerts for connection count, CPU, memory
gcloud alpha monitoring policies create \
    --policy-from-file=alloydb-monitoring-policy.yaml
```

### 7. Security Best Practices

1. **Network Security**: Use private IP addresses only
2. **Authentication**: Use Cloud IAM database authentication
3. **Encryption**: Enable encryption at rest and in transit (default)
4. **Secrets Management**: Store passwords in Secret Manager

```bash
# Store database password in Secret Manager
echo -n "your-secure-password" | gcloud secrets create db-password --data-file=-

# Store JWT secret
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
```

### 8. Cost Optimization

1. **Right-sizing**: Start with 2 vCPUs, scale based on metrics
2. **Read Replicas**: Use for read-heavy workloads
3. **Backup Strategy**: Configure automated backups with retention policy
4. **Regional Placement**: Choose region closest to users

## Benefits for DevIT Application

1. **Performance**: 4x faster analytics for repository statistics
2. **Scalability**: Automatic scaling with read replicas
3. **Reliability**: 99.99% availability SLA
4. **PostgreSQL Compatibility**: No code changes needed
5. **ML Integration**: Built-in capabilities for future features
6. **Maintenance**: Fully managed service

## Migration from Standard PostgreSQL

If migrating from existing PostgreSQL:

```bash
# Export existing data
pg_dump -h old-host -U username -d devit > devit_backup.sql

# Import to AlloyDB
psql -h alloydb-private-ip -U postgres -d devit < devit_backup.sql
```

The AlloyDB setup provides enterprise-grade performance and reliability for the DevIT application while maintaining full PostgreSQL compatibility.
