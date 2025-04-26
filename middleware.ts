import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  // Get the "user" cookie from the request
  const userCookie = request.cookies.get('user');
  // User is logged in if the cookie exists
  const isLoggedIn = userCookie !== undefined;

  // Get the current pathname from the request URL
  const pathname = request.nextUrl.pathname;

  // Logged-in users cannot access /auth or its subpages
  if (isLoggedIn && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Not logged-in users can only access /auth or its subpages
  if (!isLoggedIn && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Allow the request to proceed for all other cases
  return NextResponse.next();
}

// Configure middleware to run only on page requests
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};