import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AnalyticsService } from './analytics.service';
import { prisma } from '../../config/prisma';

export class AnalyticsController {
  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getOverview(req.user?.hostelId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getByHostel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getByHostel();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getByCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getByCategory();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getRecurring(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getRecurringIssues();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getWorkload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getWorkload();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getResolutionTime(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getResolutionTimeBreakdown();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const insights = await prisma.insight.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
      });
      res.status(200).json({ success: true, data: insights });
    } catch (error) {
      next(error);
    }
  }

  static async generateInsight(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const insight = await AnalyticsService.generateInsights();
      res.status(201).json({ success: true, data: insight });
    } catch (error) {
      next(error);
    }
  }

  static async exportReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const complaints = await prisma.complaint.findMany({
        include: {
          student: { select: { name: true, email: true } },
          category: { select: { name: true } },
          subcategory: { select: { name: true } },
          room: {
            include: {
              floor: {
                include: { block: { include: { hostel: true } } },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      // CSV export
      const headers = ['ID', 'Hostel', 'Room', 'Category', 'Subcategory', 'Severity', 'Status', 'Student', 'Created At'];
      const rows = complaints.map((c) => [
        c.id,
        `"${c.room.floor.block.hostel.name}"`,
        `"${c.room.room_no}"`,
        `"${c.category.name}"`,
        `"${c.subcategory.name}"`,
        c.severity,
        c.status,
        `"${c.student.name}"`,
        c.created_at.toISOString(),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vynk-complaints-report.csv"');
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  static async getSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getSuperAdminMetrics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
