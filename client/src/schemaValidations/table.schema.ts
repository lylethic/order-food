import z from 'zod';

// ── QR Token entry ────────────────────────────────────────────────────────────

export const QrTableItem = z.object({
  tableNumber: z.string(),
  url: z.string(),
  token: z.string(),
});
export type QrTableItemType = z.TypeOf<typeof QrTableItem>;

// ── Verify table token ────────────────────────────────────────────────────────

export const VerifyTableTokenRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.object({
    valid: z.boolean(),
    tableNumber: z.string().nullable(),
  }),
  errors: z.array(z.any()).optional(),
});
export type VerifyTableTokenResType = z.TypeOf<typeof VerifyTableTokenRes>;

// ── QR batch generate ─────────────────────────────────────────────────────────

export const QrBatchRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.object({
    tables: z.array(QrTableItem),
  }),
  errors: z.array(z.any()).optional(),
});
export type QrBatchResType = z.TypeOf<typeof QrBatchRes>;

// ── Generate QR batch (numeric range) body ────────────────────────────────────

export const GenerateQrBatchBody = z.object({
  from: z.number().int().min(1),
  to: z.number().int().min(1),
});
export type GenerateQrBatchBodyType = z.TypeOf<typeof GenerateQrBatchBody>;

// ── Generate QR list (custom table names) body ────────────────────────────────

export const GenerateQrListBody = z.object({
  tables: z.array(z.string()).min(1),
});
export type GenerateQrListBodyType = z.TypeOf<typeof GenerateQrListBody>;
