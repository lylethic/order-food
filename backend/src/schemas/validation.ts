import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const UserRoleEnum = z.enum(['ADMIN', 'EMPLOYEE', 'CHEF', 'CUSTOMER']);

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string(),
  name: z.string(),
  role: UserRoleEnum.optional().default('CUSTOMER'),
  img: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Orders ────────────────────────────────────────────────────────────────────

export const CreateOrderSchema = z.object({
  tableNumber: z.string().min(1),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        qty: z.number().int().positive(),
        modifications: z.array(z.string()).optional().default([]),
      }),
    )
    .min(1, 'Order must have at least one item'),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['Received', 'Preparing', 'Cooking', 'Ready', 'Delivered']),
});

export const PaymentMethodSchema = z.enum([
  'Cash',
  'Credit Card',
  'E-Wallet',
  'Bank Transfer',
]);

export const MarkOrderPaidSchema = z.object({
  paymentMethod: PaymentMethodSchema,
});

// Inferred TypeScript types from schemas
export type RegisterBodyType = z.infer<typeof RegisterSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type CreateOrderBodyType = z.infer<typeof CreateOrderSchema>;
export type UpdateStatusBodyType = z.infer<typeof UpdateStatusSchema>;
export type MarkOrderPaidBodyType = z.infer<typeof MarkOrderPaidSchema>;
