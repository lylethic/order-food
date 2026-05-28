import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import type { UpsertRestaurantLocationBodyType } from '../schemas/validation.js';

// ── In-memory TTL cache (1 minute) ───────────────────────────────────────────

interface CachedLocation {
  id: bigint;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  geofence_enabled: boolean;
  active: boolean;
  created: Date;
  updated: Date | null;
}

let cache: { data: CachedLocation; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

function invalidateCache() {
  cache = null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const restaurantLocationService = {
  /**
   * Returns the single active restaurant location (with geofence flag).
   * Results are cached for 1 minute to avoid a DB hit on every order.
   * Throws AppError(404) if no active location exists.
   */
  async getActive(): Promise<CachedLocation> {
    const now = Date.now();

    // Return cached value while still fresh
    if (cache && now < cache.expiresAt) {
      return cache.data;
    }

    const location = await prisma.restaurantLocation.findFirst({
      where: { active: true },
      orderBy: { updated: 'desc' },
    });

    if (!location) {
      throw new AppError(
        404,
        'Chưa cấu hình vị trí nhà hàng. Vui lòng liên hệ quản trị viên.',
      );
    }

    cache = { data: location as CachedLocation, expiresAt: now + CACHE_TTL_MS };
    return cache.data;
  },

  /**
   * Deactivates all existing location rows, then inserts a new active one.
   * Invalidates the in-memory cache immediately so the next order uses the
   * updated location.
   */
  async upsert(
    dto: UpsertRestaurantLocationBodyType,
    updatedBy?: bigint,
  ): Promise<CachedLocation> {
    // Fetch current geofence_enabled state to preserve it across location updates
    const current = await prisma.restaurantLocation.findFirst({
      where: { active: true },
      select: { geofence_enabled: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      // Deactivate all current rows
      await tx.restaurantLocation.updateMany({
        where: { active: true },
        data: { active: false, updated_by: updatedBy ?? null },
      });

      // Insert the new active location
      return tx.restaurantLocation.create({
        data: {
          name: dto.name ?? 'Main Branch',
          latitude: dto.latitude,
          longitude: dto.longitude,
          radius_meters: dto.radius_meters ?? 50,
          // preserve existing geofence toggle, default true
          geofence_enabled: current?.geofence_enabled ?? true,
          active: true,
          created_by: updatedBy ?? null,
          updated_by: updatedBy ?? null,
        },
      });
    });

    invalidateCache();
    return result as CachedLocation;
  },

  /**
   * Flips the geofence_enabled flag on the active row without changing
   * any other fields. Cache is invalidated immediately.
   */
  async toggleGeofence(
    enabled: boolean,
    updatedBy?: bigint,
  ): Promise<CachedLocation> {
    const current = await prisma.restaurantLocation.findFirst({
      where: { active: true },
      orderBy: { updated: 'desc' },
    });

    if (!current) {
      throw new AppError(
        404,
        'Chưa cấu hình vị trí nhà hàng. Vui lòng liên hệ quản trị viên.',
      );
    }

    const updated = await prisma.restaurantLocation.update({
      where: { id: current.id },
      data: { geofence_enabled: enabled, updated_by: updatedBy ?? null },
    });

    invalidateCache();
    return updated as CachedLocation;
  },
};
