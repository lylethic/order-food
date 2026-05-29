import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const ACCESS_TOKEN_EXPIRY_MINUTES = parsePositiveInt(
  process.env.ACCESS_TOKEN_EXPIRY,
  60,
);
export const ACCESS_TOKEN_EXPIRY =
  process.env.ACCESS_TOKEN_EXPIRYTIME ?? `${ACCESS_TOKEN_EXPIRY_MINUTES}m`;
export const ACCESS_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRY_MINUTES * 60;
export const ACCESS_TOKEN_EXPIRY_MS = ACCESS_TOKEN_EXPIRY_SECONDS * 1000;

export const REFRESH_TOKEN_EXPIRY_DAYS = parsePositiveInt(
  process.env.REFRESHTOKEN_EXPIRYTIME,
  7,
);
export const REFRESH_TOKEN_EXPIRY_SECONDS =
  REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
export const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_SECONDS * 1000;
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
  let expiry: string | number = ACCESS_TOKEN_EXPIRY;
  
  console.log("[JWT Debug] Raw expiry value from env:", JSON.stringify(expiry), typeof expiry);
  
  if (typeof expiry === 'string') {
    // Loại bỏ mọi dấu ngoặc kép hoặc ngoặc đơn bị thừa (ví dụ '"60m"' do lỗi copy)
    expiry = expiry.replace(/['"]/g, '').trim();
    
    // Nếu là chuỗi số thuần túy như "60", chuyển thành number 60
    if (/^\d+$/.test(expiry)) {
      expiry = Number(expiry);
    }
  }

  console.log("[JWT Debug] Final parsed expiry value:", expiry, typeof expiry);

  return jwt.sign(
    {
      sub: userId.toString(),
      v: tokenVersion,
      userId: userId.toString(),
      email,
      role: roles,
    },
    process.env.JWT_SECRET!,
    { expiresIn: expiry as jwt.SignOptions['expiresIn'] },
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
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      '7d') as jwt.SignOptions['expiresIn'],
  });
}
