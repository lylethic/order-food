import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const MAX_SESSIONS = 5;

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateAccessToken(
  userId: bigint,
  tokenVersion: number,
  email: string,
  roles: string[],
): string {
  return jwt.sign(
    { sub: userId.toString(), v: tokenVersion, userId: userId.toString(), email, role: roles },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function generateTokenFamily(): string {
  return crypto.randomUUID();
}

/** @deprecated Use generateAccessToken with token_version instead */
export function generateToken(
  userId: string,
  email: string,
  role: string[] | string,
): string {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}
