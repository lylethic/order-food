import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { sendResponse } from '../utils/response.js';

function unauthorized(res: Response) {
  sendResponse(res, {
    success: false,
    status_code: 401,
    message: 'Token không hợp lệ hoặc đã hết hạn',
    message_en: 'Invalid or expired token',
    errors: ['Invalid or expired token'],
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
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as typeof decoded;
  } catch {
    unauthorized(res);
    return;
  }

  const userId = decoded.sub ?? decoded.userId;
  if (!userId) {
    unauthorized(res);
    return;
  }

  // Version check — only for tokens that carry a version (new tokens have `v`)
  if (decoded.v !== undefined) {
    const user = await (prisma as any).user.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true, token_version: true, deleted: true, active: true },
    }) as { id: bigint; token_version: number; deleted: boolean; active: boolean } | null;

    if (!user || user.deleted || !user.active) {
      unauthorized(res);
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
