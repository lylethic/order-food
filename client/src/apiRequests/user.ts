import http from '@/lib/http';
import {
  CreateUserBodyType,
  UpdateUserBodyType,
  UserItemType,
  UserListResType,
  UsernamesResType,
  AdminUserListResType,
  AdminUserResType,
  CreateAdminUserBodyType,
  UpdateAdminUserBodyType,
} from '@/schemaValidations/user.schema';

type SimpleRes = { success: boolean; statusCode: number; message: string; data: any };

type SingleUserRes = {
  success: boolean;
  statusCode: number;
  message: string;
  data: UserItemType;
};

const userApiRequest = {
  /** Paginated user list */
  list: (params?: {
    limit?: number;
    cursor?: string;
    includeDeleted?: boolean;
  }) => http.get<UserListResType>('users', { params }),

  /** All usernames (no pagination) — for real-time duplicate check */
  getUsernames: () => http.get<UsernamesResType>('users/usernames'),

  getById: (
    id: string,
    params?: { includeDeleted?: boolean; select?: string },
  ) => http.get<SingleUserRes>(`users/${id}`, { params }),

  getByEmail: (
    email: string,
    params?: { includeDeleted?: boolean; select?: string },
  ) =>
    http.get<SingleUserRes>('users/by-email', { params: { email, ...params } }),

  getByUsername: (username: string) =>
    http.get<SingleUserRes>(`users/by-username/${username}`),

  create: (body: Omit<CreateUserBodyType, 'confirmPassword'>) =>
    http.post<SingleUserRes>('users', body),

  update: (id: string, body: UpdateUserBodyType) =>
    http.patch<SingleUserRes>(`users/${id}`, body),

  delete: (id: string) => http.delete<SimpleRes>(`users/${id}`),

  // ── Legacy aliases kept so old components still compile ──────────────────
  /** @deprecated Use list() */
  users: (params?: any) => http.get<UserListResType>('users', { params }),
  /** @deprecated Use create() */
  add: (body: any) => http.post<SingleUserRes>('users', body),

  // ── Restaurant backend (/api/v1/users) ─────────────────────────────────────
  restaurantList: (params?: { limit?: number; cursor?: string | number; search?: string }) =>
    http.get<AdminUserListResType>('api/v1/users', { params: { limit: 20, ...params } }),

  restaurantCreate: (body: CreateAdminUserBodyType) =>
    http.post<AdminUserResType>('api/v1/users', body),

  restaurantUpdate: (id: string, body: UpdateAdminUserBodyType) =>
    http.put<AdminUserResType>(`api/v1/users/${id}`, body),

  restaurantDelete: (id: string) =>
    http.delete<SimpleRes>(`api/v1/users/${id}`),

  uploadAvatar: (userId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.put<AdminUserResType>(`api/v1/users/${userId}/avatar`, form);
  },
};

export default userApiRequest;
