import { categoryDal } from '../dal/category.dal.js';
import { CategoryRes } from '../schemas/category.js';
import { BaseListResType, BaseSearchRequestType } from '../schemas/search.js';

/**
 * Service Layer — Category
 * Maps raw Prisma rows to the API response shape.
 */
export const categoryService = {
  async getAll(request: BaseSearchRequestType): Promise<BaseListResType> {
    const limit = request.limit;
    const rows = await categoryDal.findAll(request);
    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      data: items.map((c) => CategoryRes.parse(c)),
      limit,
      nextCursor,
      hasNextPage,
    };
  },

  async findById(id: number) {
    const row = await categoryDal.findById(id);
    return CategoryRes.parse(row);
  },

  async create(name: string) {
    return categoryDal.create({ name });
  },

  async update(name: string, id: number) {
    return categoryDal.update({ name }, id);
  },

  async delete(id: number) {
    return categoryDal.delete(id);
  },
};
