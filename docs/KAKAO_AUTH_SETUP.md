# Kakao OAuth Setup Guide

This guide will help you set up Kakao OAuth for your application using Supabase and the Kakao Developers platform.

## 1. Register Your Application on Kakao Developers

1. Go to [Kakao Developers](https://developers.kakao.com/) and sign in with your Kakao account.
2. Create a new application by clicking on "Create New App" or "애플리케이션 추가" (Add Application).
3. Fill in the required information:
   - App Name: Your application name
   - Company: Your company name (if applicable)
   - Platform: Select "Web"

## 2. Configure Kakao OAuth

1. In your Kakao Developers application dashboard, go to "Product Settings" > "Kakao Login".
2. Enable Kakao Login by turning on the toggle switch.
3. Configure the following settings:
   - **Redirect URI**: Set this to your callback URL, e.g., `https://your-domain.com/auth/callback`
   - **Consent Items**: Configure the user data you want to access (e.g., profile, email)
   - **Login Authorization Level**: Choose between "Client" and "Full Authorization" as needed

## 3. Get Your API Keys

1. In the Kakao Developers dashboard, go to the "Summary" tab.
2. Note down the following keys:
   - **REST API Key**: This will be used as your "Client ID" in Supabase
   - **Client Secret**: You may need to enable and generate this in the settings

## 4. Configure Supabase for Kakao OAuth

1. Log in to your Supabase dashboard and navigate to your project.
2. Go to "Authentication" > "Providers" > "Kakao".
3. Enable Kakao authentication by toggling it on.
4. Enter the following details:
   - **Client ID**: Your Kakao REST API Key
   - **Client Secret**: Your Kakao Client Secret (if you enabled it)
   - **Redirect URL**: The same callback URL you configured in Kakao Developers (e.g., `https://your-domain.com/auth/callback`)
5. Save the changes.

## 5. Update Your Application

Make sure your application code is properly configured to work with Kakao login:

1. The Supabase client should be correctly initialized with your Supabase URL and anon key.
2. Use the `signInWithOAuth` method with the provider set to `'kakao'`.
3. Ensure your callback handler at `/auth/callback` correctly processes the authentication response.

## Testing Your Integration

1. Navigate to your login page and click the Kakao login button.
2. You should be redirected to Kakao for authentication.
3. After successful authentication, you should be redirected back to your application at the callback URL.
4. The application should then verify the authentication and log you in.

## Troubleshooting

### Common Issues:

1. **Redirect URI Mismatch**: Ensure the redirect URI is exactly the same in both Kakao Developers and Supabase.
2. **Missing Permissions**: Make sure you've enabled all the necessary permissions in Kakao Developers.
3. **Incorrect API Keys**: Double-check your REST API Key and Client Secret.
4. **CORS Issues**: If testing locally, you might encounter CORS issues. Consider using a proper domain even for development.

### Debugging:

1. Check browser console for errors
2. Verify that the callback URL is correct and handling the responses properly
3. Make sure your Supabase configuration allows third-party authentication

## Additional Resources

- [Kakao Developers Documentation](https://developers.kakao.com/docs/latest/en/kakaologin/common)
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth) 