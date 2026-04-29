import { BaseSearchRequestType } from './../schemas/search';
import { prisma } from '../lib/prisma.js';
import parseFilterString from '../utils/filterParser.js';
import { UserCreateBodyType, UserUpdateBodyType } from '../schemas/user.js';

/**
 * Data Access Layer — User
 * All direct Prisma queries for the `users`, `roles`, and `user_roles` tables.
 */
export const userDal = {
  /** Find all */
  async findAll(request: BaseSearchRequestType) {
    // Use generic parser and provide model-specific hints
    const where = parseFilterString(request.search, {
      allowedFields: ['id', 'name', 'email', 'deleted', 'active'],
      fieldTypes: {
        id: 'number',
        name: 'string',
        email: 'string',
        deleted: 'boolean',
        active: 'boolean',
      },
      defaultSearchFields: ['name', 'email'],
      defaultDeleted: true,
    });

    return prisma.user.findMany({
      where,
      orderBy: { id: request.order },
      take: request.limit + 1,
      ...(request.cursor ? { cursor: { id: request.cursor }, skip: 1 } : {}),
    });
  },

  /** Find a user by email including their role assignments. */
  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deleted: false },
      include: {
        roles: {
          where: { deleted: false },
          include: { role: true },
        },
      },
    });
  },

  /** Find a user by primary key including their role assignments. */
  async findById(id: number) {
    return prisma.user.findFirst({
      where: { id, deleted: false },
      include: {
        roles: {
          where: { deleted: false },
          include: { role: true },
        },
      },
    });
  },

  /** Insert a new user row. Password must already be hashed. */
  async create(data: UserCreateBodyType) {
    return prisma.user.create({ data });
  },

  /** Update User */
  async update(data: UserUpdateBodyType, id: number) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  /** Delete a User */
  async delete(id: number) {
    return prisma.user.update({
      where: { id },
      data: { deleted: true },
    });
  },
};
