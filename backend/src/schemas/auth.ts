import z from 'zod';

export const SafeUser = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  img: z.string().nullable().optional(),
});

export type SafeUserType = z.TypeOf<typeof SafeUser>;

export const AuthResult = z.object({
  token: z.string(),
  user: SafeUser,
  role: z.string(),
});
export type AuthResultType = z.TypeOf<typeof AuthResult>;
