import authApiRequest from '@/apiRequests/auth';
import { HttpError } from '@/lib/http';
import { cookies } from 'next/headers';

const CLEAR_COOKIES =
  'sessionToken=; Path=/; HttpOnly; Max-Age=0, ' +
  'role=; Path=/; HttpOnly; Max-Age=0, ' +
  'expiresAt=; Path=/; HttpOnly; Max-Age=0';

export async function POST(request: Request) {
  const res = await request.json();
  const force = res.force as boolean | undefined;

  if (force) {
    return Response.json(
      { message: 'Buộc đăng xuất thành công' },
      { status: 200, headers: { 'Set-Cookie': CLEAR_COOKIES } },
    );
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('sessionToken');
  if (!sessionToken) {
    return Response.json({ message: 'Không nhận được session token' }, { status: 401 });
  }

  try {
    const result = await authApiRequest.logoutFromNextServerToServer(sessionToken.value);
    return Response.json(result.payload, {
      status: 200,
      headers: { 'Set-Cookie': CLEAR_COOKIES },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(error.payload, { status: error.status });
    }
    return Response.json({ message: 'Lỗi không xác định' }, { status: 500 });
  }
}
