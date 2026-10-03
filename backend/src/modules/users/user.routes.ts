import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateRequest } from '../../middleware/validate';
import { CreateUserDto, UpdateUserRoleDto } from './user.dto';
import { Role } from '../../types';

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.SUPERADMIN));

router.get('/', UserController.getUsers);
router.post('/', validateRequest({ body: CreateUserDto }), UserController.createUser);
router.put('/:id/role', validateRequest({ body: UpdateUserRoleDto }), UserController.updateUserRole);
router.delete('/:id', UserController.deleteUser);

export default router;
