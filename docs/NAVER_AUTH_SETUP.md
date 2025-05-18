# Naver OAuth Setup Guide

This guide explains how to set up Naver OAuth for your application. Currently, Naver is not natively supported by Supabase, but this guide provides instructions for when it becomes available or for custom implementation.

## 1. Register Your Application on Naver Developers

1. Go to [Naver Developers](https://developers.naver.com/) and sign in with your Naver account.
2. Create a new application by navigating to "Applications" > "Register Application".
3. Fill in the required information:
   - Application Name: Your application name
   - Service URL: Your website URL
   - Environment: Web or Mobile

## 2. Configure Naver OAuth

1. In your Naver Developers application settings, go to "API Settings" > "Login with Naver".
2. Enable Naver Login.
3. Configure the following settings:
   - **Callback URL**: Set this to your callback URL, e.g., `https://your-domain.com/auth/callback`
   - **Service URL**: Your service's main URL
   - **Authorization Type**: Choose as needed for your app

## 3. Get Your API Keys

1. In the Naver Developers dashboard, note down the following keys:
   - **Client ID**: This will be your application identifier
   - **Client Secret**: Your application secret key

## 4. Future Integration with Supabase

As of this writing, Naver is not natively supported by Supabase OAuth. Here are your options:

### Option 1: Wait for Official Support

Supabase may add Naver support in future updates. Check the Supabase documentation for updates.

### Option 2: Custom Implementation

For custom implementation, you'll need to:

1. Use the Naver Login JavaScript SDK directly
2. Implement a custom authentication flow
3. Generate a JWT or use session cookies
4. Connect to your backend system

## Custom Implementation Example (Draft)

Here's a draft example of using Naver SDK directly:

```javascript
// 1. Include the Naver Login SDK
// <script src="https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js"></script>

// 2. Initialize Naver Login
const naverLogin = new naver.LoginWithNaverId({
  clientId: "YOUR_CLIENT_ID",
  callbackUrl: "YOUR_CALLBACK_URL",
  isPopup: false,
  loginButton: {color: "green", type: 3, height: 60}
});

// 3. Initialize
naverLogin.init();

// 4. Get callback response
window.addEventListener('load', function () {
  naverLogin.getLoginStatus(function (status) {
    if (status) {
      // Get user info
      const email = naverLogin.user.getEmail();
      const name = naverLogin.user.getName();
      
      // Send to your backend/Supabase
      // ...
    }
  });
});
```

## Integration with Your Current Authentication System

When Naver OAuth becomes available or when implementing custom solution:

1. Create a helper function to handle Naver authentication
2. Update your auth context to recognize Naver as a provider
3. Create appropriate callback handlers
4. Update your UI to include the Naver login button

## Troubleshooting

### Common Issues:

1. **Callback URL Mismatch**: Ensure the callback URL is exactly the same as configured
2. **CORS Issues**: May occur during development on localhost
3. **API Access**: Make sure you have the correct permissions enabled

## Additional Resources

- [Naver Developers Documentation](https://developers.naver.com/docs/login/api/)
- [Naver Login JavaScript SDK](https://developers.naver.com/docs/login/sdks/) 