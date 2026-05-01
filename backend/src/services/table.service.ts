import crypto from 'crypto';
import { AppError } from '../utils/AppError.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_TABLE_NUMBER_LENGTH = 10;

function getSecret(): string {
  const secret = process.env.QR_SECRET;
  if (!secret) throw new AppError(500, 'QR_SECRET chưa được cấu hình');
  return secret;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const tableService = {
  /**
   * Validates that a table number is non-empty and within length limits.
   * Throws AppError(400) on failure.
   */
  validateTableNumber(tableNumber: string): void {
    if (!tableNumber || tableNumber.trim().length === 0) {
      throw new AppError(400, 'Số bàn không được để trống');
    }
    if (tableNumber.length > MAX_TABLE_NUMBER_LENGTH) {
      throw new AppError(
        400,
        `Số bàn không được quá ${MAX_TABLE_NUMBER_LENGTH} ký tự`,
      );
    }
  },

  /**
   * Generates a 16-char lowercase hex HMAC token for a table number.
   * Token is deterministic: same table + same QR_SECRET → same token.
   * To invalidate all QR codes, change QR_SECRET in .env.
   */
  generateToken(tableNumber: string): string {
    return crypto
      .createHmac('sha256', getSecret())
      .update(tableNumber)
      .digest('hex')
      .slice(0, 16);
  },

  /**
   * Timing-safe comparison of the provided token against the expected HMAC.
   * Returns false (instead of throwing) on any mismatch or invalid input.
   */
  verifyToken(tableNumber: string, token: string): boolean {
    if (!token || token.length < 16) return false;
    try {
      const expected = this.generateToken(tableNumber);
      const provided = token.slice(0, 16);
      // Both strings are 16 ASCII chars → 16-byte UTF-8 buffers (same length)
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'utf8'),
        Buffer.from(provided, 'utf8'),
      );
    } catch {
      return false;
    }
  },

  /**
   * Builds the full QR URL for a table.
   * Format: {FRONTEND_URL}/scan?table={tableNumber}&sid={token}
   */
  generateQrUrl(tableNumber: string): string {
    const token = this.generateToken(tableNumber);
    const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(
      /\/$/,
      '',
    );
    return `${base}/scan?table=${encodeURIComponent(tableNumber)}&sid=${token}`;
  },
};
