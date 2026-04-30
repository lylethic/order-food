import { categoryProvider } from '../providers/categoryProvider.js';
import { menuItemProvider } from '../providers/menuItemProvider.js';
import { menuItemImageProvider } from '../providers/menuItemImageProvider.js';
import {
  MenuItemCreateBodyType,
  MenuItemDetailResType,
  MenuItemRes,
  MenuItemUpdateBodyType,
} from '../schemas/menuItem.js';
import { BaseListResType, BaseSearchRequestType } from '../schemas/search.js';
import { AppError } from '../utils/AppError.js';
import { staticFileService } from './staticFile.service.js';

/**
 * Service Layer — MenuItem
 * Maps raw Prisma rows to the API response shape.
 */
export const menuItemService = {
  async getAll(request: BaseSearchRequestType): Promise<BaseListResType> {
    const limit = request.limit;
    const rows = await menuItemProvider.findAll(request);

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
        commentCount: r._count?.menu_item_comments ?? 0,
        image: r.menu_item_images?.[0]?.image_url ?? null,
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

  async findById(id: number): Promise<MenuItemDetailResType | null> {
    const row = await menuItemProvider.findById(id);
    if (!row) return null;

    const r = row as any;

    const toNum = (v: any) =>
      v != null && typeof v === 'object' && typeof v.toNumber === 'function'
        ? v.toNumber()
        : v != null
          ? Number(v)
          : null;

    const imgs: any[] = r.menu_item_images ?? [];

    return {
      id: r.id.toString(),
      name: r.name,
      description: r.description ?? null,
      price: toNum(r.price) ?? 0,
      rating: r.rating != null ? toNum(r.rating) : null,
      commentCount: r._count?.menu_item_comments ?? 0,
      tag: r.tag ?? null,
      category: r.category
        ? { id: r.category.id.toString(), name: r.category.name }
        : null,
      images: imgs.map((img) => ({
        id: img.id.toString(),
        image_url: img.image_url,
        is_primary: img.is_primary ?? false,
        display_order: img.display_order ?? 0,
        created_at: img.created_at.toISOString(),
      })),
      created: r.created.toISOString(),
      updated: r.updated ? r.updated.toISOString() : null,
      deleted: r.deleted,
      active: r.active,
    };
  },

  async uploadImages(
    menuItemId: number,
    files: Express.Multer.File[],
    isPrimary?: string,
  ): Promise<MenuItemDetailResType | null> {
    const item = await menuItemProvider.findById(menuItemId);
    if (!item) throw new AppError(404, 'Không tìm thấy món ăn');

    const primaryIdx = isPrimary !== undefined ? Number(isPrimary) : null;
    const images = files.map((file, idx) => ({
      image_url: staticFileService.getPath(file),
      is_primary: primaryIdx !== null ? idx === primaryIdx : idx === 0,
      display_order: idx,
    }));

    await menuItemImageProvider.createMany(menuItemId, images);
    return this.findById(menuItemId);
  },

  async deleteImage(
    menuItemId: number,
    imageId: number,
  ): Promise<MenuItemDetailResType | null> {
    const img = await menuItemImageProvider.findById(imageId);
    if (!img) throw new AppError(404, 'Không tìm thấy ảnh');
    if (img.menu_item_id.toString() !== menuItemId.toString())
      throw new AppError(400, 'Ảnh không thuộc món ăn này');

    // Delete file from disk
    try {
      staticFileService.delete(img.image_url);
    } catch {
      /* ignore */
    }

    await menuItemImageProvider.delete(imageId);
    return this.findById(menuItemId);
  },

  async create(data: MenuItemCreateBodyType) {
    const cate = await categoryProvider.findById(data.category_id);
    if (!cate) throw new AppError(404, 'Không tìm thấy loại món ăn');

    return menuItemProvider.create(data);
  },

  async update(data: MenuItemUpdateBodyType, id: number) {
    return menuItemProvider.update(data, id);
  },

  async delete(id: number) {
    return menuItemProvider.delete(id);
  },
};
