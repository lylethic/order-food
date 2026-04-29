import { Response } from 'express';
import { z } from 'zod';
import { AppError } from './AppError.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponseOptions {
  success?: boolean;
  status_code?: number;
  message?: string;
  message_en?: string;
  data?: unknown;
  errors?: unknown[];
}

function normalizeJsonValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeJsonValue(item),
      ]),
    );
  }

  return value;
}

// ─── Core helper ──────────────────────────────────────────────────────────────

/**
 * Sends a standardised JSON response.
 * The HTTP status code is always 200.
 */
export function sendResponse(
  res: Response,
  {
    success = true,
    status_code = 200,
    message = 'Thành công',
    message_en = 'Success',
    data = null,
    errors = [],
  }: ApiResponseOptions = {},
): void {
  res.status(200).json(
    normalizeJsonValue({
      success,
      status_code,
      message,
      message_en,
      data,
      errors,
    }),
  );
}

// ─── Error helper ─────────────────────────────────────────────────────────────

/**
 * Centralised error handler for all route catch blocks.
 * Maps AppError, ZodError and unexpected errors to the standard response shape.
 */
export function handleRouteError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    sendResponse(res, {
      success: false,
      status_code: err.status_code,
      message: err.message,
      message_en: err.message,
      errors: [err.message],
    });
    return;
  }

  if (err instanceof z.ZodError) {
    sendResponse(res, {
      success: false,
      status_code: 400,
      message: 'Dữ liệu không hợp lệ',
      message_en: 'Validation failed',
      errors: err.issues,
    });
    return;
  }

  console.error('[Unhandled error]', err);
  sendResponse(res, {
    success: false,
    status_code: 500,
    message: 'Lỗi máy chủ nội bộ',
    message_en: 'Internal server error',
    errors: [],
  });
}
