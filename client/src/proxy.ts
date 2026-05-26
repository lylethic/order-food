import { NextRequest, NextResponse } from 'next/server';

// ── Route groups ──────────────────────────────────────────────────────────────

const publicPaths = ['/menu', '/status', '/scan'];
const authPaths = ['/login', '/register'];
const chefPaths = ['/kitchen'];
const employeePaths = ['/server', '/orders'];
const adminPaths = ['/admin'];

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const SECURE = process.env.NODE_ENV === 'production';

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function homePath(role: string): string {
  const r = role.toUpperCase();
  if (r === 'ADMIN') return '/admin/categories';
  if (r === 'CHEF') return '/kitchen';
  if (r === 'EMPLOYEE') return '/server';
  return '/menu';
}

async function tryRefresh(
  refreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
} | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/v1/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

function applyTokenCookies(
  response: NextResponse,
  accessToken: string,
  newRefreshToken: string | undefined,
  expiresIn: number,
) {
  const accessExpires = new Date(Date.now() + expiresIn * 1000);
  const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  response.cookies.set({
    name: 'accessToken',
    value: accessToken,
    httpOnly: false,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    expires: accessExpires,
  });
  response.cookies.set({
    name: 'accessTokenExpiresAt',
    value: accessExpires.toISOString(),
    httpOnly: false,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    expires: accessExpires,
  });
  if (newRefreshToken) {
    response.cookies.set({
      name: 'refreshToken',
      value: newRefreshToken,
      httpOnly: true,
      secure: SECURE,
      sameSite: 'lax',
      path: '/',
      expires: refreshExpires,
    });
  }
}

function clearAuthCookies(response: NextResponse) {
  for (const name of [
    'accessToken',
    'accessTokenExpiresAt',
    'refreshToken',
    'role',
  ]) {
    response.cookies.set({ name, value: '', path: '/', maxAge: 0 });
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('accessToken')?.value;
  const accessTokenExpiresAt = request.cookies.get(
    'accessTokenExpiresAt',
  )?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const role = (request.cookies.get('role')?.value ?? '').toUpperCase();

  const isAdmin = role === 'ADMIN';
  const isChef = role === 'CHEF';
  const isEmployee = role === 'EMPLOYEE';

  // ── Proactive token refresh ────────────────────────────────────────────────
  // Run before routing so the refreshed token is available immediately.
  if (accessToken && accessTokenExpiresAt && refreshToken) {
    const remaining = new Date(accessTokenExpiresAt).getTime() - Date.now();

    if (remaining < REFRESH_THRESHOLD_MS) {
      const refreshed = await tryRefresh(refreshToken);

      if (refreshed?.accessToken) {
        // Continue with the request and set fresh cookies on the response
        const response = routingDecision(
          pathname,
          !!accessToken,
          role,
          isAdmin,
          isChef,
          isEmployee,
          request,
        );
        applyTokenCookies(
          response,
          refreshed.accessToken,
          refreshed.refreshToken,
          refreshed.expiresIn ?? 900,
        );
        return response;
      } else {
        // Refresh failed — clear session and send to login
        const loginUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(loginUrl);
        clearAuthCookies(response);
        return response;
      }
    }
  }

  // ── Normal routing ─────────────────────────────────────────────────────────
  return routingDecision(
    pathname,
    !!accessToken,
    role,
    isAdmin,
    isChef,
    isEmployee,
    request,
  );
}

function routingDecision(
  pathname: string,
  hasToken: boolean,
  role: string,
  isAdmin: boolean,
  isChef: boolean,
  isEmployee: boolean,
  request: NextRequest,
): NextResponse {
  // Logged-in user on login/register → redirect to their home
  if (hasToken && matchesPath(pathname, authPaths)) {
    return NextResponse.redirect(new URL(homePath(role), request.url));
  }

  // Public pages — always allow
  if (matchesPath(pathname, publicPaths)) return NextResponse.next();

  // Auth pages — allow unauthenticated
  if (matchesPath(pathname, authPaths)) return NextResponse.next();

  // Everything else requires a valid session
  if (!hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based guards
  if (matchesPath(pathname, adminPaths) && !isAdmin) {
    return NextResponse.redirect(new URL(homePath(role), request.url));
  }
  if (matchesPath(pathname, chefPaths) && !isChef && !isAdmin) {
    return NextResponse.redirect(new URL(homePath(role), request.url));
  }
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
