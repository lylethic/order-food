import { categoryProvider } from '../providers/categoryProvider.js';
import { CategoryRes } from '../schemas/category.js';
import { BaseListResType, BaseSearchRequestType } from '../schemas/search.js';

/**
 * Service Layer — Category
 * Maps raw Prisma rows to the API response shape.
 */
export const categoryService = {
  async getAll(request: BaseSearchRequestType): Promise<BaseListResType> {
    const limit = request.limit;
    const rows = await categoryProvider.findAll(request);
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
    const row = await categoryProvider.findById(id);
    return CategoryRes.parse(row);
  },

  async create(name: string) {
    return categoryProvider.create({ name });
  },

  async update(name: string, id: number) {
    return categoryProvider.update({ name }, id);
  },

  async delete(id: number) {
    return categoryProvider.delete(id);
  },

  async updateImg(id: number, img: string) {
    return categoryProvider.update({ img }, id);
  },
};
