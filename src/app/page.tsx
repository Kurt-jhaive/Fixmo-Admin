// Root page - redirect is handled by middleware for security (ZAP Alert 10044)
// This page should never be rendered as middleware redirects to /login first
// Keeping minimal content to prevent information disclosure

export default function Home() {
  return null;
}
