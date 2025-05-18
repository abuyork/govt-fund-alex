/**
 * Google OAuth Configuration and Helper Functions
 * 
 * This file contains utility functions for working with Google OAuth
 * To use Google OAuth, you need to:
 * 
 * 1. Set up a project in Google Cloud Console
 * 2. Configure OAuth consent screen
 * 3. Create OAuth client ID credentials for Web application
 * 4. Configure authorized redirect URIs
 * 5. Configure Supabase to use Google as an OAuth provider
 */

import { supabase, authOptions } from './supabase';
import { Provider } from '@supabase/supabase-js';

// Get environment variables
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const googleRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || authOptions.redirectTo;

/**
 * Initialize Google login
 */
export const signInWithGoogle = async () => {
  return supabase.auth.signInWithOAuth({
    provider: 'google' as Provider,
    options: {
      redirectTo: googleRedirectUri,
      queryParams: {
        client_id: googleClientId,
        access_type: 'offline',
        prompt: 'consent',
      }
    },
  });
};

/**
 * Check Google authentication status
 */
export const getGoogleAuthStatus = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  
  const session = data.session;
  
  if (!session) {
    return { isAuthenticated: false };
  }
  
  // Check if the user authenticated with Google
  const isGoogleUser = session.user?.app_metadata?.provider === 'google';
  
  return {
    isAuthenticated: true,
    isGoogleUser,
    user: session.user,
  };
};

/**
 * Handle Google auth callback
 */
export const handleGoogleCallback = async () => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    throw error;
  }
  
  return { session: data.session, user: data.session?.user };
}; 