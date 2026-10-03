import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import {
  StudentSignUpDto,
  StudentOnboardingDto,
  SetPasswordDto,
  LoginDto,
  RefreshDto,
} from './auth.dto';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Student self-service signup (email + password only)
router.post('/student/signup', validateRequest({ body: StudentSignUpDto }), AuthController.studentSignUp);

// Student first-login onboarding (Name, Student ID, Hostel, Room)
router.post(
  '/student/onboarding',
  authenticate,
  validateRequest({ body: StudentOnboardingDto }),
  AuthController.studentOnboarding
);

// First-time password set for Super Admin / Staff
router.post(
  '/set-password',
  authenticate,
  validateRequest({ body: SetPasswordDto }),
  AuthController.setPassword
);

// Universal login (Students, Super Admin, Wardens, Maintenance Staff)
router.post('/login', validateRequest({ body: LoginDto }), AuthController.login);

// Token refresh & session restore
router.post('/refresh', validateRequest({ body: RefreshDto }), AuthController.refresh);
router.get('/me', authenticate, AuthController.getMe);

export default router;
