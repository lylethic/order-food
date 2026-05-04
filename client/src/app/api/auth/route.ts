import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const sessionToken = body.sessionToken as string;
  const expiresAt = body.expiresAt as string;
  // role can arrive as a string or array — normalise to a single uppercase string
  const rawRole = body.role;
  const role = (
    Array.isArray(rawRole) ? String(rawRole[0] ?? '') : String(rawRole ?? '')
  ).toUpperCase();

  if (!sessionToken) {
    return NextResponse.json(
      { message: 'Could not authenticate user' },
      { status: 400 },
    );
  }

  // Use a safe expiry fallback if expiresAt is missing/invalid
  const expires = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 86_400_000);

  const res = NextResponse.json(body, { status: 200 });

  res.cookies.set({
    name: 'sessionToken',
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });

  res.cookies.set({
    name: 'role',
    value: role,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });

  if (expiresAt) {
    res.cookies.set({
      name: 'expiresAt',
      value: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires,
    });
  }

  return res;
}
