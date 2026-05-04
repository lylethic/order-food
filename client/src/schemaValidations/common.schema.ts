import z from 'zod';

export const apiCommonRes = <T extends z.ZodTypeAny = z.ZodAny>(
  dataSchema?: T,
) => {
  return z
    .object({
      httpSatus: z.number(),
      isSuccess: z.boolean(),
      message: z.string(),
      responseData: dataSchema ? dataSchema.optional() : z.any().optional(),
    })
    .strict();
};

export type apiCommonResType<T extends z.ZodTypeAny = z.ZodAny> = z.TypeOf<
  ReturnType<typeof apiCommonRes<T>>
>;

/**
 * Cursor based pagination response schema
 */
export const apiResponseRes = <T extends z.ZodTypeAny = z.ZodAny>(
  dataSchema: T,
) => {
  return z.object({
    httpStatus: z.number(),
    isSuccess: z.boolean(),
    responseData: z.object({
      data: dataSchema ? dataSchema.optional() : z.any().optional(),
      nextCursor: z.string().nullable(),
      nextCursorSortOrder: z.any().nullable(),
      hasNextPage: z.boolean(),
    }),
    errorCode: z.string().optional(),
    message: z.string(),
  });
};
export type apiResponseType<T extends z.ZodTypeAny = z.ZodAny> = z.TypeOf<
  ReturnType<typeof apiResponseRes<T>>
>;

/*
 *Pagination fields (common in lists, often null/omitted in single objects)
 */
const paginationApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    httpStatus: z.number(),
    isSuccess: z.boolean(),
    responseData: z
      .object({
        totalCount: z.number().nullable().optional(),
        page: z.number().nullable().optional(),
        pageSize: z.number().nullable().optional(),
        totalPages: z.number().nullable().optional(),
        hasNextPage: z.boolean().optional(),
        hasPreviousPage: z.boolean().optional(),

        data: z.union([dataSchema, z.array(dataSchema)]),
      })
      .passthrough(), // .passthrough() allows extra unexpected fields without failing
    errorCode: z.string().nullable().optional(),
    message: z.string(),
  });
};

export type PaginationApiResponseType<T extends z.ZodTypeAny> = z.TypeOf<
  ReturnType<typeof paginationApiResponseSchema<T>>
>;

// Treat "" as undefined (Swagger UIs often send empty strings)
export const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema);

export const zBoolFromQuery = z.preprocess((v) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0') return false;
  }
  return v; // let Zod raise a validation error
}, z.boolean());

export const zIntFromQuery = z.preprocess((v) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().int());
