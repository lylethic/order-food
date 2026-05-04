'use client';

import authApiRequest from '@/apiRequests/auth';
import { useEffect } from 'react';
import { differenceInMinutes } from 'date-fns';

const CHECK_INTERVAL_MS = 1000 * 60 * 30;
const REFRESH_THRESHOLD_MINUTES = 30;

type RefreshSessionPayload = {
  token?: string;
  expiresAt?: string | Date;
};

const getRefreshSessionPayload = (payload: any): RefreshSessionPayload => {
  if (payload?.responseData) {
    return payload.responseData;
  }
  return payload ?? {};
};

export default function SlideSession() {
  useEffect(() => {
    const checkAndRefreshSession = async () => {
      const sessionToken = localStorage.getItem('sessionToken');
      const sessionTokenExpiresAt = localStorage.getItem(
        'sessionTokenExpiresAt',
      );

      if (!sessionToken || !sessionTokenExpiresAt) return;

      const expiresAt = new Date(sessionTokenExpiresAt);
      if (Number.isNaN(expiresAt.getTime())) return;

      const now = new Date();
      const remainingMinutes = differenceInMinutes(expiresAt, now);

      if (remainingMinutes > REFRESH_THRESHOLD_MINUTES) return;

      const res = await authApiRequest.slideSessionFromNextClientToNextServer();
      const payload = getRefreshSessionPayload(res.payload);

      if (payload.token) {
        localStorage.setItem('sessionToken', payload.token);
      }

      if (payload.expiresAt) {
        localStorage.setItem(
          'sessionTokenExpiresAt',
          new Date(payload.expiresAt).toISOString(),
        );
      }
    };

    checkAndRefreshSession();

    const interval = setInterval(checkAndRefreshSession, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
  return null;
}
