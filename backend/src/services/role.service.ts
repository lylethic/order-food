import { roleDal } from '../dal/role.dal.js';
import { RoleRes } from '../schemas/role.js';
import { BaseListResType, BaseSearchRequestType } from '../schemas/search.js';
import { AppError } from '../utils/AppError.js';
import type {
  RoleCreateBodyType,
  RoleUpdateBodyType,
  RoleResType,
} from '../schemas/role.js';

export const roleService = {
  async getAll(request: BaseSearchRequestType): Promise<BaseListResType> {
    const limit = request.limit;
    const rows = await roleDal.findAll(request);
    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasNextPage && items.length > 0 ? items[items.length - 1].id : null;

    return {
      data: items.map((row) => RoleRes.parse(row)),
      limit,
      nextCursor,
      hasNextPage,
    };
  },

  async findById(id: number) {
    const row = await roleDal.findById(id);
    if (!row) throw new AppError(404, 'Role not found');
    return RoleRes.parse(row);
  },

  async create(data: RoleCreateBodyType): Promise<RoleResType> {
    const existing = await roleDal.findRoleByName(data.name);
    if (existing) throw new AppError(409, 'Role already exists');
    const row = await roleDal.create({
      name: data.name,
      description: data.description ?? null,
    });
    return RoleRes.parse(row);
  },

  async update(data: RoleUpdateBodyType, id: number): Promise<RoleResType> {
    const existing = await roleDal.findById(id);
    if (!existing) throw new AppError(404, 'Role not found');
    const row = await roleDal.update(
      {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      id,
    );
    return RoleRes.parse(row);
  },

  async delete(id: number): Promise<RoleResType> {
    const existing = await roleDal.findById(id);
    if (!existing) throw new AppError(404, 'Role not found');
    const row = await roleDal.delete(id);
    return RoleRes.parse(row);
  },
};
