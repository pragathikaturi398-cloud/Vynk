import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  /**
   * Student Sign Up (email + password only)
   */
  static async studentSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.registerStudent(email, password);
      res.status(201).json({
        success: true,
        message: 'Account created successfully. Please complete your profile.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student First Login Profile Onboarding
   */
  static async studentOnboarding(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, studentId, hostelName, roomNumber } = req.body;
      const result = await AuthService.completeStudentOnboarding(userId, {
        name,
        studentId,
        hostelName,
        roomNumber,
      });

      res.status(200).json({
        success: true,
        message: 'Student profile setup completed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Super Admin First-time Password Setup
   */
  static async setPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.setFirstTimePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Universal Login
   */
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
