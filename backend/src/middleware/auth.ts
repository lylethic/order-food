import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendResponse } from '../utils/response.js';

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches `req.user = { userId, email, role }`.
 * On failure, responds with 401.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendResponse(res, {
      success: false,
      status_code: 401,
      message: 'Thiếu hoặc sai header Authorization',
      message_en: 'Missing or invalid Authorization header',
      errors: ['Missing or invalid Authorization header'],
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string | string[];
    };
    req.user = payload;
    next();
  } catch {
    sendResponse(res, {
      success: false,
      status_code: 401,
      message: 'Token không hợp lệ hoặc đã hết hạn',
      message_en: 'Invalid or expired token',
      errors: ['Invalid or expired token'],
    });
  }
}

/**
 * Like `authenticate` but does NOT block the request if no token is present.
 * Useful for public routes that show extra data when logged in.
 */
export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(
        authHeader.slice(7),
        process.env.JWT_SECRET!,
      ) as {
        userId: string;
        email: string;
        role: string | string[];
      };
      req.user = payload;
    } catch {
      // ignore — treat as unauthenticated
    }
  }
  next();
}
