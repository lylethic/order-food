import { categoryDal } from '../dal/category.dal.js';
import { menuItemDal } from '../dal/menuItem.dal.js';
import {
  MenuItemCreateBodyType,
  MenuItemRes,
  MenuItemResType,
  MenuItemUpdateBodyType,
} from '../schemas/menuItem.js';
import { BaseListResType, BaseSearchRequestType } from '../schemas/search.js';
import { AppError } from '../utils/AppError.js';

/**
 * Service Layer — MenuItem
 * Maps raw Prisma rows to the API response shape.
 */
export const menuItemService = {
  async getAll(request: BaseSearchRequestType): Promise<BaseListResType> {
    const limit = request.limit;
    const rows = await menuItemDal.findAll(request);

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;
    const normalize = (r: any) => {
      const price =
        r.price &&
        typeof r.price === 'object' &&
        typeof r.price.toNumber === 'function'
          ? r.price.toNumber()
          : r.price != null
            ? Number(r.price)
            : r.price;
      const rating =
        r.rating != null &&
        typeof r.rating === 'object' &&
        typeof r.rating.toNumber === 'function'
          ? r.rating.toNumber()
          : r.rating != null
            ? Number(r.rating)
            : r.rating;

      return {
        ...r,
        price,
        rating,
        // allow created_by/upated_by to remain null or BigInt
        created: r.created instanceof Date ? r.created : new Date(r.created),
        updated: r.updated
          ? r.updated instanceof Date
            ? r.updated
            : new Date(r.updated)
          : null,
      };
    };

    return {
      data: items.map((c) => MenuItemRes.parse(normalize(c))),
      limit: request.limit,
      nextCursor,
      hasNextPage,
    };
  },

  async findById(id: number) {
    const row = await menuItemDal.findById(id);
    if (!row) return null;
    const normalize = (r: any) => {
      const price =
        r.price &&
        typeof r.price === 'object' &&
        typeof r.price.toNumber === 'function'
          ? r.price.toNumber()
          : r.price != null
            ? Number(r.price)
            : r.price;
      const rating =
        r.rating != null &&
        typeof r.rating === 'object' &&
        typeof r.rating.toNumber === 'function'
          ? r.rating.toNumber()
          : r.rating != null
            ? Number(r.rating)
            : r.rating;
      return {
        ...r,
        price,
        rating,
        created: r.created instanceof Date ? r.created : new Date(r.created),
        updated: r.updated
          ? r.updated instanceof Date
            ? r.updated
            : new Date(r.updated)
          : null,
      };
    };

    return MenuItemRes.parse(normalize(row));
  },

  async create(data: MenuItemCreateBodyType) {
    const cate = await categoryDal.findById(data.category_id);
    if (!cate) throw new AppError(404, 'Không tìm thấy loại món ăn');

    return menuItemDal.create(data);
  },

  async update(data: MenuItemUpdateBodyType, id: number) {
    return menuItemDal.update(data, id);
  },

  async delete(id: number) {
    return menuItemDal.delete(id);
  },
};
