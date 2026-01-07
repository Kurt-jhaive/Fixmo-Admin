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

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');

  // Security: Remove sensitive query parameters from login URLs (ZAP Alert 10044)
  const url = new URL(request.url);
  if (url.pathname === '/login' && (url.searchParams.has('password') || url.searchParams.has('username'))) {
    // Redirect to clean login URL without sensitive params in URL
    const cleanUrl = sanitizeRedirectUrl(url);
    cleanUrl.searchParams.delete('username'); // Also remove username from URL for security
    return NextResponse.redirect(cleanUrl, { status: 302 });
  }

  // CORS handling - only allow specific origins
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
