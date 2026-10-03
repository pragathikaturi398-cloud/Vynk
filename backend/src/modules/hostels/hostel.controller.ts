import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';
import { Role } from '../../types';

export class HostelController {
  static async getHostels(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      let whereClause: any = {};

      // Row-level scoping for Wardens: only their own hostel
      if (user?.role === Role.WARDEN && user.hostelId) {
        whereClause.id = user.hostelId;
      }

      const hostels = await prisma.hostel.findMany({
        where: whereClause,
        include: {
          warden: { select: { id: true, name: true, email: true } },
          blocks: {
            include: {
              floors: {
                include: {
                  rooms: true,
                },
              },
            },
          },
          _count: { select: { complaints: true } },
        },
      });

      res.status(200).json({ success: true, data: hostels });
    } catch (error) {
      next(error);
    }
  }

  static async createHostel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, type, warden_id } = req.body;
      const hostel = await prisma.hostel.create({
        data: { name, type, warden_id },
      });
      res.status(201).json({ success: true, data: hostel });
    } catch (error) {
      next(error);
    }
  }

  static async getBlocks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { hostel_id } = req.query;
      const blocks = await prisma.block.findMany({
        where: hostel_id ? { hostel_id: String(hostel_id) } : {},
        include: {
          floors: {
            include: {
              rooms: true,
            },
          },
        },
      });
      res.status(200).json({ success: true, data: blocks });
    } catch (error) {
      next(error);
    }
  }

  static async getRooms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { floor_id, block_id, hostel_id } = req.query;
      let whereClause: any = {};
      if (floor_id) whereClause.floor_id = String(floor_id);
      if (block_id) whereClause.floor = { block_id: String(block_id) };
      if (hostel_id) whereClause.floor = { block: { hostel_id: String(hostel_id) } };

      const rooms = await prisma.room.findMany({
        where: whereClause,
        include: {
          floor: {
            include: {
              block: {
                include: { hostel: true },
              },
            },
          },
          allocations: {
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      res.status(200).json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }

  static async getMyRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const allocation = await prisma.roomAllocation.findFirst({
        where: { student_id: studentId },
        include: {
          room: {
            include: {
              floor: {
                include: {
                  block: {
                    include: { hostel: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { from_date: 'desc' },
      });

      if (!allocation) {
        res.status(200).json({ success: true, data: null });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          allocationId: allocation.id,
          roomId: allocation.room.id,
          roomNo: allocation.room.room_no,
          floorNumber: allocation.room.floor.number,
          blockId: allocation.room.floor.block.id,
          blockName: allocation.room.floor.block.name,
          hostelId: allocation.room.floor.block.hostel.id,
          hostelName: allocation.room.floor.block.hostel.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async allocateRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { room_id, student_id } = req.body;
      const allocation = await prisma.roomAllocation.create({
        data: {
          room_id,
          student_id,
        },
      });
      res.status(201).json({ success: true, data: allocation });
    } catch (error) {
      next(error);
    }
  }
}
