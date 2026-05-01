import { Router } from 'express';
import { tableService } from '../services/table.service.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import { sendResponse, handleRouteError } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

/**
 * @swagger
 * /api/v1/tables/verify:
 *   get:
 *     summary: Verify a QR token for a table
 *     tags: [Tables]
 *     description: >
 *       Public endpoint. Verifies the HMAC token embedded in a QR code URL.
 *       Returns { valid, tableNumber }.
 *     parameters:
 *       - in: query
 *         name: table
 *         required: true
 *         schema: { type: string }
 *         description: Table number (e.g. "5")
 *       - in: query
 *         name: sid
 *         required: true
 *         schema: { type: string }
 *         description: 16-char HMAC token from QR URL
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid: { type: boolean }
 *                 tableNumber: { type: string, nullable: true }
 *       400:
 *         description: Missing or invalid parameters
 */
router.get('/tables/verify', (req, res) => {
  try {
    const table = String(req.query.table ?? '').trim();
    const sid = String(req.query.sid ?? '').trim();

    if (!table || !sid) {
      throw new AppError(400, 'Thiếu tham số table hoặc sid');
    }

    tableService.validateTableNumber(table);

    const valid = tableService.verifyToken(table, sid);
    sendResponse(res, {
      message: valid ? 'Token hợp lệ' : 'Token không hợp lệ',
      message_en: valid ? 'Token valid' : 'Token invalid',
      data: { valid, tableNumber: valid ? table : null },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/tables/{tableNumber}/qr:
 *   post:
 *     summary: Generate QR URL for a single table (Admin)
 *     tags: [Tables]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: tableNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: QR URL and token generated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin only
 */
router.post('/tables/:tableNumber/qr', authenticate, isAdmin, (req, res) => {
  try {
    const tableNumber = String(req.params.tableNumber).trim();
    tableService.validateTableNumber(tableNumber);

    const url = tableService.generateQrUrl(tableNumber);
    const token = tableService.generateToken(tableNumber);

    sendResponse(res, {
      message: 'Tạo QR thành công',
      message_en: 'QR generated successfully',
      data: { tableNumber, url, token },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/tables/qr/batch:
 *   post:
 *     summary: Batch generate QR URLs (Admin)
 *     tags: [Tables]
 *     security: [{ bearerAuth: [] }]
 *     description: >
 *       Accepts either a numeric range { from, to } or an explicit list
 *       { tables: ["1","2","VIP-1"] }. Maximum 300 tables per request.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   from: { type: integer, minimum: 1 }
 *                   to: { type: integer, minimum: 1 }
 *               - type: object
 *                 properties:
 *                   tables: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Array of { tableNumber, url, token }
 *       400:
 *         description: Invalid range or list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin only
 */
router.post('/tables/qr/batch', authenticate, isAdmin, (req, res) => {
  try {
    const body = req.body as {
      from?: number;
      to?: number;
      tables?: string[];
    };

    let tableNumbers: string[];

    if (Array.isArray(body.tables) && body.tables.length > 0) {
      if (body.tables.length > 300) {
        throw new AppError(400, 'Tối đa 300 bàn mỗi lần');
      }
      tableNumbers = body.tables.map(String);
    } else if (body.from != null && body.to != null) {
      const from = Number(body.from);
      const to = Number(body.to);
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
        throw new AppError(400, 'Phạm vi không hợp lệ (from ≥ 1, to ≥ from)');
      }
      if (to - from + 1 > 300) {
        throw new AppError(400, 'Tối đa 300 bàn mỗi lần');
      }
      tableNumbers = Array.from({ length: to - from + 1 }, (_, i) =>
        String(from + i),
      );
    } else {
      throw new AppError(
        400,
        'Cần cung cấp { from, to } hoặc { tables: [...] }',
      );
    }

    const tables = tableNumbers.map((tableNumber) => {
      tableService.validateTableNumber(tableNumber);
      return {
        tableNumber,
        url: tableService.generateQrUrl(tableNumber),
        token: tableService.generateToken(tableNumber),
      };
    });

    sendResponse(res, {
      message: `Tạo QR cho ${tables.length} bàn thành công`,
      message_en: `QR generated for ${tables.length} tables`,
      data: { tables },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
