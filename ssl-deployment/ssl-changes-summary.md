# SSL Configuration Changes for kvzd.info

This document summarizes all the changes made to enable HTTPS for the kvzd.info domain.

## Environment Variables

Updated in `.env`:
- Changed `VITE_SERVER_DOMAIN` from `http://165.22.244.88` to `https://kvzd.info`
- Updated all redirect URIs to use `https://kvzd.info/auth/callback`:
  - `VITE_KAKAO_REDIRECT_URI`
  - `VITE_GOOGLE_REDIRECT_URI`
  - `VITE_NAVER_REDIRECT_URI`

## Server Configuration

Updated in `server.js`:
- Changed CORS configuration to use `https://kvzd.info` instead of the IP address
- Updated console log messages to show the correct production URL

## Authentication Services

Updated in `src/services/supabase.ts`:
- Changed default redirect URL from `http://165.22.244.88/auth/callback` to `https://kvzd.info/auth/callback`

## Deployment Script

Updated in `deploy.sh`:
- Changed the application URL displayed after deployment from `http://165.22.244.88` to `https://kvzd.info`

## SSL Setup Scripts

We've prepared the following scripts for setting up SSL on your server:

1. `setup-ssl.sh`: Install and configure Nginx with Let's Encrypt SSL
2. `update-auth-urls.sh`: Update authentication URLs to use HTTPS
3. `verify-ssl.sh`: Verify that SSL is correctly configured
4. `ssl-setup-guide.md`: Step-by-step guide for the entire process

## Next Steps

1. **Upload these files to your server**:
   ```bash
   scp -r ssl-deployment/* user@165.22.244.88:~/govt-fund-ai/
   ```

2. **Connect to your server**:
   ```bash
   ssh user@165.22.244.88
   ```

3. **Run the SSL setup script**:
   ```bash
   cd ~/govt-fund-ai
   bash setup-ssl.sh
   ```

4. **Update OAuth provider settings in Supabase Dashboard**:
   - Set Site URL to: `https://kvzd.info`
   - Set Redirect URLs to include: `https://kvzd.info/auth/callback`

5. **Update OAuth provider settings in Kakao Developer Console**:
   - Set Redirect URI to: `https://kvzd.info/auth/callback`

6. **Update OAuth provider settings in Google Developer Console** (if using):
   - Set Authorized redirect URI to: `https://kvzd.info/auth/callback`

7. **Verify the SSL setup**:
   ```bash
   bash verify-ssl.sh
   ```

## Troubleshooting

If you encounter any issues, refer to the `ssl-setup-guide.md` file for troubleshooting tips. 