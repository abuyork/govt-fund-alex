import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

interface ProtectedAdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedAdminRoute({ 
  children, 
  redirectTo = '/dashboard'
}: ProtectedAdminRouteProps) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(true);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsCheckingRole(false);
        console.log("No user found - not logged in");
        return;
      }

      try {
        console.log("Checking admin role for user:", user.id, user.email);
        
        // First, let's run our diagnostic function to see what's in the database
        const { data: diagData, error: diagError } = await supabase
          .rpc('check_admin_access');
        
        if (diagError) {
          console.error('Diagnostic error:', diagError);
        } else {
          console.log("Diagnostic data:", diagData);
          setDiagnosticInfo(diagData);
          
          // Log this access attempt for debugging
          await supabase.rpc('log_admin_access_attempt', {
            success: diagData[0]?.is_admin || false,
            error_message: !diagData[0]?.role_exists 
              ? 'Role column missing or empty' 
              : diagData[0]?.role !== 'admin' 
                ? 'User role is not admin' 
                : null
          });
        }

        // Now proceed with the normal role check
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
          toast.error('Admin role check failed. Please contact support.', {
            id: 'admin-check-error',
          });
        } else {
          console.log("User data from DB:", data);
          const hasAdminRole = data?.role === 'admin';
          setIsAdmin(hasAdminRole);
          
          if (!hasAdminRole) {
            toast.error('You do not have admin privileges.', {
              id: 'admin-access-denied',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    if (!loading) {
      checkAdminRole();
    }
  }, [user, loading]);

  // Show loading state while checking authentication and admin role
  if (loading || isCheckingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">Loading...</div>
          <p className="mt-2 text-sm text-gray-500">Please wait while we verify your credentials.</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if authenticated but not admin
  if (!isAdmin) {
    // Display diagnostic info in dev environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin access denied. Diagnostic info:', diagnosticInfo);
    }
    
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
} 