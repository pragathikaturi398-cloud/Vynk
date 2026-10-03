import { Router } from 'express';
import { HostelController } from './hostel.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';

const router = Router();

router.use(authenticate);

router.get('/hostels', HostelController.getHostels);
router.post('/hostels', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.createHostel);

router.get('/blocks', HostelController.getBlocks);
router.get('/rooms', HostelController.getRooms);
router.get('/rooms/my', HostelController.getMyRoom);
router.post('/room-allocations', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.allocateRoom);

export default router;
