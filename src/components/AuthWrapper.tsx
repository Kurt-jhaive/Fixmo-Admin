'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { isTokenExpired, clearAuthAndRedirect } from '@/lib/auth-utils';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      console.log('AuthWrapper: Checking authentication...');
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      console.log('AuthWrapper: Token found =', !!token);
      
      // Check if token exists and is not expired
      if (!token || isTokenExpired(token)) {
        console.log('AuthWrapper: No token or token expired, redirecting to login...');
        setIsAuthenticated(false);
        // Clear auth data but don't redirect here
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/login');
        return;
      }
      
      // Token exists and is valid
      console.log('AuthWrapper: Token is valid, user authenticated');
      setIsAuthenticated(true);
    };

    checkAuth();

    // Set up periodic token validation (every 2 minutes)
    const interval = setInterval(() => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      if (!token || isTokenExpired(token)) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/login');
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
