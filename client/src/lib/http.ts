import envConfig from '@/config';
import { getCookie } from '@/lib/cookieUtils';
import { redirect } from 'next/navigation';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
  params?: QueryParams;
};

const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;

type EntityErrorPayload = {
  message: string;
  errors: { field: string; message: string }[];
};

export class HttpError extends Error {
  status: number;
  payload: { message: string; [key: string]: any };
  constructor({ status, payload }: { status: number; payload: any }) {
    super(payload?.message ?? 'Http Error');
    this.status = status;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: 422;
  payload: EntityErrorPayload;
  constructor({ status, payload }: { status: 422; payload: EntityErrorPayload }) {
    super({ status, payload });
    this.status = status;
    this.payload = payload;
  }
}

let clientLogoutRequest: null | Promise<any> = null;
export const isClient = () => typeof window !== 'undefined';

const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  options?: CustomOptions | undefined,
) => {
  let body: FormData | string | undefined = undefined;
  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }

  const baseHeaders: Record<string, string> =
    body instanceof FormData ? {} : { 'Content-Type': 'application/json' };

  if (isClient()) {
    // Read access token from cookie (not localStorage)
    const accessToken = getCookie('accessToken');
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  const baseUrl =
    options?.baseUrl === undefined ? envConfig.NEXT_PUBLIC_API_ENDPOINT : options.baseUrl;

  const fullUrl = (() => {
    const path = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    if (!options?.params) return path;
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    return queryString ? `${path}?${queryString}` : path;
  })();

  const res = await fetch(fullUrl, {
    ...options,
    headers: { ...baseHeaders, ...options?.headers } as any,
    body,
    method,
  });

  const payload: Response = await res.json();
  const data = { status: res.status, payload };

  if (
    res.ok &&
    payload &&
    typeof payload === 'object' &&
    (payload as { success?: boolean }).success === false
  ) {
    throw new HttpError({ status: res.status, payload });
  }

  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(data as { status: 422; payload: EntityErrorPayload });
    } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
      if (isClient()) {
        if (!clientLogoutRequest) {
          clientLogoutRequest = fetch('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ force: true }),
            headers: { 'Content-Type': 'application/json' },
          });
          try {
            await clientLogoutRequest;
          } catch {
            // ignore
          } finally {
            clientLogoutRequest = null;
            location.href = '/login';
          }
        }
      } else {
        // Server-side: redirect to logout — token comes from cookie, no need for query param
        redirect('/login');
      }
    } else {
      throw new HttpError(data);
    }
  }

  return data;
};

const http = {
  get<Response>(url: string, options?: Omit<CustomOptions, 'body'>) {
    return request<Response>('GET', url, options);
  },
  post<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'>) {
    return request<Response>('POST', url, { ...options, body });
  },
  patch<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'>) {
    return request<Response>('PUT', url, { ...options, body });
  },
  put<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'>) {
    return request<Response>('PUT', url, { ...options, body });
  },
  delete<Response>(url: string, body?: any, options?: Omit<CustomOptions, 'body'>) {
    return request<Response>('DELETE', url, { ...options, body });
  },
};

export default http;
