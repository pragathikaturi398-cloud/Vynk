import { ComplaintStatus, Role } from '../types';
import { prisma } from '../config/prisma';
import { socketEvents } from '../config/socket';
import { WorkflowService } from '../modules/workflow/workflow.service';

export class SLAWorker {
  private static interval: NodeJS.Timeout | null = null;

  static start(intervalMs = 60000) {
    console.log('⏰ [SLA Worker] Started background SLA watchdog...');
    // Run initial check
    this.checkSLAs().catch((err) => console.error('[SLA Worker Error]:', err));

    this.interval = setInterval(() => {
      this.checkSLAs().catch((err) => console.error('[SLA Worker Error]:', err));
    }, intervalMs);
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('⏰ [SLA Worker] Stopped background SLA watchdog.');
    }
  }

  static async checkSLAs() {
    const now = new Date();

    // Find all active complaints with an active SLA
    const complaints = await prisma.complaint.findMany({
      where: {
        status: {
          in: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.ON_HOLD],
        },
        sla_due_at: { not: null },
      },
      include: {
        assignedUser: true,
        assignedTeam: {
          include: {
            head: true,
          },
        },
        hostel: {
          include: {
            warden: true,
          },
        },
      },
    });

    for (const c of complaints) {
      if (!c.sla_due_at) continue;

      const totalDuration = c.sla_due_at.getTime() - c.created_at.getTime();
      const elapsed = now.getTime() - c.created_at.getTime();
      const progress = elapsed / totalDuration;

      // 1. Check 80% warning
      if (progress >= 0.8 && progress < 1.0 && c.escalation_level === 0) {
        if (c.assigned_to) {
          const warningMsg = `⚠️ SLA Warning: Complaint "${c.title}" has reached 80% of its resolution window. Due in ${Math.round((c.sla_due_at.getTime() - now.getTime()) / 60000)} minutes.`;

          const existingNotif = await prisma.notification.findFirst({
            where: { user_id: c.assigned_to, complaint_id: c.id, message: { contains: '80%' } },
          });

          if (!existingNotif) {
            const notif = await prisma.notification.create({
              data: {
                user_id: c.assigned_to,
                complaint_id: c.id,
                message: warningMsg,
              },
            });
            socketEvents.notificationNew(c.assigned_to, notif);
          }
        }
      }

      // 2. Check 100% SLA Breach -> Level 1 Escalation
      if (progress >= 1.0 && c.escalation_level < 1) {
        const teamHead = c.assignedTeam?.head;
        const escalateToUser = teamHead?.id || c.hostel?.warden_id;

        await prisma.complaint.update({
          where: { id: c.id },
          data: { escalation_level: 1 },
        });

        const escalation = await prisma.escalation.create({
          data: {
            complaint_id: c.id,
            level: 1,
            reason: `SLA Breached: Resolution time exceeded allocated SLA deadline (${c.sla_due_at.toISOString()}).`,
            escalated_to: escalateToUser || 'Team Lead',
          },
        });

        await WorkflowService.recordEvent({
          complaintId: c.id,
          action: 'ESCALATION_LEVEL_1',
          fromStatus: c.status,
          toStatus: c.status,
          note: `Level 1 Escalation triggered. Target exceeded deadline. Escalated to Team Head.`,
        });

        socketEvents.complaintEscalated(escalation);

        if (escalateToUser) {
          const breachNotif = await prisma.notification.create({
            data: {
              user_id: escalateToUser,
              complaint_id: c.id,
              message: `🚨 SLA Breach (Level 1 Escalation): Complaint "${c.title}" is overdue!`,
            },
          });
          socketEvents.notificationNew(escalateToUser, breachNotif);
        }
      }

      // 3. Check 200% SLA Breach -> Level 2 Escalation (Warden / Admin)
      if (progress >= 2.0 && c.escalation_level < 2) {
        const wardenId = c.hostel?.warden_id;

        await prisma.complaint.update({
          where: { id: c.id },
          data: { escalation_level: 2 },
        });

        const escalation = await prisma.escalation.create({
          data: {
            complaint_id: c.id,
            level: 2,
            reason: `Critical 2x SLA Breach: Resolution is over 200% past deadline. Escalated directly to Hostel Warden.`,
            escalated_to: wardenId || 'Warden',
          },
        });

        await WorkflowService.recordEvent({
          complaintId: c.id,
          action: 'ESCALATION_LEVEL_2',
          fromStatus: c.status,
          toStatus: c.status,
          note: `Level 2 Critical Escalation: Over 2x SLA time elapsed. Escalated to Warden.`,
        });

        socketEvents.complaintEscalated(escalation);

        if (wardenId) {
          const wardenNotif = await prisma.notification.create({
            data: {
              user_id: wardenId,
              complaint_id: c.id,
              message: `🔴 Critical Level 2 SLA Breach: "${c.title}" is severely overdue (2x SLA). Immediate warden intervention required.`,
            },
          });
          socketEvents.notificationNew(wardenId, wardenNotif);
        }
      }
    }
  }
}
