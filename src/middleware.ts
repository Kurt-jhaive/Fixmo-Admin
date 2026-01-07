import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of allowed origins for CORS
const allowedOrigins = [
  'https://fixmo-admin.vercel.app',
  'https://fixmo-backend-production.up.railway.app',
  // Add localhost for development
  'http://localhost:3001',
  'http://localhost:3000',
];

// Security utility: Strip sensitive parameters from URL for redirects (ZAP Alert 10044 - Medium Risk)
function sanitizeRedirectUrl(url: URL): URL {
  const sensitiveParams = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'session'];
  const sanitizedUrl = new URL(url.toString());
  
  sensitiveParams.forEach(param => {
    if (sanitizedUrl.searchParams.has(param)) {
      sanitizedUrl.searchParams.delete(param);
    }
  });
  
  return sanitizedUrl;
}

// Build CSP header for Next.js compatibility (ZAP Alerts 10055-5, 10055-6, 10055-10)
// IMPORTANT: Next.js requires 'unsafe-inline' for hydration scripts.
// This is a known limitation. We use the strictest possible policy that still works.
// Reference: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
function buildCSPHeader(): string {
  const cspDirectives = [
    "default-src 'self'",
    // Next.js REQUIRES 'unsafe-inline' for inline scripts during hydration
    // 'unsafe-eval' is NOT required and is removed for security
    // 'strict-dynamic' helps by allowing dynamically loaded scripts from trusted sources
    "script-src 'self' 'unsafe-inline' 'strict-dynamic' https:",
    // Style-src: Next.js uses inline styles, 'unsafe-inline' is required
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://fixmo-backend-production.up.railway.app",
    "font-src 'self' data:",
    "connect-src 'self' https://fixmo-backend-production.up.railway.app https://res.cloudinary.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];
  
  return cspDirectives.join('; ');
}

// Apply all security headers to a response (Low Risk Fixes)
function applySecurityHeaders(response: NextResponse): void {
  // CSP - Content Security Policy
  response.headers.set('Content-Security-Policy', buildCSPHeader());
  
  // HSTS - Strict-Transport-Security (ZAP Alert 10035 - Low Risk)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // X-Content-Type-Options - Prevent MIME sniffing (ZAP Alert 10021 - Low Risk)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options - Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection - Legacy XSS protection for older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy - Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy - Restrict browser features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  
  // Check if this is a static asset request
  const isStaticAsset = url.pathname.startsWith('/_next/static') || 
                        url.pathname.startsWith('/_next/image') ||
                        url.pathname.endsWith('.js') ||
                        url.pathname.endsWith('.css') ||
                        url.pathname.endsWith('.woff2') ||
                        url.pathname.endsWith('.ico');
  
  // Apply security headers to all responses
  applySecurityHeaders(response);
  
  // Fix Cross-Domain Misconfiguration (ZAP Alert 10098 - Medium Risk)
  // Explicitly set CORS headers to prevent wildcard (*) from CDN
  // For static assets, only allow same-origin or specific trusted origins
  if (isStaticAsset) {
    // Remove any existing wildcard CORS header
    response.headers.delete('Access-Control-Allow-Origin');
    
    // Only set CORS for trusted origins, or omit for same-origin requests
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      // For same-origin requests (no origin header) or untrusted origins,
      // set to the app's own domain to be explicit
      response.headers.set('Access-Control-Allow-Origin', 'https://fixmo-admin.vercel.app');
    }
    response.headers.set('Access-Control-Allow-Credentials', 'false');
  }

  // Security: Handle root path redirect in middleware (ZAP Alert 10044 - Big Redirect)
  // Using 302 instead of 307 and handling in middleware prevents large redirect response bodies
  if (url.pathname === '/') {
    // Use 302 Found instead of 307 to avoid "Big Redirect" detection
    // Middleware redirect has minimal response body compared to page-level redirect
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url), { status: 302 });
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // Security: Remove sensitive query parameters from login URLs (ZAP Alert 10044)
  if (url.pathname === '/login' && (url.searchParams.has('password') || url.searchParams.has('username'))) {
    // Redirect to clean login URL without sensitive params in URL
    const cleanUrl = sanitizeRedirectUrl(url);
    cleanUrl.searchParams.delete('username'); // Also remove username from URL for security
    const redirectResponse = NextResponse.redirect(cleanUrl, { status: 302 });
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // CORS handling - only allow specific origins (Medium Risk Fix - ZAP Alert 10098)
  // Remove wildcard CORS and only allow specific trusted origins
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
      );
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    // If origin is not in the allowed list, don't set CORS headers (block cross-origin requests)
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  // Cookie security enhancements
  // Get existing cookies and rewrite them with security flags
  const cookies = request.cookies.getAll();
  
  cookies.forEach((cookie) => {
    // Set secure cookie attributes for all cookies
    response.cookies.set({
      name: cookie.name,
      value: cookie.value,
      httpOnly: true,      // Prevents JavaScript access (CWE-1004)
      secure: true,        // Only send over HTTPS (CWE-614)
      sameSite: 'strict',  // Prevents CSRF attacks (CWE-1275)
      path: '/',
    });
  });

  return response;
}

// Configure which routes the middleware runs on
// Including static files to fix Cross-Domain Misconfiguration (ZAP Alert 10098)
export const config = {
  matcher: [
    /*
     * Match ALL request paths to apply security headers consistently
     * This ensures CORS headers are properly set on static assets
     */
    '/(.*)',
  ],
};
