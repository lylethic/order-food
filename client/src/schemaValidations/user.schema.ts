import z from 'zod';

// ── Item shape returned by the backend ──────────────────────────────────────
export const UserItem = z.object({
  _id: z.string(),
  username: z.string().nullable().optional(),
  fullname: z.string(),
  roleId: z.string(),
  email: z.string(),
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type UserItemType = z.TypeOf<typeof UserItem>;

// ── List response ────────────────────────────────────────────────────────────
export const UserListRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.object({
    items: z.array(UserItem),
    page: z.object({
      limit: z.number(),
      nextCursor: z.string().nullable(),
      hasNextPage: z.boolean(),
    }),
  }),
  errors: z.array(z.any()).optional(),
});
export type UserListResType = z.TypeOf<typeof UserListRes>;

// ── Usernames list (new endpoint) ────────────────────────────────────────────
export const UsernamesRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  data: z.array(z.string()),
});
export type UsernamesResType = z.TypeOf<typeof UsernamesRes>;

// ── Create form body (client-side) ──────────────────────────────────────────
export const CreateUserBody = z
  .object({
    username: z.string().min(1, 'Username là bắt buộc'),
    fullname: z.string().min(1, 'Họ tên là bắt buộc'),
    email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
    password: z
      .string()
      .min(1, 'Mật khẩu là bắt buộc')
      .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    roleId: z.string().min(1, 'Vui lòng chọn vai trò'),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });
export type CreateUserBodyType = z.TypeOf<typeof CreateUserBody>;

// ── Update form body ─────────────────────────────────────────────────────────
export const UpdateUserBody = z.object({
  fullname: z.string().min(1, 'Họ tên là bắt buộc').optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  updatedBy: z.string().optional(),
});
export type UpdateUserBodyType = z.TypeOf<typeof UpdateUserBody>;

// ── Restaurant: AdminUser (matches /api/v1/users response) ──────────────────

export const AdminUserRoleItem = z.object({
  id: z.string(),
  name: z.string(),
});
export type AdminUserRoleItemType = z.TypeOf<typeof AdminUserRoleItem>;

export const AdminUser = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  img: z.string().nullable(),
  active: z.boolean(),
  deleted: z.boolean(),
  created: z.string(),
  updated: z.string(),
  phone: z.string(),
  roles: z.array(AdminUserRoleItem),
});
export type AdminUserType = z.TypeOf<typeof AdminUser>;

export const AdminUserListRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.union([
    z.array(z.record(z.unknown())),
    z.object({
      data: z.array(z.record(z.unknown())),
      limit: z.number().optional(),
      nextCursor: z.union([z.string(), z.number()]).nullable().optional(),
      hasNextPage: z.boolean().optional(),
    }),
  ]),
  errors: z.array(z.any()).optional(),
});
export type AdminUserListResType = z.TypeOf<typeof AdminUserListRes>;

export const AdminUserRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.record(z.unknown()),
  errors: z.array(z.any()).optional(),
});
export type AdminUserResType = z.TypeOf<typeof AdminUserRes>;

export const CreateAdminUserBody = z.object({
  username: z.string().min(1, 'Username là bắt buộc'),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  name: z.string().optional(),
  phone: z.string().min(1, 'Số điện thoại là bắt buộc'),
});
export type CreateAdminUserBodyType = z.TypeOf<typeof CreateAdminUserBody>;

export const UpdateAdminUserBody = z.object({
  username: z.string().min(1).optional(),
  name: z.string().optional(),
  active: z.boolean().optional(),
});
export type UpdateAdminUserBodyType = z.TypeOf<typeof UpdateAdminUserBody>;

// ── Legacy aliases – keeps old imports compiling ─────────────────────────────
/** @deprecated Use UserItemType */
export type userResType = UserItemType;
/** @deprecated Use UserItemType[] */
export type usersResType = UserItemType[];
/** @deprecated Use CreateUserBodyType */
export type userCreateBodyType = CreateUserBodyType;
/** @deprecated Use UpdateUserBodyType */
export type userUpdateBodyType = UpdateUserBodyType;
export const employeeCreateBody = CreateUserBody;
export type employeeCreateBodyType = CreateUserBodyType;
