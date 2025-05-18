/**
 * Kakao OAuth Configuration and Helper Functions
 * 
 * This file contains utility functions for working with Kakao OAuth
 * To use Kakao OAuth, you need to:
 * 
 * 1. Register your app at https://developers.kakao.com/
 * 2. Set up the following in your Kakao Developer console:
 *    - Add your domain to "Allowed Redirect URIs"
 *    - Configure "Login Redirect URI" to point to your callback URL: 
 *      e.g., https://your-domain.com/auth/callback
 * 3. Configure Supabase to use Kakao as an OAuth provider
 *    - In Supabase dashboard: Authentication > Providers > Kakao
 *    - Enter your Kakao REST API key as the Client ID
 *    - Enter your Kakao Client Secret
 *    - Set the Redirect URL to match your callback URL
 */

import { supabase, authOptions } from './supabase';
import { Provider } from '@supabase/supabase-js';

// Get environment variables
const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID ;
const kakaoRedirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI || authOptions.redirectTo;

/**
 * Initialize Kakao login
 * This function assumes Supabase is already configured to use Kakao OAuth
 */
export const signInWithKakao = async () => {
  return supabase.auth.signInWithOAuth({
    provider: 'kakao' as Provider,
    options: {
      redirectTo: kakaoRedirectUri,
      scopes: 'profile_nickname,account_email',
      queryParams: {
        client_id: kakaoClientId,
      }
    },
  });
};

/**
 * Check Kakao authentication status
 */
export const getKakaoAuthStatus = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  
  const session = data.session;
  
  if (!session) {
    return { isAuthenticated: false };
  }
  
  // Check if the user authenticated with Kakao
  const isKakaoUser = session.user?.app_metadata?.provider === 'kakao';
  
  return {
    isAuthenticated: true,
    isKakaoUser,
    user: session.user,
  };
};

/**
 * Handle Kakao auth callback
 * This should be called from the callback page
 */
export const handleKakaoCallback = async () => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    throw error;
  }
  
  return { session: data.session, user: data.session?.user };
}; 