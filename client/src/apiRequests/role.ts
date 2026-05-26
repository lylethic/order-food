import http from '@/lib/http';
import { RoleListResType } from '@/schemaValidations/role.schema';
import { RestaurantRoleListResType } from '@/schemaValidations/role.schema';

type SimpleRes = { success: boolean; statusCode: number; message: string; data: any };

const roleApiRequest = {
  // ── Existing (task-hub backend) ───────────────────────────────────────────
  list: (params?: { limit?: number; cursor?: string }) =>
    http.get<RoleListResType>('roles', { params }),

  // ── Restaurant backend (/api/v1/roles) ─────────────────────────────────────
  restaurantList: (params?: { limit?: number }) =>
    http.get<RestaurantRoleListResType>('api/v1/roles', {
      params: { limit: 50, ...params },
    }),

  assignRole: (userId: string, roleId: string) =>
    http.post<SimpleRes>(`api/v1/roles/${userId}/assign`, { roleId: Number(roleId) }),

  removeRole: (userId: string, roleId: string) =>
    http.post<SimpleRes>(`api/v1/roles/${userId}/removeAssign`, { roleId: Number(roleId) }),
};

export default roleApiRequest;
