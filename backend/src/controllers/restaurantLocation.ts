import { Router } from 'express';
import { restaurantLocationService } from '../services/restaurantLocation.service.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import {
  UpsertRestaurantLocationSchema,
  ToggleGeofenceSchema,
} from '../schemas/validation.js';
import { sendResponse, handleRouteError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/v1/restaurant/location:
 *   get:
 *     summary: Get the active restaurant GPS location
 *     tags: [Restaurant]
 *     description: >
 *       Public endpoint. Returns the currently active restaurant location
 *       (latitude, longitude, radius_meters, geofence_enabled).
 *     responses:
 *       200:
 *         description: Active restaurant location
 *       404:
 *         description: No location configured yet
 */
router.get('/restaurant/location', async (_req, res) => {
  try {
    const data = await restaurantLocationService.getActive();
    sendResponse(res, {
      message: 'Lấy vị trí nhà hàng thành công',
      message_en: 'Restaurant location retrieved successfully',
      data: {
        id: data.id.toString(),
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        radius_meters: data.radius_meters,
        geofence_enabled: data.geofence_enabled,
      },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/restaurant/location:
 *   put:
 *     summary: Update the restaurant GPS location (Admin)
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Admin-only. Replaces the active location row. The geofence_enabled
 *       flag is preserved from the previous row.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               name:          { type: string, maxLength: 100 }
 *               latitude:      { type: number, minimum: -90,  maximum: 90 }
 *               longitude:     { type: number, minimum: -180, maximum: 180 }
 *               radius_meters: { type: integer, minimum: 10,  maximum: 10000 }
 *     responses:
 *       200:
 *         description: Location updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin role required
 */
router.put('/restaurant/location', authenticate, isAdmin, async (req, res) => {
  try {
    const dto = UpsertRestaurantLocationSchema.parse(req.body);
    const updatedBy = BigInt(req.user!.userId);
    const data = await restaurantLocationService.upsert(dto, updatedBy);
    sendResponse(res, {
      message: 'Cập nhật vị trí nhà hàng thành công',
      message_en: 'Restaurant location updated successfully',
      data: {
        id: data.id.toString(),
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        radius_meters: data.radius_meters,
        geofence_enabled: data.geofence_enabled,
      },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/restaurant/location/geofence:
 *   patch:
 *     summary: Enable or disable the geofence check (Admin)
 *     tags: [Restaurant]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Admin-only. Flips the geofence_enabled flag on the active location row.
 *       When disabled, customers can place orders from anywhere; coordinates
 *       are still accepted but the distance check is skipped on the server.
 *       The in-memory cache is invalidated immediately (takes effect within 1 min).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled: { type: boolean }
 *           example:
 *             enabled: false
 *     responses:
 *       200:
 *         description: Geofence flag updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin role required
 *       404:
 *         description: No active location configured
 */
router.patch(
  '/restaurant/location/geofence',
  authenticate,
  isAdmin,
  async (req, res) => {
    try {
      const { enabled } = ToggleGeofenceSchema.parse(req.body);
      const updatedBy = BigInt(req.user!.userId);
      const data = await restaurantLocationService.toggleGeofence(
        enabled,
        updatedBy,
      );
      sendResponse(res, {
        message: enabled
          ? 'Đã bật kiểm tra vị trí GPS'
          : 'Đã tắt kiểm tra vị trí GPS',
        message_en: enabled
          ? 'Geofence check enabled'
          : 'Geofence check disabled',
        data: {
          id: data.id.toString(),
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          radius_meters: data.radius_meters,
          geofence_enabled: data.geofence_enabled,
        },
      });
    } catch (err) {
      handleRouteError(err, res);
    }
  },
);

export default router;
