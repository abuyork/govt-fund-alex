#!/bin/bash

# Script to verify SSL setup and test authentication URLs
# Run this script after completing SSL setup and URL updates

# Exit on any error
set -e

# Set your domain name - replace with your actual domain
DOMAIN_NAME="kvzd.info"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "======================================================================"
echo "              SSL and Authentication Verification Tool                "
echo "======================================================================"

# Check if domain resolves to the correct IP
echo -n "Checking DNS for $DOMAIN_NAME... "
SERVER_IP=$(dig +short $DOMAIN_NAME)
EXPECTED_IP="165.22.244.88"

if [[ "$SERVER_IP" == "$EXPECTED_IP" ]]; then
  echo -e "${GREEN}✓ DNS is correctly configured to $SERVER_IP${NC}"
else
  echo -e "${RED}✗ DNS issue: $DOMAIN_NAME resolves to $SERVER_IP, expected $EXPECTED_IP${NC}"
fi

# Check if HTTPS is working
echo -n "Checking HTTPS for $DOMAIN_NAME... "
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN_NAME | grep -q "200\|301\|302"; then
  echo -e "${GREEN}✓ HTTPS is working${NC}"
else
  echo -e "${RED}✗ HTTPS issue: cannot connect to https://$DOMAIN_NAME${NC}"
fi

# Check SSL certificate
echo -n "Checking SSL certificate for $DOMAIN_NAME... "
if echo | openssl s_client -servername $DOMAIN_NAME -connect $DOMAIN_NAME:443 2>/dev/null | openssl x509 -noout -dates | grep -q "notAfter"; then
  EXPIRY=$(echo | openssl s_client -servername $DOMAIN_NAME -connect $DOMAIN_NAME:443 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d'=' -f2)
  echo -e "${GREEN}✓ SSL certificate is valid until $EXPIRY${NC}"
else
  echo -e "${RED}✗ SSL certificate issue: could not validate certificate${NC}"
fi

# Check authentication callback URL
echo -n "Checking authentication callback URL... "
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN_NAME/auth/callback | grep -q "200\|301\|302"; then
  echo -e "${GREEN}✓ Authentication callback URL is accessible${NC}"
else
  echo -e "${RED}✗ Authentication callback URL issue: cannot access https://$DOMAIN_NAME/auth/callback${NC}"
fi

# Check if .env file has been updated
echo -n "Checking .env file configuration... "
if grep -q "VITE_SERVER_DOMAIN=https://$DOMAIN_NAME" .env && grep -q "VITE_KAKAO_REDIRECT_URI=https://$DOMAIN_NAME/auth/callback" .env; then
  echo -e "${GREEN}✓ .env file has been updated with HTTPS URLs${NC}"
else
  echo -e "${RED}✗ .env file issue: HTTPS URLs are not properly configured${NC}"
fi

echo "======================================================================"
echo -e "${YELLOW}Manual OAuth provider verification:${NC}"
echo "1. Supabase Dashboard → Authentication → URL Configuration"
echo "   - Site URL should be: https://$DOMAIN_NAME"
echo "   - Redirect URLs should include: https://$DOMAIN_NAME/auth/callback"
echo ""
echo "2. Kakao Developer Console:"
echo "   - Redirect URI should be: https://$DOMAIN_NAME/auth/callback"
echo ""
echo "3. Google Developer Console:"
echo "   - Authorized redirect URI should be: https://$DOMAIN_NAME/auth/callback"
echo ""
echo "4. Naver Developer Console (if using):"
echo "   - Callback URL should be: https://$DOMAIN_NAME/auth/callback"
echo "======================================================================"

# Try to login (manual step)
echo -e "${YELLOW}Next steps for manual testing:${NC}"
echo "1. Visit https://$DOMAIN_NAME/login and try to log in"
echo "2. Test both email/password authentication and social logins"
echo "3. Check application logs if there are issues:"
echo "   tail -f ~/govt-fund-ai/server.log"
echo "======================================================================" 