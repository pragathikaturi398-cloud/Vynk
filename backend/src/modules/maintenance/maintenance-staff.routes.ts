import { Router } from 'express';
import { MaintenanceStaffController } from './maintenance-staff.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateRequest } from '../../middleware/validate';
import {
  CreateMaintenanceStaffDto,
  UpdateMaintenanceStaffDto,
  ToggleStaffStatusDto,
  ResetStaffPasswordDto,
} from './maintenance-staff.dto';
import { Role } from '../../types';

const router = Router();

// Exclusively Super Admin can manage maintenance accounts
router.use(authenticate);
router.use(requireRole(Role.SUPERADMIN));

router.get('/', MaintenanceStaffController.listStaff);
router.post('/', validateRequest({ body: CreateMaintenanceStaffDto }), MaintenanceStaffController.createStaff);
router.put('/:id', validateRequest({ body: UpdateMaintenanceStaffDto }), MaintenanceStaffController.updateStaff);
router.patch('/:id/status', validateRequest({ body: ToggleStaffStatusDto }), MaintenanceStaffController.toggleStatus);
router.post('/:id/reset-password', validateRequest({ body: ResetStaffPasswordDto }), MaintenanceStaffController.resetPassword);

export default router;
