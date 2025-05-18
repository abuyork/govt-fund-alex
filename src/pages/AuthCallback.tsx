import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { handleKakaoCallback } from '../services/kakaoAuth';
import { handleGoogleCallback } from '../services/googleAuth';
import { handleNaverCallback } from '../services/naverAuth';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);
        // Get URL params to check the provider and if it's a reset password flow
        const url = new URL(window.location.href);
        const provider = url.searchParams.get('provider');
        const isResetPassword = url.searchParams.get('reset') === 'true';
        
        // Check if this is a password reset request
        if (isResetPassword) {
          // Extract hash parameters (access_token, etc.) from the URL
          const hashParams = window.location.hash;
          // Redirect to the reset password page with the hash parameters
          navigate(`/reset-password${hashParams}`, { replace: true });
          return;
        }
        
        let session = null;
        let callbackError: Error | null = null;
        
        // Handle provider-specific callbacks
        switch (provider) {
          case 'kakao':
            try {
              const result = await handleKakaoCallback();
              session = result.session;
            } catch (err) {
              callbackError = err instanceof Error ? err : new Error('Unknown error');
            }
            break;
          case 'google':
            try {
              const result = await handleGoogleCallback();
              session = result.session;
            } catch (err) {
              callbackError = err instanceof Error ? err : new Error('Unknown error');
            }
            break;
          case 'naver':
            try {
              const result = await handleNaverCallback();
              session = result.session;
            } catch (err) {
              callbackError = err instanceof Error ? err : new Error('Unknown error');
            }
            break;
          default:
            // Handle standard OAuth callback for other providers
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              callbackError = new Error(error.message);
            } else {
              session = data.session;
            }
        }
        
        if (callbackError) {
          setError(callbackError.message || 'Authentication error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (session) {
          // Successfully authenticated
          navigate('/dashboard');
          return;
        }
        
        // If we get here, no valid session was found
        setError('Unable to complete authentication');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        console.error('Error during auth callback:', err);
        setError('An unexpected error occurred during authentication');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        {error ? (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
            <p className="mt-2 text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        ) : loading ? (
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold">Completing authentication...</h2>
            <p className="mt-2 text-sm text-gray-500">Please wait while we verify your credentials.</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-green-600">Authentication successful!</h2>
            <p className="mt-2 text-sm text-gray-500">Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
} 