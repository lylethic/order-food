import { z } from 'zod';

export const UserRoleEnum = z.enum(['ADMIN', 'EMPLOYEE', 'CHEF', 'CUSTOMER']);

export const PermissionSchema = z.object({
  id: z.string().or(z.bigint()),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const RoleSchema = z.object({
  id: z.string().or(z.bigint()),
  name: UserRoleEnum,
  description: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string().or(z.bigint()),
  username: z.string().min(3).optional(),
  email: z.email(),
  password: z.string().min(6),
  name: z.string().optional(),
  active: z.boolean().default(true),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const RegisterSchema = UserSchema.omit({
  id: true,
  active: true,
}).extend({
  role: UserRoleEnum.default('CUSTOMER'),
});
