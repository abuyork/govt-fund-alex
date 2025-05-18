#!/bin/bash

# Script to update authentication URLs after SSL is set up
# Run this script after setup-ssl.sh

# Exit on any error
set -e

# Set your domain name - replace with your actual domain
DOMAIN_NAME="kvzd.info"

# Get the current directory for the app
APP_DIR=$(pwd)

# Update .env file with HTTPS URLs
echo "Updating .env file with HTTPS URLs..."
sed -i "s|http://165.22.244.88|https://$DOMAIN_NAME|g" "$APP_DIR/.env"
sed -i "s|VITE_KAKAO_REDIRECT_URI=.*|VITE_KAKAO_REDIRECT_URI=https://$DOMAIN_NAME/auth/callback|" "$APP_DIR/.env"
sed -i "s|VITE_GOOGLE_REDIRECT_URI=.*|VITE_GOOGLE_REDIRECT_URI=https://$DOMAIN_NAME/auth/callback|" "$APP_DIR/.env"
sed -i "s|VITE_NAVER_REDIRECT_URI=.*|VITE_NAVER_REDIRECT_URI=https://$DOMAIN_NAME/auth/callback|" "$APP_DIR/.env"
sed -i "s|VITE_SERVER_DOMAIN=.*|VITE_SERVER_DOMAIN=https://$DOMAIN_NAME|" "$APP_DIR/.env"

# Display the updated .env file
echo "Updated .env file:"
cat "$APP_DIR/.env"

echo "===================================================================="
echo "IMPORTANT: You need to update your OAuth providers with the new URLs:"
echo "===================================================================="
echo "1. Go to Supabase Dashboard → Authentication → URL Configuration"
echo "   - Set Site URL to: https://$DOMAIN_NAME"
echo "   - Set Redirect URLs to include: https://$DOMAIN_NAME/auth/callback"
echo ""
echo "2. Update Kakao Developer Console:"
echo "   - Set Redirect URI to: https://$DOMAIN_NAME/auth/callback"
echo ""
echo "3. Update Google Developer Console:"
echo "   - Set Authorized redirect URI to: https://$DOMAIN_NAME/auth/callback"
echo ""
echo "4. If using Naver, update Naver Developer Console:"
echo "   - Set Callback URL to: https://$DOMAIN_NAME/auth/callback"
echo "===================================================================="

# Rebuild and restart the application
echo "Rebuilding the application..."
cd "$APP_DIR"
npm run build

echo "Restarting the application..."
bash "$APP_DIR/deploy.sh"

echo "URL updates complete! Your application authentication should now work with HTTPS." 