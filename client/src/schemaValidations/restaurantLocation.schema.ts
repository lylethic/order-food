import z from 'zod';

// ── Response shape ────────────────────────────────────────────────────────────

export const RestaurantLocation = z.object({
  id: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radius_meters: z.number(),
  geofence_enabled: z.boolean(),
});
export type RestaurantLocationType = z.TypeOf<typeof RestaurantLocation>;

export const RestaurantLocationRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: RestaurantLocation.nullable(),
  errors: z.array(z.any()).optional(),
});
export type RestaurantLocationResType = z.TypeOf<typeof RestaurantLocationRes>;

// ── Request body ──────────────────────────────────────────────────────────────

export const UpsertRestaurantLocationBody = z.object({
  name: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_meters: z.number().int().min(10).max(10_000).optional(),
});
export type UpsertRestaurantLocationBodyType = z.TypeOf<
  typeof UpsertRestaurantLocationBody
>;
