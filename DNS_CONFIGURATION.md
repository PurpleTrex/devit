# DevIT DNS Configuration Guide

This document provides the DNS configuration needed for devit.dev to work with your production deployment.

## Required DNS Records

Configure the following DNS records with your domain registrar or DNS provider:

### A Records
```
Type    Name        Value               TTL
A       @           YOUR_SERVER_IP      300
A       www         YOUR_SERVER_IP      300
A       api         YOUR_SERVER_IP      300
A       storage     YOUR_SERVER_IP      300
```

### CNAME Records (Alternative to A records for subdomains)
```
Type    Name        Value               TTL
CNAME   www         devit.dev           300
CNAME   api         devit.dev           300
CNAME   storage     devit.dev           300
```

### TXT Records (for verification and security)
```
Type    Name        Value                                   TTL
TXT     @           "v=spf1 include:_spf.google.com ~all"  3600
TXT     @           "google-site-verification=YOUR_CODE"   3600
```

## DNS Provider Specific Instructions

### Cloudflare
1. Login to Cloudflare dashboard
2. Select your domain (devit.dev)
3. Go to DNS > Records
4. Add the A records listed above
5. Ensure SSL/TLS is set to "Full (strict)"
6. Enable "Always Use HTTPS"

### Namecheap
1. Login to Namecheap account
2. Go to Domain List > Manage
3. Click "Advanced DNS"
4. Add the A records listed above
5. Set TTL to 5 minutes (300 seconds) for initial testing

### GoDaddy
1. Login to GoDaddy account
2. Go to My Products > DNS
3. Add the A records listed above
4. Set TTL to 5 minutes for testing

### Google Domains
1. Login to Google Domains
2. Go to DNS settings
3. Add custom resource records
4. Create the A records listed above

## Verification Steps

After configuring DNS records:

1. **Check propagation** (may take up to 48 hours):
   ```bash
   nslookup devit.dev
   nslookup www.devit.dev
   nslookup api.devit.dev
   nslookup storage.devit.dev
   ```

2. **Test with dig** (Linux/macOS):
   ```bash
   dig devit.dev
   dig www.devit.dev
   dig api.devit.dev
   dig storage.devit.dev
   ```

3. **Online tools**:
   - https://whatsmydns.net/
   - https://dnschecker.org/
   - https://mxtoolbox.com/dns-lookup/

## Common Issues and Solutions

### DNS Not Propagating
- Wait up to 48 hours for full propagation
- Use lower TTL (300 seconds) during initial setup
- Clear your local DNS cache:
  - Windows: `ipconfig /flushdns`
  - macOS: `sudo dscacheutil -flushcache`
  - Linux: `sudo systemctl restart systemd-resolved`

### SSL Certificate Issues
- Ensure DNS is pointing to your server before generating SSL certificates
- Use DNS validation for Let's Encrypt if HTTP validation fails
- Check that ports 80 and 443 are open on your server

### Subdomain Not Working
- Verify A records for api.devit.dev and storage.devit.dev
- Check Nginx configuration matches the DNS setup
- Ensure SSL certificates include all subdomains

## Security Considerations

### DNSSEC (Optional but recommended)
Enable DNSSEC if your DNS provider supports it for additional security.

### CAA Records (Optional)
Add CAA records to specify which Certificate Authorities can issue certificates:
```
Type    Name    Value                           TTL
CAA     @       0 issue "letsencrypt.org"       3600
CAA     @       0 issuewild "letsencrypt.org"   3600
```

### DMARC/SPF (If sending emails)
```
Type    Name        Value                                               TTL
TXT     @           "v=spf1 include:_spf.google.com ~all"              3600
TXT     _dmarc      "v=DMARC1; p=quarantine; rua=mailto:admin@devit.dev" 3600
```

## Performance Optimization

### CDN Setup (Optional)
If using Cloudflare as CDN:
1. Enable Cloudflare proxy (orange cloud icon)
2. Configure caching rules for static assets
3. Enable Brotli compression
4. Set up page rules for API subdomain

### Geographic Distribution
For global users, consider:
- Multiple server locations
- GeoDNS routing
- CDN with global presence

## Monitoring

Set up monitoring for DNS health:
- DNS response time monitoring
- Certificate expiration alerts
- Uptime monitoring for all subdomains

## Contact Information

For DNS-related issues during deployment:
- Check server logs: `/var/log/nginx/error.log`
- Verify DNS with: `host devit.dev YOUR_SERVER_IP`
- Test connectivity: `telnet YOUR_SERVER_IP 443`
