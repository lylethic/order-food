import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE_NAMES = ['accessToken', 'accessTokenExpiresAt', 'refreshToken', 'role'];

function clearAuthCookies(res: NextResponse) {
  for (const name of COOKIE_NAMES) {
    res.cookies.set({ name, value: '', path: '/', maxAge: 0 });
  }
  return res;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const force = body.force as boolean | undefined;

  if (force) {
    return clearAuthCookies(
      NextResponse.json({ message: 'Buộc đăng xuất thành công' }, { status: 200 }),
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken');
  const refreshToken = cookieStore.get('refreshToken');

  if (!accessToken) {
    return clearAuthCookies(
      NextResponse.json({ message: 'Không nhận được access token' }, { status: 200 }),
    );
  }

  // Tell the Express backend to revoke the refresh token
  if (refreshToken) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshToken.value }),
      });
    } catch {
      // Even if backend call fails, clear cookies locally
    }
  }

  return clearAuthCookies(
    NextResponse.json({ message: 'Đăng xuất thành công' }, { status: 200 }),
  );
}
