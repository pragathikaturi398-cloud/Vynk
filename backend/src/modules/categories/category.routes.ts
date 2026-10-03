import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';

const router = Router();

router.use(authenticate);

router.get('/categories', CategoryController.getCategories);
router.post('/categories', requireRole(Role.WARDEN, Role.SUPERADMIN), CategoryController.createCategory);

router.get('/subcategories', CategoryController.getSubcategories);

router.get('/teams', CategoryController.getTeams);
router.post('/teams', requireRole(Role.WARDEN, Role.SUPERADMIN), CategoryController.createTeam);

export default router;
