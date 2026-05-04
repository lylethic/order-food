import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Route groups ──────────────────────────────────────────────────────────────

/** Accessible without any login (CUSTOMER & GUEST) */
const publicPaths = ['/menu', '/status', '/scan'];

/** Login / register — redirect logged-in users away */
const authPaths = ['/login', '/register'];

/** Only CHEF or ADMIN */
const chefPaths = ['/kitchen'];

/** Only EMPLOYEE or ADMIN */
const employeePaths = ['/server', '/orders'];

/** Only ADMIN */
const adminPaths = ['/admin'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Resolve the landing page for a given role cookie value. */
function homePath(role: string): string {
  const r = role.toUpperCase();
  if (r === 'ADMIN') return '/admin/categories';
  if (r === 'CHEF') return '/kitchen';
  if (r === 'EMPLOYEE') return '/server';
  return '/menu';
}

// ── Middleware logic (exported so middleware.ts can re-export) ─────────────────

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get('sessionToken')?.value;
  // Role is stored as a single uppercase string in the cookie (e.g. "ADMIN")
  const role = (request.cookies.get('role')?.value ?? '').toUpperCase();

  const isAdmin    = role === 'ADMIN';
  const isChef     = role === 'CHEF';
  const isEmployee = role === 'EMPLOYEE';

  // 1. Logged-in user hitting /login or /register → send to their home
  if (sessionToken && matchesPath(pathname, authPaths)) {
    return NextResponse.redirect(new URL(homePath(role), request.url));
  }

  // 2. Public pages (/menu, /status, /scan) — always allow
  if (matchesPath(pathname, publicPaths)) {
    return NextResponse.next();
  }

  // 3. Auth pages — allow unauthenticated
  if (matchesPath(pathname, authPaths)) {
    return NextResponse.next();
  }

  // 4. Everything else requires a valid session
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. /admin/* — ADMIN only
  if (matchesPath(pathname, adminPaths) && !isAdmin) {
    return NextResponse.redirect(new URL(homePath(role), request.url));
  }

  // 6. /kitchen — CHEF or ADMIN only
  if (matchesPath(pathname, chefPaths) && !isChef && !isAdmin) {
    return NextResponse.redirect(new URL(homePath(role), request.url));
  }

  // 7. /server, /orders — EMPLOYEE or ADMIN only
  if (matchesPath(pathname, employeePaths) && !isEmployee && !isAdmin) {
    return NextResponse.redirect(new URL(homePath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
};
