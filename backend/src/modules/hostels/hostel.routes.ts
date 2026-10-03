import { Router } from 'express';
import { HostelController } from './hostel.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';

const router = Router();

router.use(authenticate);

// Hostels
router.get('/hostels', HostelController.getHostels);
router.post('/hostels', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.createHostel);
router.delete('/hostels/:id', requireRole(Role.SUPERADMIN), HostelController.deleteHostel);

// Blocks
router.get('/blocks', HostelController.getBlocks);
router.post('/blocks', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.createBlock);
router.delete('/blocks/:id', requireRole(Role.SUPERADMIN), HostelController.deleteBlock);

// Floors
router.post('/floors', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.createFloor);
router.delete('/floors/:id', requireRole(Role.SUPERADMIN), HostelController.deleteFloor);

// Rooms
router.get('/rooms', HostelController.getRooms);
router.post('/rooms', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.createRoom);
router.delete('/rooms/:id', requireRole(Role.SUPERADMIN), HostelController.deleteRoom);
router.get('/rooms/my', HostelController.getMyRoom);

// Allocations
router.get('/room-allocations', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.getAllAllocations);
router.post('/room-allocations', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.allocateRoom);
router.delete('/room-allocations/:id', requireRole(Role.WARDEN, Role.SUPERADMIN), HostelController.deleteRoomAllocation);

export default router;
