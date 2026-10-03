import { ComplaintStatus, Role, Severity } from '../../types';
import { prisma } from '../../config/prisma';
import { AIService } from '../ai/ai.service';

export class AnalyticsService {
  static async getOverview(hostelId?: string) {
    const where: any = hostelId ? { hostel_id: hostelId } : {};

    const [
      total,
      submitted,
      inProgress,
      resolved,
      closed,
      needsReview,
      criticalCount,
    ] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.count({ where: { ...where, status: ComplaintStatus.SUBMITTED } }),
      prisma.complaint.count({
        where: {
          ...where,
          status: { in: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS] },
        },
      }),
      prisma.complaint.count({ where: { ...where, status: ComplaintStatus.RESOLVED } }),
      prisma.complaint.count({ where: { ...where, status: ComplaintStatus.CLOSED } }),
      prisma.complaint.count({ where: { ...where, status: ComplaintStatus.NEEDS_REVIEW } }),
      prisma.complaint.count({ where: { ...where, severity: Severity.CRITICAL } }),
    ]);

    // SLA Breached count (open complaints with sla_due_at < now)
    const now = new Date();
    const slaBreachedCount = await prisma.complaint.count({
      where: {
        ...where,
        status: { notIn: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] },
        sla_due_at: { lt: now },
      },
    });

    // Average resolution time (in hours)
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        ...where,
        resolved_at: { not: null },
      },
      select: {
        created_at: true,
        resolved_at: true,
      },
    });

    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((acc, c) => {
        const rawDiff = new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime();
        const diffMs = Math.max(1800000, Math.abs(rawDiff)); // minimum 30 mins
        return acc + diffMs / (1000 * 3600);
      }, 0);
      avgResolutionHours = parseFloat((totalHours / resolvedComplaints.length).toFixed(1));
    }

    // Average rating
    const feedbacks = await prisma.feedback.findMany({ select: { rating: true } });
    const avgRating =
      feedbacks.length > 0
        ? parseFloat((feedbacks.reduce((a, b) => a + b.rating, 0) / feedbacks.length).toFixed(1))
        : 5.0;

    return {
      total,
      open: submitted + inProgress + needsReview,
      submitted,
      inProgress,
      resolved,
      closed,
      needsReview,
      criticalCount,
      slaBreachedCount,
      avgResolutionHours,
      avgRating,
    };
  }

  static async getByHostel() {
    const hostels = await prisma.hostel.findMany({
      include: {
        _count: {
          select: { complaints: true },
        },
        complaints: {
          select: {
            status: true,
            severity: true,
          },
        },
      },
    });

    return hostels.map((h) => {
      const openCount = h.complaints.filter(
        (c) => c.status !== ComplaintStatus.RESOLVED && c.status !== ComplaintStatus.CLOSED
      ).length;
      const criticalCount = h.complaints.filter((c) => c.severity === Severity.CRITICAL).length;

      return {
        hostelId: h.id,
        name: h.name,
        type: h.type,
        totalComplaints: h._count.complaints,
        openComplaints: openCount,
        criticalComplaints: criticalCount,
      };
    });
  }

  static async getByCategory() {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { complaints: true },
        },
        complaints: {
          select: {
            status: true,
            severity: true,
          },
        },
      },
    });

    return categories.map((cat) => ({
      categoryId: cat.id,
      name: cat.name,
      total: cat._count.complaints,
      resolved: cat.complaints.filter(
        (c) => c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
      ).length,
      critical: cat.complaints.filter((c) => c.severity === Severity.CRITICAL).length,
    }));
  }

  static async getRecurringIssues() {
    // 30 days window
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const complaints = await prisma.complaint.findMany({
      where: { created_at: { gte: thirtyDaysAgo } },
      include: {
        room: {
          include: {
            floor: {
              include: { block: { include: { hostel: true } } },
            },
          },
        },
        category: true,
        subcategory: true,
      },
    });

    // Group by block + subcategory
    const clusters: Record<string, {
      hostelName: string;
      blockName: string;
      floorNumber: number;
      categoryName: string;
      subcategoryName: string;
      count: number;
      complaintIds: string[];
    }> = {};

    for (const c of complaints) {
      const key = `${c.room.floor.block.name}_F${c.room.floor.number}_${c.subcategory.name}`;
      if (!clusters[key]) {
        clusters[key] = {
          hostelName: c.room.floor.block.hostel.name,
          blockName: c.room.floor.block.name,
          floorNumber: c.room.floor.number,
          categoryName: c.category.name,
          subcategoryName: c.subcategory.name,
          count: 0,
          complaintIds: [],
        };
      }
      clusters[key].count += 1;
      clusters[key].complaintIds.push(c.id);
    }

    // Filter clusters with >= 2 complaints
    return Object.values(clusters)
      .filter((cluster) => cluster.count >= 2)
      .sort((a, b) => b.count - a.count);
  }

  static async getWorkload() {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        complaints: {
          where: {
            status: { notIn: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] },
          },
          select: { id: true },
        },
      },
    });

    return teams.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      activeComplaints: team.complaints.length,
      members: team.members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        active: m.active,
        currentLoad: m.current_load,
      })),
    }));
  }

  static async getResolutionTimeBreakdown() {
    const resolved = await prisma.complaint.findMany({
      where: {
        resolved_at: { not: null },
      },
      include: {
        category: true,
      },
    });

    const bySeverity: Record<Severity, { totalHours: number; count: number }> = {
      [Severity.CRITICAL]: { totalHours: 0, count: 0 },
      [Severity.HIGH]: { totalHours: 0, count: 0 },
      [Severity.MEDIUM]: { totalHours: 0, count: 0 },
      [Severity.LOW]: { totalHours: 0, count: 0 },
    };

    for (const c of resolved) {
      const rawDiff = (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / (1000 * 3600);
      const diffHours = Math.max(0.5, Math.abs(rawDiff));
      const sevKey = c.severity as Severity;
      if (bySeverity[sevKey]) {
        bySeverity[sevKey].totalHours += diffHours;
        bySeverity[sevKey].count += 1;
      }
    }

    return Object.entries(bySeverity).map(([severity, val]) => ({
      severity,
      avgHours: val.count > 0 ? parseFloat((val.totalHours / val.count).toFixed(1)) : 0,
      count: val.count,
    }));
  }

  static async generateInsights() {
    const recurring = await this.getRecurringIssues();
    const overview = await this.getOverview();

    let statsSummary = `Overview: Total complaints: ${overview.total}, Open: ${overview.open}, Critical: ${overview.criticalCount}, SLA Breaches: ${overview.slaBreachedCount}, Avg Resolution: ${overview.avgResolutionHours} hrs.\n`;

    if (recurring.length > 0) {
      statsSummary += `Top recurring issue clusters:\n`;
      recurring.slice(0, 3).forEach((r) => {
        statsSummary += `- ${r.hostelName}, ${r.blockName} Floor ${r.floorNumber}: ${r.count} incidents of "${r.subcategoryName}" (${r.categoryName}).\n`;
      });
    }

    const summaryText = await AIService.generateInsightSummary(statsSummary);

    const insight = await prisma.insight.create({
      data: {
        scope: 'GLOBAL',
        period: '30_DAYS',
        summary_text: summaryText,
      },
    });

    return insight;
  }

  static async getSuperAdminMetrics() {
    const [
      total,
      pending,
      assigned,
      solved,
      critical,
      slaBreached,
      totalHostels,
      totalRooms,
      totalStudents,
      totalStaff,
      recentComplaints,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({
        where: {
          status: { in: [ComplaintStatus.SUBMITTED, ComplaintStatus.AI_PROCESSED, ComplaintStatus.NEEDS_REVIEW] },
        },
      }),
      prisma.complaint.count({
        where: {
          status: { in: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.ON_HOLD, ComplaintStatus.REOPENED] },
        },
      }),
      prisma.complaint.count({
        where: {
          status: { in: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] },
        },
      }),
      prisma.complaint.count({
        where: { severity: Severity.CRITICAL },
      }),
      prisma.complaint.count({
        where: {
          status: { notIn: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] },
          sla_due_at: { lt: new Date() },
        },
      }),
      prisma.hostel.count(),
      prisma.room.count(),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: { in: [Role.MAINTENANCE, Role.WARDEN, Role.SUPERADMIN] } } }),
      prisma.complaint.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          student: { select: { name: true } },
          category: { select: { name: true } },
          room: { select: { room_no: true } },
        },
      }),
    ]);

    return {
      total,
      pending,
      assigned,
      solved,
      critical,
      slaBreached,
      totalHostels,
      totalRooms,
      totalStudents,
      totalStaff,
      recentComplaints,
    };
  }
}
