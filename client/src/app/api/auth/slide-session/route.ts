import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SECURE = process.env.NODE_ENV === 'production';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken');

  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 200 });
  }

  try {
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/v1/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken.value }),
      },
    );

    if (!backendRes.ok) {
      // Refresh failed (expired / reuse detected) — force logout
      const res = NextResponse.json({ message: 'Session expired' }, { status: 401 });
      for (const name of ['accessToken', 'accessTokenExpiresAt', 'refreshToken', 'role']) {
        res.cookies.set({ name, value: '', path: '/', maxAge: 0 });
      }
      return res;
    }

    const json = await backendRes.json();
    const { accessToken, refreshToken: newRefreshToken, expiresIn } = json.data ?? json;

    if (!accessToken) {
      return NextResponse.json({ message: 'Invalid refresh response' }, { status: 500 });
    }

    const accessExpires = new Date(Date.now() + (expiresIn ?? 900) * 1000);
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const res = NextResponse.json(
      { accessToken, expiresAt: accessExpires.toISOString() },
      { status: 200 },
    );

    res.cookies.set({
      name: 'accessToken',
      value: accessToken,
      httpOnly: false,
      secure: SECURE,
      sameSite: 'lax',
      path: '/',
      expires: accessExpires,
    });

    res.cookies.set({
      name: 'accessTokenExpiresAt',
      value: accessExpires.toISOString(),
      httpOnly: false,
      secure: SECURE,
      sameSite: 'lax',
      path: '/',
      expires: accessExpires,
    });

    if (newRefreshToken) {
      res.cookies.set({
        name: 'refreshToken',
        value: newRefreshToken,
        httpOnly: true,
        secure: SECURE,
        sameSite: 'lax',
        path: '/',
        expires: refreshExpires,
      });
    }

    return res;
  } catch {
    return NextResponse.json({ message: 'Lỗi không xác định' }, { status: 500 });
  }
}
