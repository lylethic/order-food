import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  'text/csv',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
]);

// ─── Multer setup ─────────────────────────────────────────────────────────────

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomUUID();
    cb(null, `${unique}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(415, `Loại file không được hỗ trợ: ${file.mimetype}`));
    }
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB for images
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(415, 'Chỉ chấp nhận file ảnh (jpg, png, gif, webp, svg, bmp)'));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFileUrl(filename: string): string {
  const port = process.env.PORT || 3001;
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  return `${baseUrl}/uploads/${filename}`;
}

function extractFilename(fileUrl: string): string {
  // Handles both full URL (http://host/uploads/x.png) and relative path (uploads/x.png)
  try {
    return path.basename(new URL(fileUrl).pathname);
  } catch {
    return path.basename(fileUrl);
  }
}

function resolveFilePath(filename: string): string {
  // Prevent path traversal attacks
  const resolved = path.resolve(UPLOADS_DIR, filename);
  if (!resolved.startsWith(UPLOADS_DIR)) {
    throw new AppError(400, 'Đường dẫn file không hợp lệ');
  }
  return resolved;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const staticFileService = {
  /**
   * Returns the public URL for an already-uploaded file.
   * Called after multer has saved the file to disk.
   */
  getUrl(file: Express.Multer.File): string {
    return buildFileUrl(file.filename);
  },

  /**
   * Returns only the relative path (e.g. uploads/uuid.png).
   * Use this when you want to store a portable path instead of a full URL.
   */
  getPath(file: Express.Multer.File): string {
    return `uploads/${file.filename}`;
  },

  /**
   * Deletes a file by its public URL.
   * Returns the deleted URL.
   */
  delete(fileUrl: string): string {
    const filename = extractFilename(fileUrl);
    const filePath = resolveFilePath(filename);

    if (!fs.existsSync(filePath)) {
      throw new AppError(404, 'File không tồn tại');
    }

    fs.unlinkSync(filePath);
    return fileUrl;
  },

  /**
   * Replaces an existing file with a new upload.
   * Deletes the old file and returns the new file's URL.
   */
  replace(oldFileUrl: string, newFile: Express.Multer.File): string {
    try {
      const oldFilename = extractFilename(oldFileUrl);
      const oldPath = resolveFilePath(oldFilename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    } catch {
      // If the old file doesn't exist or URL is invalid, continue anyway
    }

    return buildFileUrl(newFile.filename);
  },
};
