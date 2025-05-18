import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
};

// Create and export the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Real authentication functions
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
      }
      
      return { error };
    } catch (err) {
      console.error('Error during sign in:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Get the server domain from environment variables or use the default
      const redirectUrl = import.meta.env.VITE_SERVER_DOMAIN 
        ? `${import.meta.env.VITE_SERVER_DOMAIN}/auth/callback` 
        : 'https://kvzd.info/auth/callback';
        
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      return { error };
    } catch (err) {
      console.error('Error during sign up:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Get the server domain from environment variables or use the default
      // Use the auth/callback endpoint which is properly set up for handling Supabase auth flows
      const redirectUrl = import.meta.env.VITE_SERVER_DOMAIN 
        ? `${import.meta.env.VITE_SERVER_DOMAIN}/auth/callback?reset=true` 
        : 'https://kvzd.info/auth/callback?reset=true';
        
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      return { error };
    } catch (err) {
      console.error('Error during password reset:', err);
      return { error: err };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ 
        password 
      });
      
      return { error };
    } catch (err) {
      console.error('Error updating password:', err);
      return { error: err };
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 