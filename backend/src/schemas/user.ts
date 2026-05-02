import z from 'zod';

export const UserCreateBody = z.object({
  username: z.string().min(3),
  email: z.email(),
  password: z.string().min(8),
  name: z.string().optional(),
  img: z.string().optional(),
  phone: z.string().nullable().optional(),
});

export type UserCreateBodyType = z.TypeOf<typeof UserCreateBody>;

export const UserUpdateBody = z.object({
  username: z.string(),
  name: z.string().optional(),
  img: z.string().optional(),
  active: z.boolean().optional(),
  phone: z.string().nullable().optional(),
});

export type UserUpdateBodyType = z.TypeOf<typeof UserUpdateBody>;

export const UserRes = z
  .object({
    id: z.bigint(),
    username: z.string().nullable(),
    email: z.email().nullable(),
    name: z.string().nullable(),
    img: z.string().nullable().optional(),
    created: z.date(),
    updated: z.date(),
    create_by: z.bigint().nullable().optional(),
    update_by: z.bigint().nullable().optional(),
    deleted: z.boolean(),
    active: z.boolean(),
    phone: z.string().nullable().optional(),
    is_guest: z.boolean().nullable(),
    roles: z
      .array(
        z.object({
          role: z.object({ id: z.bigint(), name: z.string() }),
        }),
      )
      .optional()
      .default([]),
  })
  .transform((user) => ({
    ...user,
    id: user.id.toString(),
    create_by: user.create_by?.toString() ?? null,
    update_by: user.update_by?.toString() ?? null,
    roles: user.roles.map((r) => ({
      id: r.role.id.toString(),
      name: r.role.name,
    })),
  }));

export type UserResType = z.TypeOf<typeof UserRes>;
