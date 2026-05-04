import z from 'zod';

export const BaseSearchRequest = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  cursor: z.coerce.bigint().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type BaseSearchRequestType = z.TypeOf<typeof BaseSearchRequest>;

export const CategoryBaseSearchRequest = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  cursor: z.coerce.bigint().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  categoryId: z.coerce.number().optional(),
});

export type CategoryBaseSearchRequestType = z.TypeOf<
  typeof CategoryBaseSearchRequest
>;

export const BaseListRes = z.object({
  data: z.array(z.any()),
  limit: z.number(),
  nextCursor: z.bigint().nullable,
  hasNextPage: z.boolean(),
});
export type BaseListResType = z.TypeOf<typeof BaseListRes>;
