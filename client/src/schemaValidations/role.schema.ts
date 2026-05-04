import z from 'zod';

export const RoleItem = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  isDeleted: z.boolean(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type RoleItemType = z.TypeOf<typeof RoleItem>;

export const RoleListRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.object({
    items: z.array(RoleItem),
    page: z.object({
      limit: z.number(),
      nextCursor: z.string().nullable(),
      hasNextPage: z.boolean(),
    }),
  }),
  errors: z.array(z.any()).optional(),
});
export type RoleListResType = z.TypeOf<typeof RoleListRes>;

// ── Restaurant: Role (matches /api/v1/roles response) ────────────────────────

export const RestaurantRole = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  deleted: z.boolean(),
});
export type RestaurantRoleType = z.TypeOf<typeof RestaurantRole>;

export const RestaurantRoleListRes = z.object({
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
export type RestaurantRoleListResType = z.TypeOf<typeof RestaurantRoleListRes>;

// Legacy alias – keeps existing code that imports roleSchemaResType compiling
/** @deprecated Use RoleItemType */
export type roleSchemaResType = RoleItemType;
