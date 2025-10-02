import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow access to public routes
  const publicRoutes = ['/onboarding', '/test', '/api'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check if user has a profile (you might want to check cookies or headers)
  const hasProfile = request.cookies.get('company-profile');
  
  // If accessing main app without profile, allow but the app will show demo mode
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};