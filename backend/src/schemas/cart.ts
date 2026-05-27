import { z } from 'zod';

export const AddToCartSchema = z.object({
  menu_item_id: z.union([z.string(), z.number(), z.bigint()]),
  quantity: z.number().int().positive().default(1),
  modifications: z.array(z.string()).optional().default([]),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int(),
  modifications: z.array(z.string()).optional(),
});

export type AddToCartBodyType = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemBodyType = z.infer<typeof UpdateCartItemSchema>;
