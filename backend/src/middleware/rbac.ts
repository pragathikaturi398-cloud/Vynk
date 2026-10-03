import { Response, NextFunction } from 'express';
import { Role } from '../types';
import { AuthenticatedRequest } from './auth';

/**
 * Enforces that the authenticated user possesses one of the allowed roles
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated access.' });
      return;
    }

    const userRole = req.user.role as Role;
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${userRole}' does not have sufficient permissions for this resource.`,
      });
      return;
    }

    next();
  };
}
