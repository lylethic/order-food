import z from 'zod';

export const CategoryRes = z.object({
  id: z.bigint(),
  name: z.string(),
  img: z.string().nullable().optional(),
  created: z.date(),
  updated: z.date(),
  created_by: z.bigint().nullable(),
  updated_by: z.bigint().nullable(),
  deleted: z.boolean(),
  active: z.boolean(),
});
export type CategoryResType = z.TypeOf<typeof CategoryRes>;
