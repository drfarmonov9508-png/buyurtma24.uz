import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/superadmin/login', '/menu'];
const ROLE_ROUTES: Record<string, string[]> = {
  superadmin: ['/superadmin'],
  cafe_admin: ['/admin'],
  manager: ['/manager'],
  cashier: ['/cashier'],
  waiter: ['/waiter'],
  kitchen: ['/kitchen'],
  client: ['/client', '/menu'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api')) return NextResponse.next();

  const token = request.cookies.get('accessToken')?.value;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname === '/') return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
};
