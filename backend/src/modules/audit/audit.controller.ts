import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';
import { Role } from '../../types';

export class AuditController {
  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { complaint_id, limit, offset } = req.query;

      let where: any = {};
      if (complaint_id) {
        where.complaint_id = String(complaint_id);
      }

      // If Warden, scope to their hostel
      if (req.user?.role === Role.WARDEN && req.user.hostelId) {
        where.complaint = { hostel_id: req.user.hostelId };
      }

      const logs = await prisma.complaintEvent.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
          complaint: {
            select: {
              id: true,
              title: true,
              severity: true,
              status: true,
              hostel: { select: { name: true } },
              room: { select: { room_no: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit ? parseInt(String(limit), 10) : 50,
        skip: offset ? parseInt(String(offset), 10) : 0,
      });

      const total = await prisma.complaintEvent.count({ where });

      res.status(200).json({ success: true, total, data: logs });
    } catch (error) {
      next(error);
    }
  }
}
