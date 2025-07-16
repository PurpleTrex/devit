#!/bin/bash

# DevIT Health Check Script
# Monitors all services and sends alerts if issues are detected

set -e

# Configuration
PROJECT_DIR="/opt/devit"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
DOMAIN="devit.dev"
ALERT_EMAIL="admin@devit.dev"
LOG_FILE="/var/log/devit-health.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Status functions
print_ok() {
    echo -e "${GREEN}✅ $1${NC}"
    log "OK: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

# Alert function
send_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" $ALERT_EMAIL
    fi
    
    # Log the alert
    log "ALERT: $subject - $message"
}

# Health check functions
check_docker_services() {
    print_info "Checking Docker services..."
    
    cd $PROJECT_DIR
    
    # Check if docker-compose file exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "Docker compose file not found: $DOCKER_COMPOSE_FILE"
        return 1
    fi
    
    # Get service status
    local services=$(docker-compose -f $DOCKER_COMPOSE_FILE ps --services)
    local failed_services=""
    
    for service in $services; do
        local status=$(docker-compose -f $DOCKER_COMPOSE_FILE ps $service | grep $service | awk '{print $3}')
        
        if [[ "$status" == "Up" ]]; then
            print_ok "Service $service is running"
        else
            print_error "Service $service is not running (status: $status)"
            failed_services="$failed_services $service"
        fi
    done
    
    if [ ! -z "$failed_services" ]; then
        send_alert "DevIT Services Down" "The following services are not running:$failed_services"
        return 1
    fi
    
    return 0
}

check_web_endpoints() {
    print_info "Checking web endpoints..."
    
    local endpoints=(
        "https://$DOMAIN"
        "https://www.$DOMAIN"
        "https://api.$DOMAIN/health"
        "https://storage.$DOMAIN"
    )
    
    local failed_endpoints=""
    
    for endpoint in "${endpoints[@]}"; do
        if curl -sSf --connect-timeout 10 --max-time 30 "$endpoint" > /dev/null 2>&1; then
            print_ok "Endpoint $endpoint is responding"
        else
            print_error "Endpoint $endpoint is not responding"
            failed_endpoints="$failed_endpoints $endpoint"
        fi
    done
    
    if [ ! -z "$failed_endpoints" ]; then
        send_alert "DevIT Endpoints Down" "The following endpoints are not responding:$failed_endpoints"
        return 1
    fi
    
    return 0
}

check_database() {
    print_info "Checking database connection..."
    
    cd $PROJECT_DIR
    
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T db pg_isready -h localhost -U devit_user > /dev/null 2>&1; then
        print_ok "Database is responding"
        
        # Check database size and connections
        local db_size=$(docker-compose -f $DOCKER_COMPOSE_FILE exec -T db psql -h localhost -U devit_user -d devit_prod -t -c "SELECT pg_size_pretty(pg_database_size('devit_prod'));" | tr -d ' ')
        local connections=$(docker-compose -f $DOCKER_COMPOSE_FILE exec -T db psql -h localhost -U devit_user -d devit_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='devit_prod';" | tr -d ' ')
        
        print_info "Database size: $db_size"
        print_info "Active connections: $connections"
        
        # Alert if too many connections (adjust threshold as needed)
        if [ "$connections" -gt 50 ]; then
            send_alert "High Database Connections" "Database has $connections active connections"
        fi
        
        return 0
    else
        print_error "Database is not responding"
        send_alert "DevIT Database Down" "PostgreSQL database is not responding"
        return 1
    fi
}

check_ssl_certificates() {
    print_info "Checking SSL certificates..."
    
    local cert_file="/etc/ssl/devit.dev/certs/devit.dev.crt"
    
    if [ -f "$cert_file" ]; then
        local expiry_date=$(openssl x509 -in "$cert_file" -noout -dates | grep notAfter | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            print_ok "SSL certificate valid for $days_until_expiry days"
        elif [ $days_until_expiry -gt 7 ]; then
            print_warning "SSL certificate expires in $days_until_expiry days"
            send_alert "SSL Certificate Warning" "SSL certificate for $DOMAIN expires in $days_until_expiry days"
        else
            print_error "SSL certificate expires in $days_until_expiry days"
            send_alert "SSL Certificate Critical" "SSL certificate for $DOMAIN expires in $days_until_expiry days - immediate action required"
        fi
    else
        print_error "SSL certificate file not found: $cert_file"
        send_alert "SSL Certificate Missing" "SSL certificate file not found at $cert_file"
        return 1
    fi
    
    return 0
}

check_disk_space() {
    print_info "Checking disk space..."
    
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ $usage -lt 80 ]; then
        print_ok "Disk usage: ${usage}%"
    elif [ $usage -lt 90 ]; then
        print_warning "Disk usage: ${usage}%"
        send_alert "High Disk Usage" "Disk usage is at ${usage}%"
    else
        print_error "Disk usage: ${usage}%"
        send_alert "Critical Disk Usage" "Disk usage is at ${usage}% - immediate action required"
    fi
    
    # Check Docker disk usage
    local docker_usage=$(docker system df | grep "Total" | awk '{print $3}')
    print_info "Docker disk usage: $docker_usage"
}

check_memory_usage() {
    print_info "Checking memory usage..."
    
    local memory_info=$(free | grep Mem)
    local total=$(echo $memory_info | awk '{print $2}')
    local used=$(echo $memory_info | awk '{print $3}')
    local usage=$(( used * 100 / total ))
    
    if [ $usage -lt 80 ]; then
        print_ok "Memory usage: ${usage}%"
    elif [ $usage -lt 90 ]; then
        print_warning "Memory usage: ${usage}%"
        send_alert "High Memory Usage" "Memory usage is at ${usage}%"
    else
        print_error "Memory usage: ${usage}%"
        send_alert "Critical Memory Usage" "Memory usage is at ${usage}% - immediate action required"
    fi
}

check_log_files() {
    print_info "Checking log files for errors..."
    
    cd $PROJECT_DIR
    
    # Check for recent errors in Docker logs
    local error_count=$(docker-compose -f $DOCKER_COMPOSE_FILE logs --since 1h 2>&1 | grep -i error | wc -l)
    
    if [ $error_count -eq 0 ]; then
        print_ok "No errors found in recent logs"
    elif [ $error_count -lt 10 ]; then
        print_warning "Found $error_count errors in recent logs"
    else
        print_error "Found $error_count errors in recent logs"
        send_alert "High Error Count" "Found $error_count errors in logs within the last hour"
    fi
    
    # Check Nginx error logs
    if [ -f "/var/log/nginx/error.log" ]; then
        local nginx_errors=$(tail -100 /var/log/nginx/error.log | grep "$(date '+%Y/%m/%d')" | wc -l)
        if [ $nginx_errors -gt 0 ]; then
            print_warning "Found $nginx_errors Nginx errors today"
        fi
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🔍 DevIT Health Check - $(date)${NC}"
    echo "================================================"
    
    local exit_code=0
    
    check_docker_services || exit_code=1
    echo ""
    
    check_web_endpoints || exit_code=1
    echo ""
    
    check_database || exit_code=1
    echo ""
    
    check_ssl_certificates || exit_code=1
    echo ""
    
    check_disk_space
    echo ""
    
    check_memory_usage
    echo ""
    
    check_log_files
    echo ""
    
    if [ $exit_code -eq 0 ]; then
        print_ok "All health checks passed"
        log "Health check completed successfully"
    else
        print_error "Some health checks failed"
        log "Health check completed with failures"
    fi
    
    echo "================================================"
    
    return $exit_code
}

# Run health check
main "$@"
