import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refresh(refreshToken);
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const me = await AuthService.getMe(req.user.userId);
      res.status(200).json({
        success: true,
        data: me,
      });
    } catch (error) {
      next(error);
    }
  }
}
