import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

interface AdminProtectionWrapperProps {
  children: React.ReactNode;
}

const AdminProtectionWrapper: React.FC<AdminProtectionWrapperProps> = ({ children }) => {
  const { user } = useAuth();
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState<boolean | null>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!user) {
        setIsVerifiedAdmin(false);
        setVerificationAttempted(true);
        return;
      }

      try {
        console.log("Verifying admin access for:", user.email);

        // Explicitly check for hardcoded admin emails as a backup
        const adminEmails = ['baegofa1667@gmail.com', 'jung.jessica.g@gmail.com'];
        if (user.email && adminEmails.includes(user.email)) {
          console.log("User has an admin email address - granting access");
          
          // Also ensure their role is set to admin in database
          await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', user.id);
            
          setIsVerifiedAdmin(true);
          setVerificationAttempted(true);
          return;
        }

        // Use our custom RPC function to check admin status
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error verifying admin status:', error);
          
          // Fall back to direct query if RPC fails
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (userError) {
            console.error('Error in fallback admin check:', userError);
            setIsVerifiedAdmin(false);
            toast.error('Failed to verify admin permissions. Please try logging out and back in.');
          } else {
            const isAdmin = userData?.role === 'admin';
            setIsVerifiedAdmin(isAdmin);
            
            if (!isAdmin) {
              console.error('User is not an admin according to direct DB check');
              toast.error('You do not have admin privileges.');
            }
          }
        } else {
          // data will be a boolean indicating admin status
          setIsVerifiedAdmin(!!data);
          
          if (!data) {
            console.error('User is not an admin according to RPC check');
            toast.error('You do not have admin privileges.');
          }
        }
      } catch (error) {
        console.error('Exception during admin verification:', error);
        setIsVerifiedAdmin(false);
      } finally {
        setVerificationAttempted(true);
      }
    };

    if (user && !verificationAttempted) {
      verifyAdminAccess();
    }
  }, [user, verificationAttempted]);

  // If still verifying, show loading
  if (isVerifiedAdmin === null && !verificationAttempted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Verifying admin access...</div>
        </div>
      </div>
    );
  }

  // If not verified as admin, show access denied
  if (!isVerifiedAdmin && verificationAttempted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600">Admin Access Denied</div>
          <p className="mt-2 mb-4">You do not have permission to access the admin panel.</p>
          <p className="text-sm mb-4">If you believe this is an error, please contact support.</p>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If verified as admin, render children
  return <>{children}</>;
};

export default AdminProtectionWrapper; 