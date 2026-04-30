import { Router } from 'express';
import { sendResponse } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Server health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running normally
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/health', (_req, res) => {
  sendResponse(res, {
    message: 'Máy chủ hoạt động bình thường',
    message_en: 'Server is running well!',
    data: { timestamp: new Date().toISOString() },
  });
});

export default router;
