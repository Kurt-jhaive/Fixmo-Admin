/**
 * Authentication utility functions
 */

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;

  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration time
    if (!payload.exp) return true;

    // Convert exp from seconds to milliseconds and compare with current time
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If we can't decode it, consider it expired
  }
}

/**
 * Clear authentication data and redirect to login
 */
export function clearAuthAndRedirect(): void {
  // Clear all authentication related data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  
  // Redirect to login page
  window.location.href = '/login';
}

/**
 * Get token from localStorage with expiration check
 */
export function getValidToken(): string | null {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  
  if (!token || isTokenExpired(token)) {
    clearAuthAndRedirect();
    return null;
  }
  
  return token;
}
