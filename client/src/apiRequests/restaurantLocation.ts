import http from '@/lib/http';
import type {
  RestaurantLocationResType,
  UpsertRestaurantLocationBodyType,
} from '@/schemaValidations/restaurantLocation.schema';

const restaurantLocationApiRequest = {
  /** Public — returns the active restaurant GPS location */
  get: () =>
    http.get<RestaurantLocationResType>('api/v1/restaurant/location', {
      cache: 'no-store',
    }),

  /** Admin only — update the restaurant GPS location */
  update: (body: UpsertRestaurantLocationBodyType) =>
    http.put<RestaurantLocationResType>('api/v1/restaurant/location', body),

  /** Admin only — enable or disable the geofence check */
  toggleGeofence: (enabled: boolean) =>
    http.patch<RestaurantLocationResType>('api/v1/restaurant/location/geofence', { enabled }),
};

export default restaurantLocationApiRequest;
