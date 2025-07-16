#!/bin/bash

# DevIT Backup Script
# Creates backups of database and files

set -e

# Configuration
BACKUP_DIR="/opt/devit-backups"
PROJECT_DIR="/opt/devit"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🔄 Starting DevIT backup process..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

cd $PROJECT_DIR

# Check if services are running
if ! docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "Up"; then
    print_error "DevIT services are not running"
    exit 1
fi

# Create database backup
print_status "Creating database backup..."
DB_BACKUP_FILE="$BACKUP_DIR/devit_db_$DATE.sql"
docker-compose -f $DOCKER_COMPOSE_FILE exec -T db pg_dump -h localhost -U devit_user devit_prod > $DB_BACKUP_FILE

if [ $? -eq 0 ]; then
    print_status "Database backup created: $DB_BACKUP_FILE"
    gzip $DB_BACKUP_FILE
    print_status "Database backup compressed: $DB_BACKUP_FILE.gz"
else
    print_error "Database backup failed"
    exit 1
fi

# Create MinIO data backup
print_status "Creating file storage backup..."
MINIO_BACKUP_FILE="$BACKUP_DIR/devit_files_$DATE.tar.gz"
docker run --rm \
    --volumes-from $(docker-compose -f $DOCKER_COMPOSE_FILE ps -q minio) \
    -v $BACKUP_DIR:/backup \
    alpine tar czf /backup/devit_files_$DATE.tar.gz -C /data .

if [ $? -eq 0 ]; then
    print_status "File storage backup created: $MINIO_BACKUP_FILE"
else
    print_warning "File storage backup failed (this is normal if MinIO volume is empty)"
fi

# Create configuration backup
print_status "Creating configuration backup..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/devit_config_$DATE.tar.gz"
tar czf $CONFIG_BACKUP_FILE \
    .env.production \
    $DOCKER_COMPOSE_FILE \
    infrastructure/ \
    scripts/ \
    --exclude='*.log'

print_status "Configuration backup created: $CONFIG_BACKUP_FILE"

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/backup_manifest_$DATE.txt"
cat > $MANIFEST_FILE << EOF
DevIT Backup Manifest
=====================
Date: $(date)
Backup ID: $DATE

Files:
- Database: devit_db_$DATE.sql.gz
- File Storage: devit_files_$DATE.tar.gz
- Configuration: devit_config_$DATE.tar.gz

Checksums:
$(cd $BACKUP_DIR && sha256sum devit_*_$DATE.* 2>/dev/null || echo "Some files may not exist")

Service Status at Backup Time:
$(docker-compose -f $DOCKER_COMPOSE_FILE ps)

System Info:
- Hostname: $(hostname)
- Disk Usage: $(df -h $BACKUP_DIR | tail -1)
- Memory Usage: $(free -h | grep Mem)
EOF

print_status "Backup manifest created: $MANIFEST_FILE"

# Clean up old backups
print_status "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "devit_*" -type f -mtime +$RETENTION_DAYS -delete
DELETED_COUNT=$(find $BACKUP_DIR -name "devit_*" -type f -mtime +$RETENTION_DAYS | wc -l)
if [ $DELETED_COUNT -gt 0 ]; then
    print_status "Deleted $DELETED_COUNT old backup files"
fi

# Calculate backup sizes
DB_SIZE=$(du -h "$DB_BACKUP_FILE.gz" 2>/dev/null | cut -f1 || echo "N/A")
FILES_SIZE=$(du -h "$MINIO_BACKUP_FILE" 2>/dev/null | cut -f1 || echo "N/A")
CONFIG_SIZE=$(du -h "$CONFIG_BACKUP_FILE" 2>/dev/null | cut -f1 || echo "N/A")
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)

# Optional: Upload to S3 if configured
if [ ! -z "$AWS_ACCESS_KEY_ID" ] && [ ! -z "$S3_BACKUP_BUCKET" ]; then
    print_status "Uploading backups to S3..."
    aws s3 cp $BACKUP_DIR/ s3://$S3_BACKUP_BUCKET/devit-backups/ --recursive --include "*_$DATE.*"
    if [ $? -eq 0 ]; then
        print_status "Backups uploaded to S3 successfully"
    else
        print_warning "S3 upload failed"
    fi
fi

# Optional: Send notification
if command -v mail &> /dev/null; then
    mail -s "DevIT Backup Completed - $DATE" admin@devit.dev << EOF
DevIT backup completed successfully.

Backup Details:
- Date: $(date)
- Database: $DB_SIZE
- Files: $FILES_SIZE  
- Config: $CONFIG_SIZE
- Total backup directory size: $TOTAL_SIZE

Location: $BACKUP_DIR

This is an automated message from the DevIT backup system.
EOF
fi

print_status "Backup process completed successfully!"
echo ""
echo "📊 Backup Summary:"
echo "   Database backup: $DB_SIZE"
echo "   Files backup: $FILES_SIZE"
echo "   Config backup: $CONFIG_SIZE"
echo "   Total backup directory: $TOTAL_SIZE"
echo "   Location: $BACKUP_DIR"
