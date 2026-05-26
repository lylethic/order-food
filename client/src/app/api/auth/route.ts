import { NextResponse } from 'next/server';

const SECURE = process.env.NODE_ENV === 'production';

export async function POST(request: Request) {
  const body = await request.json();

  const accessToken = (body.token ?? body.accessToken) as string;
  const refreshToken = body.refreshToken as string | undefined;
  const expiresAt = body.expiresAt as string | undefined;
  const refreshTokenExpiresAt = body.refreshTokenExpiresAt as
    | string
    | undefined;
  const rawRole = body.role;
  const role = (
    Array.isArray(rawRole) ? String(rawRole[0] ?? '') : String(rawRole ?? '')
  ).toUpperCase();

  if (!accessToken) {
    return NextResponse.json(
      { message: 'Could not authenticate user' },
      { status: 400 },
    );
  }

  // 60m
  const accessExpires =
    expiresAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // 7d
  const refreshExpires =
    refreshTokenExpiresAt ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const res = NextResponse.json(body, { status: 200 });

  // Access token — NOT httpOnly so the browser JS can read it for Authorization header
  res.cookies.set({
    name: 'accessToken',
    value: accessToken,
    httpOnly: false,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    expires: new Date(accessExpires),
  });

  // Expiry timestamp — readable by JS and middleware
  res.cookies.set({
    name: 'accessTokenExpiresAt',
    value: accessExpires,
    httpOnly: false,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    expires: new Date(accessExpires),
  });

  // Role — readable by JS for client-side routing
  res.cookies.set({
    name: 'role',
    value: role,
    httpOnly: false,
    secure: SECURE,
    sameSite: 'lax',
    path: '/',
    expires: new Date(accessExpires),
  });

  // Refresh token — httpOnly, only Next.js server can read it
  if (refreshToken) {
    res.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: SECURE,
      sameSite: 'lax',
      path: '/',
      expires: new Date(refreshExpires),
    });
  }

  return res;
}
