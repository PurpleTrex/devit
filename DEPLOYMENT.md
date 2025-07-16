# DevIT Production Deployment Guide for devit.dev

## Domain Setup Complete! ✅

Your DevIT platform is now configured for the domain **devit.dev**

## Deployment Architecture

### Subdomains:
- **devit.dev** - Main application (frontend)
- **api.devit.dev** - Backend API
- **storage.devit.dev** - File storage (MinIO)

### Services:
- Frontend: Next.js (Port 3000)
- Backend: Rust API (Port 8080)
- Database: PostgreSQL (Port 5432)
- Cache: Redis (Port 6379)
- Storage: MinIO (Ports 9000/9001)
- Proxy: Nginx (Ports 80/443)

## Pre-deployment Steps

### 1. SSL Certificate Setup
You'll need SSL certificates for your domain. Options:

#### Option A: Let's Encrypt (Free)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d devit.dev -d www.devit.dev -d api.devit.dev -d storage.devit.dev
```

#### Option B: Cloudflare (Recommended)
- Use Cloudflare for DNS and SSL termination
- Enable "Full (strict)" SSL mode
- Generate origin certificates for the server

### 2. DNS Configuration
Set up these DNS records:

```
Type  Name     Value               TTL
A     @        YOUR_SERVER_IP      300
A     www      YOUR_SERVER_IP      300
A     api      YOUR_SERVER_IP      300
A     storage  YOUR_SERVER_IP      300
```

### 3. Environment Variables
Create a `.env.production.local` file with real values:

```bash
# Database
POSTGRES_PASSWORD="your_secure_database_password"

# JWT Secrets (generate strong secrets!)
JWT_SECRET="your_super_secure_jwt_secret_64_chars_minimum"
NEXTAUTH_SECRET="your_super_secure_nextauth_secret"

# Admin credentials
ADMIN_USERNAME="your_admin_username"
ADMIN_PASSWORD="your_secure_admin_password"

# MinIO
MINIO_ACCESS_KEY="your_minio_access_key"
MINIO_SECRET_KEY="your_minio_secret_key"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"

# Analytics (optional)
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

## Deployment Commands

### 1. Production Build & Deploy
```bash
# Clone to production server
git clone YOUR_REPO_URL /opt/devit
cd /opt/devit

# Copy environment file
cp .env.production.local .env

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Initialize database
cd frontend
npm run db:push
npm run db:seed
```

### 2. SSL Certificate Placement
Place your SSL certificates in:
```
/opt/devit/ssl/devit.dev.crt
/opt/devit/ssl/devit.dev.key
```

### 3. Monitor Services
```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check specific service
docker-compose -f docker-compose.prod.yml logs frontend
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Enable firewall (UFW/iptables)
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Enable HTTPS redirects
- [ ] Set up backup strategy
- [ ] Configure monitoring/alerting

## Backup Strategy

### Database Backup
```bash
# Create backup script
#!/bin/bash
docker exec devit-postgres-prod pg_dump -U devit devit > /backup/devit-$(date +%Y%m%d-%H%M%S).sql
```

### File Storage Backup
```bash
# Backup MinIO data
docker exec devit-minio-prod mc mirror /data /backup/minio/
```

## Monitoring

### Health Checks
- **Frontend**: https://devit.dev
- **API**: https://api.devit.dev/health
- **Storage**: https://storage.devit.dev
- **Database**: Internal health check

### Log Locations
- Frontend: `docker logs devit-frontend-prod`
- Backend: `docker logs devit-backend-prod`
- Database: `docker logs devit-postgres-prod`
- Nginx: `docker logs devit-nginx-prod`

## Scaling Considerations

### Horizontal Scaling
- Use Docker Swarm or Kubernetes
- Load balancer for multiple frontend instances
- Read replicas for PostgreSQL
- Redis Cluster for caching

### Performance Optimization
- Enable CDN (Cloudflare)
- Optimize database queries
- Implement caching strategies
- Compress static assets

## Support & Maintenance

### Regular Tasks
- [ ] Update Docker images monthly
- [ ] Monitor SSL certificate expiry
- [ ] Review security logs
- [ ] Backup verification
- [ ] Performance monitoring

Your DevIT platform is now ready for production deployment at **devit.dev**! 🚀
