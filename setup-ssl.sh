#!/bin/bash

# Script to set up SSL using Certbot on the server
# Run this script on the server (165.22.244.88)

# Exit on any error
set -e

# Set your domain name - replace with your actual domain
DOMAIN_NAME="kvzd.info"

# Update package lists
echo "Updating package lists..."
sudo apt-get update

# Install Nginx if not already installed
echo "Installing Nginx..."
sudo apt-get install -y nginx

# Install Certbot and Nginx plugin
echo "Installing Certbot and Nginx plugin..."
sudo apt-get install -y certbot python3-certbot-nginx

# Configure Nginx for the application
echo "Configuring Nginx for your application..."
sudo tee /etc/nginx/sites-available/$DOMAIN_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Configure for Let's Encrypt validation
    location ~ /.well-known {
        allow all;
    }

    # Add CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    # Handle preflight requests
    if (\$request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
        add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Authorization';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
EOF

# Enable the site
echo "Enabling the site in Nginx..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx to apply changes
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Obtain SSL certificate
echo "Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME

# Set up auto-renewal
echo "Setting up automatic renewal..."
echo "0 3 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab > /dev/null

# Get the current directory for the app
APP_DIR=$(pwd)

# Update environment variables for SSL
echo "Updating environment variables..."
echo "VITE_SERVER_DOMAIN=https://$DOMAIN_NAME" >> $APP_DIR/.env

# Rebuild the application
echo "Rebuilding the application..."
cd $APP_DIR
npm install
npm run build

# Restart the application
echo "Restarting the application..."
bash $APP_DIR/deploy.sh

echo "SSL setup complete! Your application is now accessible via https://$DOMAIN_NAME"
echo "Please update the Supabase settings to use the new https URL for callbacks." 