import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../types';

const router = Router();

router.use(authenticate);

// Categories
router.get('/categories', CategoryController.getCategories);
router.post('/categories', requireRole(Role.WARDEN, Role.SUPERADMIN), CategoryController.createCategory);
router.delete('/categories/:id', requireRole(Role.SUPERADMIN), CategoryController.deleteCategory);

// Subcategories
router.get('/subcategories', CategoryController.getSubcategories);
router.post('/subcategories', requireRole(Role.WARDEN, Role.SUPERADMIN), CategoryController.createSubcategory);
router.delete('/subcategories/:id', requireRole(Role.SUPERADMIN), CategoryController.deleteSubcategory);

// Teams
router.get('/teams', CategoryController.getTeams);
router.post('/teams', requireRole(Role.WARDEN, Role.SUPERADMIN), CategoryController.createTeam);
router.delete('/teams/:id', requireRole(Role.SUPERADMIN), CategoryController.deleteTeam);

// Team Members
router.post('/teams/:id/members', requireRole(Role.WARDEN, Role.SUPERADMIN), CategoryController.addTeamMember);
router.delete('/teams/:id/members/:userId', requireRole(Role.WARDEN, Role.SUPERADMIN), CategoryController.removeTeamMember);

export default router;
