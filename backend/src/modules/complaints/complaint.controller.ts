import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ComplaintService } from './complaint.service';
import { WorkflowService } from '../workflow/workflow.service';
import { ComplaintStatus, Role, Severity } from '../../types';

export class ComplaintController {
  static async createComplaint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const files = req.files as Express.Multer.File[] | undefined;
      const { room_id, hostel_id, category_id, subcategory_id, title, description } = req.body;

      if (!room_id || !title || !description) {
        res.status(400).json({
          success: false,
          message: 'room_id, title, and description are required fields.',
        });
        return;
      }

      const complaint = await ComplaintService.createComplaint({
        studentId,
        roomId: room_id,
        hostelId: hostel_id,
        categoryId: category_id,
        subcategoryId: subcategory_id,
        title,
        description,
        files: files?.map((f) => ({
          path: f.path,
          filename: f.filename,
          mimetype: f.mimetype,
          size: f.size,
        })),
      });

      res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully. AI triage and routing in progress.',
        data: complaint,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getComplaints(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, hostel, category, q, from, to, scope } = req.query;

      const complaints = await ComplaintService.getComplaints({
        status: status ? String(status) : undefined,
        hostel: hostel ? String(hostel) : undefined,
        category: category ? String(category) : undefined,
        q: q ? String(q) : undefined,
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
        scope: scope ? String(scope) : undefined,
        userRole: req.user?.role as Role,
        userId: req.user?.userId,
        userHostelId: req.user?.hostelId,
      });

      res.status(200).json({ success: true, count: complaints.length, data: complaints });
    } catch (error) {
      next(error);
    }
  }

  static async getComplaintById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const complaint = await ComplaintService.getComplaintById(id);

      // Verify row-level access for student
      if (req.user?.role === Role.STUDENT && complaint.student_id !== req.user.userId) {
        res.status(403).json({ success: false, message: 'You cannot view complaints from other students.' });
        return;
      }

      res.status(200).json({ success: true, data: complaint });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) {
        res.status(400).json({ success: false, message: 'Target status is required.' });
        return;
      }

      const updated = await WorkflowService.transitionStatus({
        complaintId: id,
        newStatus: status as ComplaintStatus,
        actorId: req.user?.userId,
        actorRole: req.user?.role,
        note,
      });

      res.status(200).json({
        success: true,
        message: `Complaint status updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignComplaint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { team_id, assigned_to, worker, severity, category_id, note } = req.body;

      const updated = await ComplaintService.assignComplaint({
        complaintId: id,
        actorId: req.user!.userId,
        teamId: team_id,
        assignedTo: assigned_to,
        worker,
        severity: severity as Severity,
        categoryId: category_id,
        note,
      });

      res.status(200).json({
        success: true,
        message: 'Complaint assignment updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async autoCategorizeComplaint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await ComplaintService.autoCategorizeComplaint(id, req.user?.userId);
      res.status(200).json({
        success: true,
        message: `Category automatically assigned: ${updated.category.name}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
        return;
      }

      const feedback = await ComplaintService.addFeedback({
        complaintId: id,
        studentId: req.user!.userId,
        rating: Number(rating),
        comment,
      });

      res.status(201).json({
        success: true,
        message: 'Feedback submitted. Complaint closed.',
        data: feedback,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reopenComplaint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ success: false, message: 'A reopening reason is required.' });
        return;
      }

      const reopened = await ComplaintService.reopenComplaint({
        complaintId: id,
        studentId: req.user!.userId,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Complaint successfully reopened.',
        data: reopened,
      });
    } catch (error) {
      next(error);
    }
  }
}
