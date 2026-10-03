import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: { user_id: userId },
        include: {
          complaint: {
            select: { id: true, title: true, status: true, severity: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 30,
      });

      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      await prisma.notification.updateMany({
        where: { user_id: userId, read: false },
        data: { read: true },
      });
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
