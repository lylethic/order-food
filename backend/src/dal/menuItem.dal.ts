import { MenuItemUpdateBodyType } from './../schemas/menuItem';
import { prisma } from '../lib/prisma.js';
import { MenuItemCreateBodyType } from '../schemas/menuItem.js';
import { BaseSearchRequestType } from '../schemas/search.js';
import parseFilterString from '../utils/filterParser.js';
import { categoryDal } from './category.dal';

/**
 * Data Access Layer — MenuItem
 */
export const menuItemDal = {
  /** Return all active menu items, optionally filtered by category name. */
  async findAll(request: BaseSearchRequestType) {
    const where = parseFilterString(request.search, {
      allowedFields: [
        'id',
        'name',
        'description',
        'price',
        'deleted',
        'active',
        'category_id',
        'rating',
        'tag',
      ],
      defaultSearchFields: ['name', 'description'],
      defaultDeleted: true,
    });
    return prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { id: request.order },
      take: request.limit + 1,
      ...(request.cursor ? { cursor: { id: request.cursor }, skip: 1 } : {}),
    });
  },

  /** Fetch specific menu items by their IDs (used when creating orders). */
  async findByIds(ids: bigint[]) {
    return prisma.menuItem.findMany({
      where: { id: { in: ids }, deleted: false, active: true },
    });
  },

  async findById(id: number) {
    return prisma.menuItem.findMany({
      where: { id: id, deleted: false, active: true },
    });
  },

  async create(data: MenuItemCreateBodyType) {
    return prisma.menuItem.create({
      data,
    });
  },

  async update(data: MenuItemUpdateBodyType, id: number) {
    return prisma.menuItem.update({
      where: { id },
      data,
    });
  },

  async delete(id: number) {
    return prisma.menuItem.update({
      where: { id },
      data: { deleted: true },
    });
  },
};
