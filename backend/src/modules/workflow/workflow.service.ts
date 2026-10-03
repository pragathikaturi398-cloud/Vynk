import { ComplaintStatus, Severity } from '../../types';
import { prisma } from '../../config/prisma';
import { socketEvents } from '../../config/socket';

export interface SLAConfig {
  responseMinutes: number;
  resolutionHours: number;
}

export const SLA_BY_SEVERITY: Record<Severity, SLAConfig> = {
  [Severity.CRITICAL]: { responseMinutes: 15, resolutionHours: 4 },
  [Severity.HIGH]: { responseMinutes: 60, resolutionHours: 24 },
  [Severity.MEDIUM]: { responseMinutes: 240, resolutionHours: 48 },
  [Severity.LOW]: { responseMinutes: 480, resolutionHours: 120 },
};

// Valid status transitions map
const VALID_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.SUBMITTED]: [ComplaintStatus.AI_PROCESSED, ComplaintStatus.NEEDS_REVIEW, ComplaintStatus.ASSIGNED],
  [ComplaintStatus.AI_PROCESSED]: [ComplaintStatus.ASSIGNED, ComplaintStatus.NEEDS_REVIEW],
  [ComplaintStatus.NEEDS_REVIEW]: [ComplaintStatus.ASSIGNED, ComplaintStatus.CLOSED],
  [ComplaintStatus.ASSIGNED]: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.ON_HOLD, ComplaintStatus.NEEDS_REVIEW],
  [ComplaintStatus.IN_PROGRESS]: [ComplaintStatus.RESOLVED, ComplaintStatus.ON_HOLD, ComplaintStatus.ASSIGNED],
  [ComplaintStatus.ON_HOLD]: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.ASSIGNED],
  [ComplaintStatus.RESOLVED]: [ComplaintStatus.CLOSED, ComplaintStatus.REOPENED],
  [ComplaintStatus.CLOSED]: [ComplaintStatus.REOPENED],
  [ComplaintStatus.REOPENED]: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS],
};

export class WorkflowService {
  /**
   * Validates if transition from currentStatus to newStatus is allowed
   */
  static isValidTransition(currentStatus: ComplaintStatus, newStatus: ComplaintStatus): boolean {
    if (currentStatus === newStatus) return true;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  /**
   * Calculates SLA due date based on severity and category
   */
  static calculateSLADueDate(severity: Severity, categorySlaHours?: number): Date {
    const hours = categorySlaHours && categorySlaHours > 0
      ? Math.min(categorySlaHours, SLA_BY_SEVERITY[severity].resolutionHours)
      : SLA_BY_SEVERITY[severity].resolutionHours;

    const due = new Date();
    due.setMinutes(due.getMinutes() + Math.round(hours * 60));
    return due;
  }

  /**
   * Records an immutable event in complaint_events
   */
  static async recordEvent(data: {
    complaintId: string;
    actorId?: string;
    action: string;
    fromStatus?: ComplaintStatus;
    toStatus?: ComplaintStatus;
    note?: string;
  }) {
    return prisma.complaintEvent.create({
      data: {
        complaint_id: data.complaintId,
        actor_id: data.actorId || null,
        action: data.action,
        from_status: data.fromStatus || null,
        to_status: data.toStatus || null,
        note: data.note || null,
      },
    });
  }

  /**
   * Transition complaint status with state machine check, audit event, and socket broadcast
   */
  static async transitionStatus(params: {
    complaintId: string;
    newStatus: ComplaintStatus;
    actorId?: string;
    actorRole?: string;
    note?: string;
  }) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.complaintId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });

    if (!complaint) {
      throw { status: 404, message: 'Complaint not found' };
    }

    if (!this.isValidTransition(complaint.status as ComplaintStatus, params.newStatus)) {
      throw {
        status: 400,
        message: `Invalid status transition from ${complaint.status} to ${params.newStatus}`,
      };
    }

    const updateData: any = {
      status: params.newStatus,
    };

    if (params.newStatus === ComplaintStatus.RESOLVED && !complaint.resolved_at) {
      updateData.resolved_at = new Date();
    }
    if (params.newStatus === ComplaintStatus.CLOSED && !complaint.closed_at) {
      updateData.closed_at = new Date();
    }

    const updated = await prisma.complaint.update({
      where: { id: params.complaintId },
      data: updateData,
      include: {
        student: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
        assignedTeam: { select: { id: true, name: true } },
        category: true,
        subcategory: true,
        room: true,
        hostel: true,
      },
    });

    // Record audit event
    await this.recordEvent({
      complaintId: params.complaintId,
      actorId: params.actorId,
      action: 'STATUS_CHANGE',
      fromStatus: complaint.status as ComplaintStatus,
      toStatus: params.newStatus,
      note: params.note || `Status updated from ${complaint.status} to ${params.newStatus}`,
    });

    // Send in-app notification to student
    if (complaint.student_id) {
      const msg = `Your complaint "${complaint.title.slice(0, 30)}..." status changed to ${params.newStatus}.`;
      const notif = await prisma.notification.create({
        data: {
          user_id: complaint.student_id,
          complaint_id: complaint.id,
          message: msg,
        },
      });
      socketEvents.notificationNew(complaint.student_id, notif);
    }

    // Broadcast updated complaint
    socketEvents.complaintUpdated(updated);

    return updated;
  }
}
