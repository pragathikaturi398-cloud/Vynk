import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';
import { Role } from '../../types';
import { EmailService } from '../../services/email.service';

export class MaintenanceStaffController {
  /**
   * List all maintenance staff members with team and workload
   */
  static async listStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { team_id, status, q } = req.query;

      const where: any = {
        role: Role.MAINTENANCE,
      };

      if (status === 'ACTIVE') {
        where.is_active = true;
      } else if (status === 'INACTIVE') {
        where.is_active = false;
      }

      if (team_id && typeof team_id === 'string' && team_id !== 'ALL') {
        where.teamMemberships = {
          some: { team_id },
        };
      }

      if (q && typeof q === 'string' && q.trim()) {
        const query = q.trim();
        where.OR = [
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ];
      }

      const members = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          is_first_login: true,
          created_at: true,
          teamMemberships: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              complaintsAssigned: {
                where: {
                  status: {
                    in: ['ASSIGNED', 'IN_PROGRESS', 'NEEDS_REVIEW'],
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: members,
        total: members.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Provision a new maintenance staff member and dispatch credentials via email
   */
  static async createStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, team_id, phone } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      // 1. Check if email already registered
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: `A user with email "${cleanEmail}" already exists.`,
        });
        return;
      }

      // 2. Check team existence
      const team = await prisma.team.findUnique({
        where: { id: team_id },
      });

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Specified maintenance team does not exist.',
        });
        return;
      }

      // 3. Hash temporary password
      const passwordHash = await bcrypt.hash(password, 10);

      // 4. Create user with MAINTENANCE role and is_first_login = true
      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password_hash: passwordHash,
          role: Role.MAINTENANCE,
          phone: phone ? phone.trim() : null,
          is_first_login: true,
          is_active: true,
          teamMemberships: {
            create: {
              team_id: team.id,
              active: true,
              current_load: 0,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          is_first_login: true,
          created_at: true,
          teamMemberships: {
            include: {
              team: { select: { id: true, name: true } },
            },
          },
        },
      });

      // 5. Dispatch credentials via email
      let emailDispatched = false;
      let emailNotice = '';
      try {
        const emailResult = await EmailService.sendMaintenanceWelcomeEmail({
          to: cleanEmail,
          name: newUser.name,
          email: cleanEmail,
          temporaryPassword: password,
          teamName: team.name,
        });
        emailDispatched = emailResult.success;
        emailNotice = `Credentials successfully sent to ${cleanEmail}.`;
      } catch (emailErr) {
        console.error('Failed to dispatch welcome email:', emailErr);
        emailNotice = `Account created, but email delivery encountered an issue. Credentials logged to server.`;
      }

      res.status(201).json({
        success: true,
        message: `Maintenance staff member "${newUser.name}" created successfully. ${emailNotice}`,
        data: newUser,
        email_dispatched: emailDispatched,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update maintenance member profile and team assignment
   */
  static async updateStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, email, phone, team_id } = req.body;

      const target = await prisma.user.findUnique({
        where: { id },
        include: { teamMemberships: true },
      });

      if (!target || target.role !== Role.MAINTENANCE) {
        res.status(404).json({ success: false, message: 'Maintenance staff member not found.' });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
      if (email && email.trim().toLowerCase() !== target.email) {
        const cleanEmail = email.trim().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing && existing.id !== id) {
          res.status(409).json({ success: false, message: 'Email is already in use by another account.' });
          return;
        }
        updateData.email = cleanEmail;
      }

      // Update user details
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          is_first_login: true,
        },
      });

      // Update team if provided
      if (team_id) {
        const team = await prisma.team.findUnique({ where: { id: team_id } });
        if (!team) {
          res.status(404).json({ success: false, message: 'Selected team does not exist.' });
          return;
        }

        // Delete prior memberships and re-link
        await prisma.teamMember.deleteMany({ where: { user_id: id } });
        await prisma.teamMember.create({
          data: {
            team_id: team.id,
            user_id: id,
            active: target.is_active,
            current_load: 0,
          },
        });
      }

      const freshData = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          is_active: true,
          is_first_login: true,
          created_at: true,
          teamMemberships: {
            include: { team: { select: { id: true, name: true } } },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: 'Maintenance member updated successfully',
        data: freshData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate or reactivate a maintenance staff member
   */
  static async toggleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role !== Role.MAINTENANCE) {
        res.status(404).json({ success: false, message: 'Maintenance staff member not found.' });
        return;
      }

      // Update both User and TeamMember active states
      await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: { is_active },
        }),
        prisma.teamMember.updateMany({
          where: { user_id: id },
          data: { active: is_active },
        }),
      ]);

      res.status(200).json({
        success: true,
        message: `Maintenance staff member "${target.name}" has been ${is_active ? 'activated' : 'deactivated'}.`,
        is_active,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset member temporary password, enforce first-login change, and dispatch via email
   */
  static async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { temporary_password } = req.body;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target || target.role !== Role.MAINTENANCE) {
        res.status(404).json({ success: false, message: 'Maintenance staff member not found.' });
        return;
      }

      const passwordHash = await bcrypt.hash(temporary_password, 10);

      // Reset password and force password change on next login
      await prisma.user.update({
        where: { id },
        data: {
          password_hash: passwordHash,
          is_first_login: true,
        },
      });

      // Dispatch updated password via email
      let emailDispatched = false;
      try {
        const emailResult = await EmailService.sendPasswordResetEmail({
          to: target.email,
          name: target.name,
          email: target.email,
          newTemporaryPassword: temporary_password,
        });
        emailDispatched = emailResult.success;
      } catch (emailErr) {
        console.error('Failed to dispatch password reset email:', emailErr);
      }

      res.status(200).json({
        success: true,
        message: `Password reset successfully for ${target.name}. New temporary password emailed to ${target.email}.`,
        email_dispatched: emailDispatched,
      });
    } catch (error) {
      next(error);
    }
  }
}
