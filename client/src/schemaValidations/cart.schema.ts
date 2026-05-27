import { z } from 'zod';

export const CartItemRes = z.object({
  id: z.string(),
  cart_id: z.string(),
  menu_item_id: z.string(),
  quantity: z.number(),
  modifications: z.array(z.string()),
  created: z.string(),
  updated: z.string().nullable(),
  menu_items: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    menu_item_images: z.array(z.object({
      image_url: z.string()
    }))
  })
});

export const CartRes = z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  session_id: z.string().nullable(),
  cart_items: z.array(CartItemRes)
});

export type CartResType = z.TypeOf<typeof CartRes>;

export const AddToCartBody = z.object({
  menu_item_id: z.string(),
  quantity: z.number().int().positive().default(1),
  modifications: z.array(z.string()).optional().default([]),
});

export type AddToCartBodyType = z.TypeOf<typeof AddToCartBody>;

export const UpdateCartItemBody = z.object({
  quantity: z.number().int(),
  modifications: z.array(z.string()).optional(),
});

export type UpdateCartItemBodyType = z.TypeOf<typeof UpdateCartItemBody>;
