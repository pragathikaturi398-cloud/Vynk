import { Router } from 'express';
import { ComplaintController } from './complaint.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { upload } from '../../middleware/upload';
import { Role } from '../../types';

const router = Router();

router.use(authenticate);

// Submit complaint (Student)
router.post(
  '/',
  requireRole(Role.STUDENT),
  upload.array('attachments', 5),
  ComplaintController.createComplaint
);

// Search & list complaints
router.get('/', ComplaintController.getComplaints);

// View complaint details & timeline
router.get('/:id', ComplaintController.getComplaintById);

// Update status (Maintenance, Warden, Super Admin)
router.patch(
  '/:id/status',
  requireRole(Role.MAINTENANCE, Role.WARDEN, Role.SUPERADMIN),
  ComplaintController.updateStatus
);

// Reassign / Override AI triage (Warden, Super Admin)
router.patch(
  '/:id/assign',
  requireRole(Role.WARDEN, Role.SUPERADMIN),
  ComplaintController.assignComplaint
);

// Student feedback rating
router.post(
  '/:id/feedback',
  requireRole(Role.STUDENT),
  ComplaintController.addFeedback
);

// Student reopen
router.post(
  '/:id/reopen',
  requireRole(Role.STUDENT),
  ComplaintController.reopenComplaint
);

export default router;
