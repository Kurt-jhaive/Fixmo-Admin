import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  outputFileTracingIncludes: {
    '/': ['./src/**/*'],
  },
  // Disable source maps in production to prevent information disclosure
  productionBrowserSourceMaps: false,
  // Disable X-Powered-By header to prevent information leakage (ZAP Alert 10037)
  poweredByHeader: false,
  // Security headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy (CSP) - Prevents XSS attacks (ZAP Alert 10038 - Medium Risk)
          // Note: Next.js requires 'unsafe-inline' for hydration. Using strict-dynamic with nonces
          // is handled in middleware.ts for dynamic CSP. This is a fallback policy.
          // Removed 'unsafe-eval' - use wasm-unsafe-eval only if WebAssembly is needed
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Remove unsafe-eval, keep unsafe-inline as fallback (nonce applied in middleware)
              // strict-dynamic allows scripts loaded by trusted scripts
              "script-src 'self' 'strict-dynamic' 'wasm-unsafe-eval'",
              // Use strict style policy - Next.js styled-jsx requires unsafe-inline but we minimize risk
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://fixmo-backend-production.up.railway.app",
              "font-src 'self' data:",
              "connect-src 'self' https://fixmo-backend-production.up.railway.app https://res.cloudinary.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
              // Report CSP violations (optional - for monitoring)
              "report-uri /api/csp-report",
            ].join('; '),
          },
          // Prevent clickjacking attacks - X-Frame-Options
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // HTTP Strict Transport Security (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable XSS filter in browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy - limit referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy - restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Cache-Control for security - prevent caching of sensitive pages
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Static assets can be cached
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        pathname: '/**',
      },
      // Backend API for user images
      {
        protocol: 'https',
        hostname: 'fixmo-backend-production.up.railway.app',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Disable image optimization for external images to avoid issues
    unoptimized: true, // This will bypass Next.js image optimization entirely
    // Allow larger images
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
  },
  // Disable strict mode that might cause issues with external resources
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
};

export default nextConfig;
