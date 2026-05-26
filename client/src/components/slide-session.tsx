'use client';

import authApiRequest from '@/apiRequests/auth';
import { getCookie } from '@/lib/cookieUtils';
import { useEffect } from 'react';

// Check every 30 minutes; refresh immediately if < 30 minutes left
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const REFRESH_THRESHOLD_MS = 30 * 60 * 1000;

export default function SlideSession() {
  useEffect(() => {
    const checkAndRefresh = async () => {
      const expiresAtStr = getCookie('accessTokenExpiresAt');
      if (!expiresAtStr) return;

      const expiresAt = new Date(expiresAtStr);
      if (Number.isNaN(expiresAt.getTime())) return;

      const remaining = expiresAt.getTime() - Date.now();
      if (remaining > REFRESH_THRESHOLD_MS) return;

      try {
        await authApiRequest.slideSessionFromNextClientToNextServer();
        // Cookies are updated by the server — no client-side state needed
      } catch {
        // Session expired or token reuse: middleware / next request will redirect to login
      }
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
