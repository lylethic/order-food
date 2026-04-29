import z from 'zod';

export const MenuItemRes = z.object({
  id: z.bigint(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  rating: z.number().nullable(),
  tag: z.string().nullable(),
  image: z.string().nullable(),
  category_id: z.bigint(),

  created: z.date(),
  updated: z.date().nullable(),
  created_by: z.bigint().nullable(),
  updated_by: z.bigint().nullable(),
  deleted: z.boolean(),
  active: z.boolean(),
});
export type MenuItemResType = z.TypeOf<typeof MenuItemRes>;

export const MenuItemCreateBody = z.object({
  category_id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  image: z.string(),
  rating: z.number(),
  tag: z.string(),
});
export type MenuItemCreateBodyType = z.TypeOf<typeof MenuItemCreateBody>;

export const MenuItemUpdateBody = MenuItemCreateBody;
export type MenuItemUpdateBodyType = z.TypeOf<typeof MenuItemUpdateBody>;
