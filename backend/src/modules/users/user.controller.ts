import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';
import { Role } from '../../types';

export class UserController {
  /**
   * List all users with role filter, search, and relations
   */
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { role, q, page, limit } = req.query;

      const where: any = {};
      if (role && typeof role === 'string' && role !== 'ALL') {
        where.role = role;
      }

      if (q && typeof q === 'string' && q.trim()) {
        const query = q.trim();
        where.OR = [
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ];
      }

      const take = limit ? parseInt(String(limit), 10) : 100;
      const skip = page ? (parseInt(String(page), 10) - 1) * take : 0;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            created_at: true,
            hostelsWarded: { select: { id: true, name: true, type: true } },
            roomAllocations: {
              include: {
                room: {
                  include: {
                    floor: {
                      include: {
                        block: { include: { hostel: true } },
                      },
                    },
                  },
                },
              },
              take: 1,
              orderBy: { from_date: 'desc' },
            },
            teamMemberships: {
              include: {
                team: { select: { id: true, name: true } },
              },
            },
            _count: {
              select: {
                complaintsSubmitted: true,
                complaintsAssigned: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take,
          skip,
        }),
        prisma.user.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: users,
        total,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Provision a new user account
   */
  static async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, phone } = req.body;

      const existing = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (existing) {
        res.status(409).json({ success: false, message: 'A user with this email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password_hash: passwordHash,
          role: role || Role.STUDENT,
          phone: phone ? phone.trim() : null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          created_at: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role and optionally assign hostel
   */
  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role, hostel_id } = req.body;

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
        },
      });

      // If assigned as Warden to a hostel, link it
      if (role === Role.WARDEN && hostel_id) {
        await prisma.hostel.update({
          where: { id: hostel_id },
          data: { warden_id: id },
        });
      }

      res.status(200).json({
        success: true,
        message: `Role updated to ${role}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user account (cannot self-delete)
   */
  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (req.user?.userId === id) {
        res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
        return;
      }

      await prisma.user.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
