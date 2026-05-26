import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { sendResponse } from '../utils/response.js';

function unauthorized(res: Response, message: string, messageEn: string) {
  sendResponse(res, {
    success: false,
    status_code: 401,
    message,
    message_en: messageEn,
    errors: [messageEn],
  });
}

/**
 * Verifies the Bearer JWT, checks token version against DB, attaches req.user.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    sendResponse(res, {
      success: false,
      status_code: 500,
      message: 'JWT_SECRET chưa được cấu hình',
      message_en: 'JWT_SECRET is not configured',
      errors: ['JWT_SECRET is not configured'],
    });
    return;
  }

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

  let decoded: { sub?: string; v?: number; userId?: string; email: string; role: string | string[] };
  try {
    decoded = jwt.verify(token, jwtSecret) as typeof decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      unauthorized(
        res,
        'Token đã hết hạn',
        'Token expired',
      );
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      unauthorized(
        res,
        'Token không hợp lệ hoặc chữ ký không đúng',
        'Invalid token or signature',
      );
      return;
    }

    unauthorized(res, 'Token không hợp lệ', 'Invalid token');
    return;
  }

  const userId = decoded.sub ?? decoded.userId;
  if (!userId) {
    unauthorized(res, 'Token không hợp lệ', 'Invalid token');
    return;
  }

  // Version check — only for tokens that carry a version (new tokens have `v`)
  if (decoded.v !== undefined) {
    const user = await (prisma as any).user.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true, token_version: true, deleted: true, active: true },
    }) as { id: bigint; token_version: number; deleted: boolean; active: boolean } | null;

    if (!user || user.deleted || !user.active) {
      unauthorized(res, 'Tài khoản không còn hợp lệ', 'User is inactive or deleted');
      return;
    }

    if (decoded.v !== user.token_version) {
      sendResponse(res, {
        success: false,
        status_code: 401,
        message: 'Token đã bị thu hồi',
        message_en: 'Token revoked',
        errors: ['Token revoked'],
      });
      return;
    }
  }

  req.user = { userId, email: decoded.email, role: decoded.role };
  next();
}

/**
 * Like `authenticate` but does NOT block the request if no token is present.
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as {
        sub?: string;
        v?: number;
        userId?: string;
        email: string;
        role: string | string[];
      };
      const userId = decoded.sub ?? decoded.userId;
      if (userId) {
        req.user = { userId, email: decoded.email, role: decoded.role };
      }
    } catch {
      // ignore
    }
  }
  next();
}
