#!/bin/bash

# SSL Certificate Setup Script for devit.dev
# This script sets up SSL certificates using Let's Encrypt with Certbot

set -e

DOMAIN="devit.dev"
EMAIL="admin@devit.dev"  # Change this to your email
WEBROOT="/var/www/certbot"

echo "🔒 Setting up SSL certificates for $DOMAIN..."

# Create webroot directory for Let's Encrypt verification
mkdir -p $WEBROOT

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install certbot
    else
        echo "❌ Please install Certbot manually for your OS"
        exit 1
    fi
fi

# Stop Nginx temporarily for certificate generation
echo "⏸️ Stopping Nginx temporarily..."
sudo systemctl stop nginx || docker-compose -f docker-compose.prod.yml stop nginx

# Generate certificates for main domain and subdomains
echo "🎫 Generating SSL certificates..."
sudo certbot certonly \
    --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d api.$DOMAIN \
    -d storage.$DOMAIN

# Create SSL directory structure for Docker
echo "📁 Setting up SSL directory structure..."
sudo mkdir -p /etc/ssl/devit.dev/{certs,private}

# Copy certificates to the expected locations
echo "📋 Copying certificates..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/ssl/devit.dev/certs/devit.dev.crt
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/ssl/devit.dev/private/devit.dev.key

# Set proper permissions
sudo chmod 644 /etc/ssl/devit.dev/certs/devit.dev.crt
sudo chmod 600 /etc/ssl/devit.dev/private/devit.dev.key
sudo chown root:root /etc/ssl/devit.dev/certs/devit.dev.crt
sudo chown root:root /etc/ssl/devit.dev/private/devit.dev.key

# Create renewal hook script
echo "🔄 Setting up auto-renewal..."
sudo tee /etc/letsencrypt/renewal-hooks/deploy/devit-deploy.sh > /dev/null << 'EOF'
#!/bin/bash
# Copy renewed certificates to Docker SSL directory
cp /etc/letsencrypt/live/devit.dev/fullchain.pem /etc/ssl/devit.dev/certs/devit.dev.crt
cp /etc/letsencrypt/live/devit.dev/privkey.pem /etc/ssl/devit.dev/private/devit.dev.key
chmod 644 /etc/ssl/devit.dev/certs/devit.dev.crt
chmod 600 /etc/ssl/devit.dev/private/devit.dev.key

# Reload Nginx in Docker
docker-compose -f /path/to/devit/docker-compose.prod.yml exec nginx nginx -s reload
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/devit-deploy.sh

# Test certificate renewal
echo "🧪 Testing certificate renewal..."
sudo certbot renew --dry-run

# Start Nginx again
echo "▶️ Starting Nginx..."
sudo systemctl start nginx || docker-compose -f docker-compose.prod.yml start nginx

echo "✅ SSL certificates successfully set up for:"
echo "   - $DOMAIN"
echo "   - www.$DOMAIN" 
echo "   - api.$DOMAIN"
echo "   - storage.$DOMAIN"
echo ""
echo "📋 Next steps:"
echo "1. Update your DNS records to point to this server"
echo "2. Run: docker-compose -f docker-compose.prod.yml up -d"
echo "3. Test your site at https://$DOMAIN"
echo ""
echo "🔄 Certificates will auto-renew via cron job"
