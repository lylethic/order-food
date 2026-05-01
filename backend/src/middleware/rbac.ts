import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';

/**
 * Role-based access control middleware.
 * Must be used AFTER `authenticate` so that `req.user` is populated.
 */
export function checkRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const raw = req.user?.role;
    const roles = Array.isArray(raw)
      ? raw.map((r) => r.toLowerCase())
      : raw
        ? [raw.toLowerCase()]
        : [];

    if (roles.length === 0 || !roles.some((r) => allowedRoles.includes(r))) {
      sendResponse(res, {
        success: false,
        status_code: 403,
        message: 'Không có quyền truy cập',
        message_en: 'Forbidden',
        errors: [`Required roles: ${allowedRoles.join(', ')}`],
      });
      return;
    }

    next();
  };
}

export const isAdmin = checkRole(['admin']);
export const isStaff = checkRole(['admin', 'employee', 'chef']);
export const isChef = checkRole(['admin', 'chef']);
export const isEmployee = checkRole(['admin', 'employee']);
export const isCustomer = checkRole(['customer']);
