import { Router } from 'express';
import { upload, staticFileService } from '../services/staticFile.service.js';
import { sendResponse, handleRouteError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     description: Upload a single file (image, pdf, docx, xlsx, ...). Max 10 MB.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: http://localhost:3001/uploads/uuid.jpg
 *       400:
 *         description: No file provided
 *       415:
 *         description: Unsupported file type
 */
router.post('/files/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const url = staticFileService.getUrl(req.file);
    sendResponse(res, {
      message: 'Tải file lên thành công',
      message_en: 'File uploaded successfully',
      data: { url },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/files/delete:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     description: Delete a file by its public URL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 example: http://localhost:3001/uploads/uuid.jpg
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete('/files/delete', (req, res) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url) throw new Error('Missing url in request body');
    const deleted = staticFileService.delete(url);
    sendResponse(res, {
      message: 'Xóa file thành công',
      message_en: 'File deleted successfully',
      data: { url: deleted },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/files/replace:
 *   put:
 *     summary: Replace a file
 *     tags: [Files]
 *     description: Upload a new file and delete the old one. Send old URL as form field `oldUrl`.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, oldUrl]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               oldUrl:
 *                 type: string
 *                 example: http://localhost:3001/uploads/uuid.jpg
 *     responses:
 *       200:
 *         description: File replaced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: http://localhost:3001/uploads/new-uuid.jpg
 *       400:
 *         description: Missing file or oldUrl
 *       415:
 *         description: Unsupported file type
 */
router.put('/files/replace', upload.single('file'), (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const oldUrl = (req.body as { oldUrl?: string }).oldUrl;
    if (!oldUrl) throw new Error('Missing oldUrl in form data');
    const url = staticFileService.replace(oldUrl, req.file);
    sendResponse(res, {
      message: 'Thay thế file thành công',
      message_en: 'File replaced successfully',
      data: { url },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
