import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

export class CategoryController {
  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        include: {
          subcategories: true,
          _count: { select: { complaints: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, default_sla_hours, default_team_id } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Category name is required' });
        return;
      }
      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          default_sla_hours: default_sla_hours ? Number(default_sla_hours) : 24,
          default_team_id: default_team_id || null,
        },
      });
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const count = await prisma.complaint.count({ where: { category_id: id } });
      if (count > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete category: ${count} complaint(s) reference this category.`,
        });
        return;
      }
      await prisma.category.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getSubcategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category_id } = req.query;
      const subcategories = await prisma.subcategory.findMany({
        where: category_id ? { category_id: String(category_id) } : {},
        include: { category: true },
      });
      res.status(200).json({ success: true, data: subcategories });
    } catch (error) {
      next(error);
    }
  }

  static async createSubcategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { category_id, name, base_severity } = req.body;
      if (!category_id || !name) {
        res.status(400).json({ success: false, message: 'category_id and name are required' });
        return;
      }
      const subcategory = await prisma.subcategory.create({
        data: {
          category_id,
          name: name.trim(),
          base_severity: base_severity || 'MEDIUM',
        },
      });
      res.status(201).json({ success: true, data: subcategory });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSubcategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const count = await prisma.complaint.count({ where: { subcategory_id: id } });
      if (count > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete subcategory: ${count} complaint(s) reference this subcategory.`,
        });
        return;
      }
      await prisma.subcategory.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Subcategory deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getTeams(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const teams = await prisma.team.findMany({
        include: {
          head: { select: { id: true, name: true, email: true, phone: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            },
          },
          _count: { select: { complaints: true } },
        },
      });
      res.status(200).json({ success: true, data: teams });
    } catch (error) {
      next(error);
    }
  }

  static async createTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, category_ids, head_id } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Team name is required' });
        return;
      }
      const team = await prisma.team.create({
        data: {
          name: name.trim(),
          category_ids: typeof category_ids === 'string' ? category_ids : JSON.stringify(category_ids || []),
          head_id: head_id || null,
        },
      });
      res.status(201).json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.team.delete({ where: { id } });
      res.status(200).json({ success: true, message: 'Team deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async addTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;
      if (!user_id) {
        res.status(400).json({ success: false, message: 'user_id is required' });
        return;
      }

      const existing = await prisma.teamMember.findUnique({
        where: { team_id_user_id: { team_id: id, user_id } },
      });

      if (existing) {
        res.status(400).json({ success: false, message: 'User is already a member of this team' });
        return;
      }

      const member = await prisma.teamMember.create({
        data: {
          team_id: id,
          user_id,
          active: true,
          current_load: 0,
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  static async removeTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;
      await prisma.teamMember.deleteMany({
        where: { team_id: id, user_id: userId },
      });
      res.status(200).json({ success: true, message: 'Team member removed' });
    } catch (error) {
      next(error);
    }
  }
}
