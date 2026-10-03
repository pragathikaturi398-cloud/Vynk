import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { RegisterDto, LoginDto, RefreshDto } from './auth.dto';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', validateRequest({ body: RegisterDto }), AuthController.register);
router.post('/login', validateRequest({ body: LoginDto }), AuthController.login);
router.post('/refresh', validateRequest({ body: RefreshDto }), AuthController.refresh);
router.get('/me', authenticate, AuthController.getMe);

export default router;
