#!/bin/bash

# DevIT Production Deployment Script
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="devit.dev"
PROJECT_DIR="/opt/devit"
BACKUP_DIR="/opt/devit-backups"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${BLUE}🚀 DevIT Production Deployment Script${NC}"
echo "=================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create project directory
print_status "Creating project directory..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Create backup directory
print_status "Creating backup directory..."
sudo mkdir -p $BACKUP_DIR
sudo chown $USER:$USER $BACKUP_DIR

# Copy project files
print_status "Copying project files..."
if [ -d "/tmp/devit-source" ]; then
    cp -r /tmp/devit-source/* $PROJECT_DIR/
else
    print_warning "Please ensure your project files are in /tmp/devit-source"
    print_warning "You can copy them manually to $PROJECT_DIR"
fi

cd $PROJECT_DIR

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    if [ -f ".env.production.template" ]; then
        print_warning "Creating .env.production from template..."
        cp .env.production.template .env.production
        print_warning "Please edit .env.production with your actual values before continuing"
        print_warning "Press Enter when ready to continue..."
        read
    else
        print_error ".env.production file not found. Please create it first."
        exit 1
    fi
fi

# Validate environment file
print_status "Validating environment configuration..."
if ! grep -q "your_secure_password" .env.production; then
    print_status "Environment file appears to be configured"
else
    print_error "Environment file still contains template values. Please update .env.production"
    exit 1
fi

# Create SSL directory
print_status "Setting up SSL directories..."
sudo mkdir -p /etc/ssl/devit.dev/{certs,private}

# Check if SSL certificates exist
if [ ! -f "/etc/ssl/devit.dev/certs/devit.dev.crt" ]; then
    print_warning "SSL certificates not found. Running SSL setup..."
    if [ -f "scripts/ssl-setup.sh" ]; then
        chmod +x scripts/ssl-setup.sh
        ./scripts/ssl-setup.sh
    else
        print_error "SSL setup script not found. Please run SSL setup manually."
        exit 1
    fi
fi

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f $DOCKER_COMPOSE_FILE pull

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f $DOCKER_COMPOSE_FILE down

# Create backup of database if it exists
if docker volume ls | grep -q devit_postgres_data; then
    print_status "Creating database backup..."
    BACKUP_FILE="$BACKUP_DIR/devit_backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose -f $DOCKER_COMPOSE_FILE run --rm db pg_dump -h db -U devit_user devit_prod > $BACKUP_FILE
    print_status "Database backed up to $BACKUP_FILE"
fi

# Start services
print_status "Starting production services..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if database needs initialization
print_status "Checking database status..."
if docker-compose -f $DOCKER_COMPOSE_FILE exec -T db psql -h localhost -U devit_user -d devit_prod -c '\dt' | grep -q "No relations found"; then
    print_status "Initializing database..."
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T frontend npm run db:push
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T frontend npm run db:seed
else
    print_status "Database already initialized"
fi

# Health checks
print_status "Running health checks..."

# Check frontend
if curl -sSf https://$DOMAIN > /dev/null 2>&1; then
    print_status "Frontend is responding"
else
    print_warning "Frontend health check failed"
fi

# Check API
if curl -sSf https://api.$DOMAIN/health > /dev/null 2>&1; then
    print_status "API is responding"
else
    print_warning "API health check failed"
fi

# Check storage
if curl -sSf https://storage.$DOMAIN > /dev/null 2>&1; then
    print_status "Storage is responding"
else
    print_warning "Storage health check failed"
fi

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/devit > /dev/null << EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f $PROJECT_DIR/$DOCKER_COMPOSE_FILE restart nginx
    endscript
}
EOF

# Setup monitoring cron jobs
print_status "Setting up monitoring..."
(crontab -l 2>/dev/null; echo "*/5 * * * * cd $PROJECT_DIR && docker-compose -f $DOCKER_COMPOSE_FILE ps --filter 'status=exited' | grep -q 'Exit' && echo 'DevIT service down' | mail -s 'DevIT Alert' admin@$DOMAIN") | crontab -

# Setup backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * cd $PROJECT_DIR && ./scripts/backup.sh") | crontab -

print_status "Deployment completed successfully!"
echo ""
echo -e "${BLUE}🎉 DevIT is now running at:${NC}"
echo -e "   Frontend: https://$DOMAIN"
echo -e "   API:      https://api.$DOMAIN"
echo -e "   Storage:  https://storage.$DOMAIN"
echo ""
echo -e "${BLUE}📋 Post-deployment checklist:${NC}"
echo "   1. Test all functionality on the live site"
echo "   2. Set up monitoring alerts"
echo "   3. Configure backup verification"
echo "   4. Update DNS TTL to a lower value for future deployments"
echo "   5. Set up CDN if needed"
echo ""
echo -e "${BLUE}📊 Useful commands:${NC}"
echo "   View logs:    docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
echo "   Restart:      docker-compose -f $DOCKER_COMPOSE_FILE restart"
echo "   Update:       git pull && docker-compose -f $DOCKER_COMPOSE_FILE up -d --build"
echo "   Backup:       ./scripts/backup.sh"
