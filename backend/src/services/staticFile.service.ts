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

/**
 * Creates a multer DiskStorage engine that saves files into
 * `uploads/<subfolder>/` (or `uploads/` if no subfolder given).
 * The destination directory is created automatically if it does not exist.
 */
function createStorage(subfolder?: string): multer.StorageEngine {
  const dest = subfolder ? path.join(UPLOADS_DIR, subfolder) : UPLOADS_DIR;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
}

/**
 * Returns a multer instance that accepts any supported file type (max 10 MB).
 * @param subfolder Optional sub-directory inside `uploads/` (e.g. `'users'`).
 */
export function createUploader(subfolder?: string) {
  return multer({
    storage: createStorage(subfolder),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError(415, `Loại file không được hỗ trợ: ${file.mimetype}`));
      }
    },
  });
}

/**
 * Returns a multer instance that accepts image files only (max 5 MB).
 * @param subfolder Optional sub-directory inside `uploads/` (e.g. `'users'`).
 */
export function createImageUploader(subfolder?: string) {
  return multer({
    storage: createStorage(subfolder),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (IMAGE_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError(415, 'Chỉ chấp nhận file ảnh (jpg, png, gif, webp, svg, bmp)'));
      }
    },
  });
}

// Pre-built uploaders — generic (no subfolder, saves to uploads/)
export const upload = createUploader();
export const uploadImage = createImageUploader();

// Pre-built uploaders — per-entity subfolders
export const uploadUserImage = createImageUploader('users');
export const uploadCategoryImage = createImageUploader('categories');
export const uploadMenuItemImage = createImageUploader('menu_items');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFileUrl(relPath: string): string {
  const port = process.env.PORT || 3001;
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  return `${baseUrl}/uploads/${relPath}`;
}

/**
 * Extracts the path segment after `/uploads/` from a full URL or relative path.
 * Examples:
 *   http://localhost:3001/uploads/users/uuid.jpg  →  users/uuid.jpg
 *   uploads/menu_items/uuid.png                   →  menu_items/uuid.png
 *   uuid.jpg                                      →  uuid.jpg
 */
function extractRelativePath(fileUrl: string): string {
  try {
    const urlPath = new URL(fileUrl).pathname; // e.g. /uploads/users/uuid.jpg
    const prefix = '/uploads/';
    if (urlPath.startsWith(prefix)) return urlPath.slice(prefix.length);
    return path.basename(urlPath);
  } catch {
    const normalized = fileUrl.replace(/\\/g, '/');
    const prefix = 'uploads/';
    if (normalized.startsWith(prefix)) return normalized.slice(prefix.length);
    return path.basename(normalized);
  }
}

/**
 * Resolves a relative path (e.g. `users/uuid.jpg`) to an absolute path
 * under UPLOADS_DIR, rejecting any path-traversal attempts.
 */
function resolveFilePath(relPath: string): string {
  const resolved = path.resolve(UPLOADS_DIR, relPath);
  if (!resolved.startsWith(UPLOADS_DIR)) {
    throw new AppError(400, 'Đường dẫn file không hợp lệ');
  }
  return resolved;
}

/**
 * Returns the path of a multer file relative to UPLOADS_DIR, using forward slashes.
 * e.g. `users/uuid.jpg` or `uuid.jpg`
 */
function fileRelativePath(file: Express.Multer.File): string {
  return path.relative(UPLOADS_DIR, file.path).replace(/\\/g, '/');
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const staticFileService = {
  /**
   * Returns the public URL for an already-uploaded file.
   * Handles files in any subfolder (e.g. uploads/users/uuid.jpg → http://…/uploads/users/uuid.jpg).
   */
  getUrl(file: Express.Multer.File): string {
    return buildFileUrl(fileRelativePath(file));
  },

  /**
   * Returns the portable relative path for DB storage.
   * e.g. `uploads/users/uuid.jpg` or `uploads/uuid.jpg`
   */
  getPath(file: Express.Multer.File): string {
    return `uploads/${fileRelativePath(file)}`;
  },

  /**
   * Deletes a file given its public URL or relative path.
   * Supports subfolders: `http://…/uploads/users/uuid.jpg` or `uploads/users/uuid.jpg`.
   * Returns the deleted URL/path.
   */
  delete(fileUrl: string): string {
    const relPath = extractRelativePath(fileUrl);
    const filePath = resolveFilePath(relPath);

    if (!fs.existsSync(filePath)) {
      throw new AppError(404, 'File không tồn tại');
    }

    fs.unlinkSync(filePath);
    return fileUrl;
  },

  /**
   * Replaces an existing file with a new upload.
   * Deletes the old file (silently ignores missing) and returns the new file's URL.
   */
  replace(oldFileUrl: string, newFile: Express.Multer.File): string {
    try {
      const oldPath = resolveFilePath(extractRelativePath(oldFileUrl));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    } catch {
      // If the old file doesn't exist or URL is invalid, continue anyway
    }

    return buildFileUrl(fileRelativePath(newFile));
  },
};
