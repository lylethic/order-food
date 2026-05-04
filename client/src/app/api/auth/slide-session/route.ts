import authApiRequest from '@/apiRequests/auth';
import { HttpError } from '@/lib/http';
import { cookies } from 'next/headers';

const getRefreshSessionPayload = (payload: any) => {
  if (payload?.responseData) {
    return payload.responseData;
  }
  return payload ?? {};
};

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('sessionToken');
  const refreshToken = cookieStore.get('refreshToken');

  if (!sessionToken || !refreshToken) {
    return Response.json(
      { message: 'Không nhận được token để làm mới phiên đăng nhập' },
      {
        status: 401,
      },
    );
  }
  try {
    const res = await authApiRequest.slideSessionFromNextServerToServer(
      sessionToken.value,
      refreshToken.value,
    );
    const payload = getRefreshSessionPayload(res.payload);

    if (!payload.token || !payload.expiresAt) {
      return Response.json(
        { message: 'Refresh token response is missing token data' },
        {
          status: 500,
        },
      );
    }

    const response = Response.json(res.payload, {
      status: 200,
    });

    const headers = new Headers(response.headers);
    const expiresAt = new Date(payload.expiresAt);
    headers.append(
      'Set-Cookie',
      `sessionToken=${payload.token}; Path=/; HttpOnly; Expires=${expiresAt.toUTCString()}; SameSite=Lax; Secure`,
    );
    headers.append(
      'Set-Cookie',
      `sessionTokenExpiresAt=${expiresAt.toISOString()}; Path=/; HttpOnly; Expires=${expiresAt.toUTCString()}; SameSite=Lax; Secure`,
    );

    if (payload.refreshToken && payload.refreshTokenExpiresAt) {
      const refreshTokenExpiresAt = new Date(payload.refreshTokenExpiresAt);
      headers.append(
        'Set-Cookie',
        `refreshToken=${payload.refreshToken}; Path=/; HttpOnly; Expires=${refreshTokenExpiresAt.toUTCString()}; SameSite=Lax; Secure`,
      );
      headers.append(
        'Set-Cookie',
        `refreshTokenExpiresAt=${refreshTokenExpiresAt.toISOString()}; Path=/; HttpOnly; Expires=${refreshTokenExpiresAt.toUTCString()}; SameSite=Lax; Secure`,
      );
    }

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status,
      });
    } else {
      return Response.json(
        {
          message: 'Lỗi không xác định',
        },
        {
          status: 500,
        },
      );
    }
  }
}
