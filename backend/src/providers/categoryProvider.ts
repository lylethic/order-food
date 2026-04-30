import { BaseSearchRequestType } from '../schemas/search';
import { prisma } from '../lib/prisma.js';
import parseFilterString from '../utils/filterParser';

/**
 * Data Access Layer — Category
 */
export const categoryProvider = {
  /** Return all active categories ordered alphabetically. */
  async findAll(request: BaseSearchRequestType) {
    const where = parseFilterString(request.search, {
      allowedFields: ['id', 'name', 'deleted', 'active'],
      defaultSearchFields: ['name'],
      defaultDeleted: true,
    });

    return prisma.category.findMany({
      where,
      orderBy: { id: request.order },
      take: request.limit + 1,
      ...(request.cursor ? { cursor: { id: request.cursor }, skip: 1 } : {}),
    });
  },

  async findById(id: number) {
    return prisma.category.findFirst({
      where: { id, deleted: false },
    });
  },

  async create(data: any) {
    return prisma.category.create({ data });
  },

  async update(data: any, id: number) {
    return prisma.category.update({
      where: { id },
      data,
    });
  },
  async delete(id: number) {
    return prisma.category.update({
      where: { id },
      data: { deleted: true },
    });
  },
};
