import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gykujxuuemhcxsqeejmj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_PUBLIC_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3VqeHV1ZW1oY3hzcWVlam1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwODM2NjYsImV4cCI6MjA1OTY1OTY2Nn0.TnYPRUqdL8_O5yobK13HWWWpffM5tYcx4H2f9k0EeR8';

// Use default configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configure global options for auth operations
// This is used when calling signInWithOAuth directly
export const authOptions = {
  redirectTo: import.meta.env.VITE_SERVER_DOMAIN 
    ? `${import.meta.env.VITE_SERVER_DOMAIN}/auth/callback` 
    : 'https://kvzd.info/auth/callback'
}; 