import z from 'zod';

// ── Category ─────────────────────────────────────────────────────────────────

export const CategoryItem = z.object({
  id: z.string(),
  name: z.string(),
  img: z.string().nullable().optional(),
});
export type CategoryItemType = z.TypeOf<typeof CategoryItem>;

export const CategoryListRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.union([
    z.array(CategoryItem),
    z.object({
      data: z.array(CategoryItem),
      limit: z.number().optional(),
      nextCursor: z.union([z.string(), z.number()]).nullable().optional(),
      hasNextPage: z.boolean().optional(),
    }),
  ]),
  errors: z.array(z.any()).optional(),
});
export type CategoryListResType = z.TypeOf<typeof CategoryListRes>;

export const CategoryRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: CategoryItem,
  errors: z.array(z.any()).optional(),
});
export type CategoryResType = z.TypeOf<typeof CategoryRes>;

export const CreateCategoryBody = z.object({
  name: z.string().trim().min(1, 'Tên danh mục là bắt buộc').max(100),
});
export type CreateCategoryBodyType = z.TypeOf<typeof CreateCategoryBody>;

export const UpdateCategoryBody = CreateCategoryBody;
export type UpdateCategoryBodyType = CreateCategoryBodyType;

// ── MenuItemImage ─────────────────────────────────────────────────────────────

export const MenuItemImage = z.object({
  id: z.string(),
  image_url: z.string(),
  is_primary: z.boolean(),
  display_order: z.number(),
});
export type MenuItemImageType = z.TypeOf<typeof MenuItemImage>;

// ── MenuItem ──────────────────────────────────────────────────────────────────

export const MenuItem = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  image: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  isAvailable: z.boolean().optional(),
  rating: z.number().optional(),
  commentCount: z.number().optional(),
  tag: z.string().optional(),
});
export type MenuItemType = z.TypeOf<typeof MenuItem>;

export const MenuItemDetail = MenuItem.extend({
  images: z.array(MenuItemImage),
});
export type MenuItemDetailType = z.TypeOf<typeof MenuItemDetail>;

export const MenuItemListRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.union([
    z.array(z.record(z.unknown())),
    z.object({
      data: z.array(z.record(z.unknown())),
      limit: z.number().optional(),
      nextCursor: z.union([z.string(), z.number()]).nullable().optional(),
      hasNextPage: z.boolean().optional(),
    }),
  ]),
  errors: z.array(z.any()).optional(),
});
export type MenuItemListResType = z.TypeOf<typeof MenuItemListRes>;

export const MenuItemRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.record(z.unknown()),
  errors: z.array(z.any()).optional(),
});
export type MenuItemResType = z.TypeOf<typeof MenuItemRes>;

export const CreateMenuItemBody = z.object({
  category_id: z.number({ required_error: 'Vui lòng chọn danh mục' }),
  name: z.string().trim().min(1, 'Tên món ăn là bắt buộc').max(200),
  description: z.string().trim().min(1, 'Mô tả là bắt buộc'),
  price: z.number({ required_error: 'Giá là bắt buộc' }).min(0),
  tag: z.string().optional(),
});
export type CreateMenuItemBodyType = z.TypeOf<typeof CreateMenuItemBody>;

export const UpdateMenuItemBody = CreateMenuItemBody;
export type UpdateMenuItemBodyType = CreateMenuItemBodyType;
