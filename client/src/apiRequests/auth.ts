import http from '@/lib/http';
import {
  LoginBodyType,
  LoginResType,
  RegisterBodyType,
  RegisterResType,
} from '@/schemaValidations/auth.schema';

type GuestRegisterRes = {
  success: boolean;
  statusCode: number;
  message: string;
  data: { token: string; user: Record<string, unknown>; role: string[] };
};

type MeRes = {
  success: boolean;
  statusCode: number;
  message: string;
  data: Record<string, unknown>;
};

const authApiRequest = {
  login: (body: LoginBodyType) =>
    http.post<LoginResType>('api/v1/auth/login', body),

  register: (body: Omit<RegisterBodyType, 'confirmPassword'> & { phone: string; username: string }) =>
    http.post<RegisterResType>('api/v1/auth/register', body),

  guestRegister: (body: { name: string; phone: string }) =>
    http.post<GuestRegisterRes>('api/v1/auth/guestRegister', body),

  me: () => http.get<MeRes>('api/v1/auth/me'),

  /** Persist tokens to cookies via Next.js API route */
  auth: (body: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    refreshTokenExpiresAt?: string;
    role?: string | string[];
  }) => http.post('/api/auth', body, { baseUrl: '' }),

  /** Client → Next.js route → clears cookies */
  logoutFromNextClientToNextServer: (force?: boolean, signal?: AbortSignal) =>
    http.post('/api/auth/logout', { force }, { baseUrl: '', signal }),

  /** Next.js server → Express backend: revoke refresh token */
  logoutFromNextServerToServer: async (refreshToken: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return { payload: { message: 'Logged out', success: true } };
  },

  /** Client → Next.js slide-session route (triggers server-side refresh) */
  slideSessionFromNextClientToNextServer: () =>
    http.post('/api/auth/slide-session', {}, { baseUrl: '' }),
};

export default authApiRequest;
