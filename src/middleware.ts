import { NextRequest, NextResponse } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/chain', '/ports', '/api-settings'];

// Public paths we don't want to handle with middleware
const bypassPaths = [
  '/',  // Skip root path entirely - client side will handle
  '/api', 
  '/login', // Skip login path entirely - avoid loops
  '/signup', 
  '/_next', 
  '/favicon.ico'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for paths we want to bypass (including root and login)
  if (bypassPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For protected paths, check for Firebase cookies
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    // Check for Firebase auth cookies - this is a simplified check
    // NextJS middleware can't fully validate Firebase tokens, so we do a basic cookie presence check
    const hasCookies = request.cookies.getAll().some(cookie => 
      cookie.name.includes('firebase') || cookie.name.startsWith('firebaseAuth')
    );
    
    // Get the local storage auth info from cookie (this is our fallback)
    const localAuthCookie = request.cookies.get('localAuth');

    if (!hasCookies && !localAuthCookie) {
      // Redirect to login with the intended path
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}; 