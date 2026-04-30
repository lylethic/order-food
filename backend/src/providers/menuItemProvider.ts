import { MenuItemUpdateBodyType } from '../schemas/menuItem';
import { prisma } from '../lib/prisma.js';
import { MenuItemCreateBodyType } from '../schemas/menuItem.js';
import { BaseSearchRequestType } from '../schemas/search.js';
import parseFilterString from '../utils/filterParser.js';

/**
 * Data Access Layer — MenuItem
 */
export const menuItemProvider = {
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

    if (request.categoryId) {
      (where as Record<string, unknown>).category_id = request.categoryId;
    }

    return prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        menu_item_images: {
          where: { is_primary: true },
          take: 1,
        },
      },
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
    return prisma.menuItem.findFirst({
      where: { id, deleted: false, active: true },
      include: {
        category: true,
        menu_item_images: {
          orderBy: [{ is_primary: 'desc' }, { display_order: 'asc' }],
        },
      },
    });
  },

  async create(data: MenuItemCreateBodyType) {
    const payload: any = { ...data };
    // remove client-only/unknown fields that are not in Prisma model
    if (payload.image != null) delete payload.image;
    if (payload.category_id != null) {
      payload.category = { connect: { id: BigInt(payload.category_id) } };
      delete payload.category_id;
    }
    return prisma.menuItem.create({ data: payload });
  },

  async update(data: MenuItemUpdateBodyType, id: number) {
    const payload: any = { ...data };
    // remove client-only/unknown fields
    if (payload.image != null) delete payload.image;
    if (Object.prototype.hasOwnProperty.call(payload, 'category_id')) {
      const cid = payload.category_id;
      delete payload.category_id;
      if (cid == null) {
        payload.category = { disconnect: true };
      } else {
        payload.category = { connect: { id: BigInt(cid) } };
      }
    }

    return prisma.menuItem.update({ where: { id }, data: payload });
  },

  async delete(id: number) {
    return prisma.menuItem.update({
      where: { id },
      data: { deleted: true },
    });
  },
};
