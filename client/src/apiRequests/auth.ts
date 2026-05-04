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

  /** Persist token to HttpOnly cookie via Next.js API route */
  auth: (body: { sessionToken: string; expiresAt: string; role?: string }) =>
    http.post('/api/auth', body, { baseUrl: '' }),

  /** Called from client → Next.js API route → clears cookie */
  logoutFromNextClientToNextServer: (
    force?: boolean,
    signal?: AbortSignal,
  ) =>
    http.post('/api/auth/logout', { force }, { baseUrl: '', signal }),

  /**
   * Called from Next.js server route → backend.
   * The new backend does not have an explicit logout endpoint;
   * the cookie is cleared by the Next.js route handler directly.
   */
  logoutFromNextServerToServer: (_sessionToken: string) =>
    Promise.resolve({ payload: { message: 'Logged out', success: true } }),

  /**
   * The new backend uses stateless JWT — no refresh-token support.
   * These stubs exist to satisfy callers in legacy route handlers.
   */
  slideSessionFromNextServerToServer: (
    _sessionToken: string,
    _refreshToken: string,
  ) =>
    Promise.resolve({
      payload: { message: 'No refresh support', success: false },
    }),

  slideSessionFromNextClientToNextServer: () =>
    http.post('/api/auth/slide-session', {}, { baseUrl: '' }),
};

export default authApiRequest;
