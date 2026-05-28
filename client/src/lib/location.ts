/**
 * GPS / geofencing helpers for the customer-facing app.
 *
 * The restaurant's latitude, longitude, and allowed radius are fetched from
 * the backend API (GET /api/v1/restaurant/location) so the admin can update
 * them without redeploying. Results are cached client-side for 5 minutes.
 */

import restaurantLocationApiRequest from '@/apiRequests/restaurantLocation';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RestaurantConfig {
  latitude: number;
  longitude: number;
  radius_meters: number;
  name: string;
  geofence_enabled: boolean;
}

// ── Client-side cache (5-minute TTL) ─────────────────────────────────────────

let configCache: { data: RestaurantConfig; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the active restaurant location from the API.
 * Results are cached for 5 minutes so repeated calls within a session
 * do not trigger extra network requests.
 */
async function fetchRestaurantConfig(): Promise<RestaurantConfig> {
  const now = Date.now();

  if (configCache && now < configCache.expiresAt) {
    return configCache.data;
  }

  const res = await restaurantLocationApiRequest.get();
  const location = (res.payload as { data?: RestaurantConfig | null }).data;

  if (!location) {
    throw new Error(
      'Không thể tải thông tin vị trí nhà hàng. Vui lòng thử lại sau.',
    );
  }

  configCache = { data: location, expiresAt: now + CACHE_TTL_MS };
  return location;
}

// ── Haversine distance formula ────────────────────────────────────────────────

/**
 * Returns the distance in metres between two GPS coordinates.
 */
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Geolocation API wrapper ───────────────────────────────────────────────────

/**
 * Requests the user's current GPS coordinates via the browser Geolocation API.
 * Uses high-accuracy mode and times out after 10 seconds.
 *
 * @throws {Error} with a user-friendly Vietnamese message.
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(
        new Error(
          'Trình duyệt của bạn không hỗ trợ định vị GPS. Vui lòng thử trình duyệt khác.',
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let msg = 'Không thể xác định vị trí của bạn. Vui lòng thử lại.';
        if (error.code === error.PERMISSION_DENIED) {
          msg =
            'Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật Dịch vụ vị trí trong cài đặt trình duyệt để đặt món.';
        } else if (error.code === error.TIMEOUT) {
          msg =
            'Hết thời gian xác định vị trí. Vui lòng kiểm tra kết nối GPS và thử lại.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg =
            'Tín hiệu GPS không khả dụng. Vui lòng thử ở vị trí thoáng hơn.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    );
  });
}

// ── Main geofence check ───────────────────────────────────────────────────────

/**
 * Fetches the user's GPS coordinates and verifies they are within the allowed
 * radius configured in the database.
 *
 * @returns The user's coordinates on success.
 * @throws {Error} with a human-readable message when out of range or when
 *   the Geolocation API fails.
 */
export async function requireNearRestaurant(): Promise<Coordinates> {
  // Fetch configuration first
  const config = await fetchRestaurantConfig();

  // If geofence check is disabled globally, bypass check and return coordinates if possible
  if (!config.geofence_enabled) {
    try {
      return await getCurrentLocation();
    } catch {
      // Fallback to restaurant's coordinates so the order isn't blocked by missing location
      return {
        latitude: config.latitude,
        longitude: config.longitude,
      };
    }
  }

  // Geofence is enabled, strictly check coordinates
  const coords = await getCurrentLocation();

  const distance = getDistanceInMeters(
    coords.latitude,
    coords.longitude,
    config.latitude,
    config.longitude,
  );

  if (distance > config.radius_meters) {
    throw new Error(
      `Bạn đang ở cách nhà hàng ${Math.round(distance)}m. ` +
        `Bạn phải ở trong phạm vi ${config.radius_meters}m để đặt món.`,
    );
  }

  return coords;
}
