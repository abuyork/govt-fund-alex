# SSL Setup Guide for Government AI Application

This guide will walk you through setting up SSL for your application running on your server (165.22.244.88) using Let's Encrypt and Certbot.

## Prerequisites

- A domain name pointing to your server IP (165.22.244.88)
- SSH access to your server with sudo privileges
- Your application code deployed to the server

## Step 1: Copy the Scripts to Your Server

First, make the scripts executable locally:

```bash
chmod +x setup-ssl.sh update-auth-urls.sh
```

Then, copy them to your server:

```bash
scp setup-ssl.sh update-auth-urls.sh user@165.22.244.88:~/govt-fund-ai/
```

Replace `user` with your actual username on the server.

## Step 2: Update Domain in Scripts

SSH into your server:

```bash
ssh user@165.22.244.88
```

Edit the domain name in both scripts to match your actual domain:

```bash
cd ~/govt-fund-ai
nano setup-ssl.sh
# Change DOMAIN_NAME="kvzd.info" to your actual domain
nano update-auth-urls.sh
# Change DOMAIN_NAME="kvzd.info" to your actual domain
```

## Step 3: Run the SSL Setup Script

Make sure you're in your application directory and run the setup script:

```bash
cd ~/govt-fund-ai
bash setup-ssl.sh
```

This script will:
1. Install Nginx and Certbot
2. Configure Nginx as a reverse proxy for your application
3. Set up SSL certificates with Let's Encrypt
4. Configure automatic certificate renewal
5. Update environment variables and restart your application

## Step 4: Update Authentication URLs

After SSL is set up, run the update script to fix all OAuth callback URLs:

```bash
cd ~/govt-fund-ai
bash update-auth-urls.sh
```

This script will:
1. Update all redirect URLs in your .env file to use HTTPS
2. Display instructions for updating OAuth provider settings
3. Rebuild and restart your application

## Step 5: Update OAuth Provider Settings

Follow the instructions displayed by the update script to update your OAuth provider settings in:
- Supabase Dashboard
- Kakao Developer Console
- Google Developer Console
- Naver Developer Console (if using)

## Troubleshooting

### If Certbot fails to obtain certificates:

1. Check if your domain is correctly pointing to your server:
   ```bash
   nslookup your-domain.com
   ```

2. Make sure port 80 and 443 are open in your firewall:
   ```bash
   sudo ufw status
   # If needed, open ports:
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. Check Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### If authentication doesn't work after setup:

1. Check that the callback URLs are correctly updated in both:
   - Your application's .env file
   - The OAuth provider's settings

2. Restart your application:
   ```bash
   cd ~/govt-fund-ai
   bash deploy.sh
   ```

3. Check application logs:
   ```bash
   cd ~/govt-fund-ai
   tail -f server.log
   ```

## SSL Certificate Renewal

Your SSL certificate will automatically renew before it expires. The setup script added a cron job that runs daily to check if renewal is needed.

To manually trigger renewal:

```bash
sudo certbot renew
``` 