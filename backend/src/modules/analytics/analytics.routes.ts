import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';

const router = Router();

router.use(authenticate);

router.get(
  '/overview',
  requireRole(Role.MAINTENANCE, Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.getOverview
);

router.get(
  '/by-hostel',
  requireRole(Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.getByHostel
);

router.get(
  '/by-category',
  requireRole(Role.MAINTENANCE, Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.getByCategory
);

router.get(
  '/recurring',
  requireRole(Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.getRecurring
);

router.get(
  '/workload',
  requireRole(Role.MAINTENANCE, Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.getWorkload
);

router.get(
  '/resolution-time',
  requireRole(Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.getResolutionTime
);

router.get(
  '/insights',
  requireRole(Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.getInsights
);

router.post(
  '/insights/generate',
  requireRole(Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.generateInsight
);

router.get(
  '/export',
  requireRole(Role.WARDEN, Role.SUPERADMIN),
  AnalyticsController.exportReport
);

export default router;
