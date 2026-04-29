import { prisma } from '../lib/prisma.js';
import { BaseSearchRequestType } from '../schemas/search.js';

/**
 * Data Access Layer — Role
 */
export const roleDal = {
  async findAll(request?: BaseSearchRequestType) {
    return prisma.role.findMany({
      where: {
        deleted: false,
        ...(request?.search
          ? { name: { contains: request.search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { id: request?.order ?? 'desc' },
      take: request ? request.limit + 1 : undefined,
      ...(request?.cursor ? { cursor: { id: request.cursor }, skip: 1 } : {}),
    });
  },

  async findById(id: number) {
    return prisma.role.findFirst({ where: { id, deleted: false } });
  },

  async create(data: { name: string; description?: string | null }) {
    return prisma.role.create({ data });
  },

  async update(
    data: { name?: string; description?: string | null },
    id: number,
  ) {
    return prisma.role.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.role.update({ where: { id }, data: { deleted: true } });
  },

  /** Look up a Role row by its name (e.g. 'Customer', 'Chef'). */
  async findRoleByName(name: string) {
    return prisma.role.findFirst({ where: { name, deleted: false } });
  },

  /** Assign an existing Role to a User via the join table. */
  async assignRole(userId: bigint, roleId: bigint) {
    return prisma.userRole.create({
      data: { user_id: userId, role_id: roleId },
    });
  },

  /** Remove assign Role's user */
  async removeAssignRole(userId: bigint, roleId: bigint) {
    return prisma.userRole.update({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: roleId,
        },
      },
      data: {
        deleted: true,
        active: false,
      },
    });
  },
};
