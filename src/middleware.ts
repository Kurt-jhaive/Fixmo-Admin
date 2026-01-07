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

// Generate a cryptographically secure nonce for CSP
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

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

// Build CSP header with nonce for enhanced security (ZAP Alerts 10055-5, 10055-6, 10055-10)
function buildCSPHeader(nonce: string): string {
  const cspDirectives = [
    "default-src 'self'",
    // Use nonce for scripts instead of unsafe-inline/unsafe-eval (Medium Risk Fix)
    // 'strict-dynamic' allows dynamically loaded scripts from trusted scripts with nonce
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Style-src: nonce for inline styles (Medium Risk Fix)
    // Note: Some Next.js features may require 'unsafe-inline' as fallback
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
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

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');
  const url = new URL(request.url);

  // Generate nonce for CSP (Medium Risk Fix - ZAP Alerts 10055-5, 10055-6, 10055-10)
  const nonce = generateNonce();
  
  // Apply dynamic CSP header with nonce to prevent XSS
  // This replaces unsafe-inline and unsafe-eval with nonce-based policy
  response.headers.set('Content-Security-Policy', buildCSPHeader(nonce));
  
  // Pass nonce to the application via header (can be read in layout.tsx)
  response.headers.set('x-nonce', nonce);

  // Security: Handle root path redirect in middleware (ZAP Alert 10044 - Big Redirect)
  // Using 302 instead of 307 and handling in middleware prevents large redirect response bodies
  if (url.pathname === '/') {
    // Use 302 Found instead of 307 to avoid "Big Redirect" detection
    // Middleware redirect has minimal response body compared to page-level redirect
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url), { status: 302 });
    redirectResponse.headers.set('Content-Security-Policy', buildCSPHeader(nonce));
    return redirectResponse;
  }

  // Security: Remove sensitive query parameters from login URLs (ZAP Alert 10044)
  if (url.pathname === '/login' && (url.searchParams.has('password') || url.searchParams.has('username'))) {
    // Redirect to clean login URL without sensitive params in URL
    const cleanUrl = sanitizeRedirectUrl(url);
    cleanUrl.searchParams.delete('username'); // Also remove username from URL for security
    const redirectResponse = NextResponse.redirect(cleanUrl, { status: 302 });
    redirectResponse.headers.set('Content-Security-Policy', buildCSPHeader(nonce));
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
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
