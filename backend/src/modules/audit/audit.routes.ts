import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';

const router = Router();

router.use(authenticate);

// Section 8: View audit logs: Super Admin and Warden
router.get(
  '/',
  requireRole(Role.WARDEN, Role.SUPERADMIN),
  AuditController.getAuditLogs
);

export default router;
