import z from 'zod';

export const RoleRes = z.object({
  id: z.bigint(),
  name: z.string(),
  description: z.string().nullable(),
  created: z.date(),
  updated: z.date().nullable(),
  created_by: z.bigint().nullable(),
  updated_by: z.bigint().nullable(),
  deleted: z.boolean(),
  active: z.boolean(),
});

export type RoleResType = z.TypeOf<typeof RoleRes>;

export const RoleCreateBody = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export type RoleCreateBodyType = z.TypeOf<typeof RoleCreateBody>;

export const RoleUpdateBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export type RoleUpdateBodyType = z.TypeOf<typeof RoleUpdateBody>;
