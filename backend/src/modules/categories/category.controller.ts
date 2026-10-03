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
      const category = await prisma.category.create({
        data: { name, default_sla_hours: default_sla_hours ? Number(default_sla_hours) : 24, default_team_id },
      });
      res.status(201).json({ success: true, data: category });
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

  static async getTeams(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const teams = await prisma.team.findMany({
        include: {
          head: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
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
      const team = await prisma.team.create({
        data: { name, category_ids: category_ids || [], head_id },
      });
      res.status(201).json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  }
}
