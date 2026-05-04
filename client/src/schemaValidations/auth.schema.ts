import z from 'zod';

// ---- Request Bodies ----

// Restaurant register body (includes phone & username)
export const RegisterBody = z
  .object({
    name: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(256),
    username: z.string().trim().min(2, 'Username tối thiểu 2 ký tự').max(100),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(100),
    confirmPassword: z.string().min(6).max(100),
    phone: z.string().trim().min(9, 'Số điện thoại không hợp lệ').max(15),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu không khớp',
        path: ['confirmPassword'],
      });
    }
  });

export type RegisterBodyType = z.TypeOf<typeof RegisterBody>;

// Guest register body (name + phone only)
export const GuestRegisterBody = z.object({
  name: z.string().trim().min(1, 'Tên là bắt buộc').max(100),
  phone: z.string().trim().min(9, 'Số điện thoại không hợp lệ').max(15),
});
export type GuestRegisterBodyType = z.TypeOf<typeof GuestRegisterBody>;

export const LoginBody = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
  })
  .strict();

export type LoginBodyType = z.TypeOf<typeof LoginBody>;

// ---- Response Types ----
export const AuthUser = z.object({
  id: z.string(),
  fullname: z.string().optional(),
  name: z.string().optional(),
  roleId: z.string().optional(),
  role: z.union([z.string(), z.array(z.string())]).optional(),
  email: z.string(),
  img: z.string().nullable().optional(),
  userId: z.string().optional(),
});
export type AuthUserType = z.TypeOf<typeof AuthUser>;

export const AuthResponseData = z.object({
  token: z.string(),
  user: AuthUser,
  // backend returns role at the top level of data, not inside user
  role: z.union([z.string(), z.array(z.string())]).optional(),
});

export const LoginRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: AuthResponseData,
  errors: z.array(z.any()).optional(),
});

export type LoginResType = z.TypeOf<typeof LoginRes>;
export type RegisterResType = LoginResType;

// Legacy – kept so http.ts can still resolve the type for the token interceptor
export const SlideSessionBody = z.object({}).strict();
export type SlideSessionBodyType = z.TypeOf<typeof SlideSessionBody>;
export type SlideSessionResType = LoginResType;
