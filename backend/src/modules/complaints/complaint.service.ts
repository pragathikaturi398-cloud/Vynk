import { ComplaintStatus, Role, Severity } from '../../types';
import { prisma } from '../../config/prisma';
import { AIService } from '../ai/ai.service';
import { WorkflowService } from '../workflow/workflow.service';
import { socketEvents } from '../../config/socket';
import { cosineSimilarity } from '../../utils/vector';
import { ENV } from '../../config/env';

export class ComplaintService {
  /**
   * Submits a new complaint, returns immediately, and runs AI pipeline asynchronously
   */
  static async createComplaint(data: {
    studentId: string;
    roomId: string;
    hostelId?: string;
    categoryId?: string;
    subcategoryId?: string;
    title: string;
    description: string;
    files?: Array<{ path: string; filename: string; mimetype: string; size: number }>;
  }) {
    // Determine hostel if not explicitly provided
    let hostelId = data.hostelId;
    let blockId = '';
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: {
        floor: {
          include: {
            block: true,
          },
        },
      },
    });

    if (room) {
      hostelId = room.floor.block.hostel_id;
      blockId = room.floor.block.id;
    }

    if (!hostelId) {
      throw { status: 400, message: 'Invalid room or missing hostel information.' };
    }

    // Default category/subcategory if not chosen
    let categoryId = data.categoryId;
    let subcategoryId = data.subcategoryId;

    if (!categoryId || !subcategoryId) {
      const defaultCat = await prisma.category.findFirst({
        include: { subcategories: true },
      });
      if (defaultCat && defaultCat.subcategories.length > 0) {
        categoryId = defaultCat.id;
        subcategoryId = defaultCat.subcategories[0].id;
      }
    }

    // Create complaint in SUBMITTED state
    const complaint = await prisma.complaint.create({
      data: {
        student_id: data.studentId,
        room_id: data.roomId,
        hostel_id: hostelId,
        category_id: categoryId!,
        subcategory_id: subcategoryId!,
        title: data.title,
        description: data.description,
        status: ComplaintStatus.SUBMITTED,
        severity: Severity.MEDIUM,
        priority_score: 1.0,
        attachments: {
          create: (data.files || []).map((f) => ({
            url: `/uploads/${f.filename}`,
            mime_type: f.mimetype,
            size: f.size,
          })),
        },
      },
      include: {
        attachments: true,
        student: { select: { id: true, name: true, email: true } },
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
        category: true,
        subcategory: true,
      },
    });

    // Record submission audit event
    await WorkflowService.recordEvent({
      complaintId: complaint.id,
      actorId: data.studentId,
      action: 'SUBMITTED',
      toStatus: ComplaintStatus.SUBMITTED,
      note: 'Complaint submitted by student',
    });

    // Broadcast creation
    socketEvents.complaintCreated(complaint);

    // Trigger AI pipeline asynchronously without blocking HTTP response
    const firstImagePath = data.files && data.files.length > 0 ? data.files[0].path : undefined;
    setImmediate(() => {
      this.runAIPipeline(complaint.id, blockId, firstImagePath).catch((err) => {
        console.error(`[AI Pipeline Error on ${complaint.id}]:`, err);
      });
    });

    return complaint;
  }

  /**
   * Asynchronous AI Pipeline (Section 6 of architecture.md)
   */
  static async runAIPipeline(complaintId: string, blockId: string, imagePath?: string) {
    console.log(`[AI Pipeline] Starting triage for complaint #${complaintId}`);
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        student: true,
        room: {
          include: {
            floor: {
              include: { block: true },
            },
          },
        },
      },
    });

    if (!complaint) return;

    // 1. AI Classification, severity & summary
    const aiResult = await AIService.classifyComplaint(
      complaint.title,
      complaint.description,
      imagePath
    );

    // 2. Find matching category and subcategory in database
    let resolvedCategoryId = complaint.category_id;
    let resolvedSubcategoryId = complaint.subcategory_id;

    const allCategories = await prisma.category.findMany({
      include: { subcategories: true },
    });

    const matchedCategory = allCategories.find((c) =>
      c.name.toLowerCase().includes(aiResult.category.toLowerCase()) ||
      aiResult.category.toLowerCase().includes(c.name.toLowerCase())
    );

    if (matchedCategory) {
      resolvedCategoryId = matchedCategory.id;
      const matchedSub = matchedCategory.subcategories.find(
        (s) =>
          s.name.toLowerCase().includes(aiResult.subcategory.toLowerCase()) ||
          aiResult.subcategory.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedSub) {
        resolvedSubcategoryId = matchedSub.id;
      } else if (matchedCategory.subcategories.length > 0) {
        resolvedSubcategoryId = matchedCategory.subcategories[0].id;
      }
    }

    // 3. Generate embedding for duplicate detection
    const embedding = await AIService.generateEmbedding(
      `${complaint.title} ${complaint.description}`
    );

    // 4. Check for duplicates in same hostel & category within the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const candidates = await prisma.complaint.findMany({
      where: {
        id: { not: complaint.id },
        hostel_id: complaint.hostel_id,
        category_id: resolvedCategoryId,
        status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.RESOLVED] },
        created_at: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        room_id: true,
        title: true,
        description: true,
        priority_score: true,
        embedding_data: true,
      },
    });

    let duplicateOfId: string | null = null;
    let highestSim = 0;
    let parentCandidate: (typeof candidates)[0] | null = null;

    // Use 0.85 for dense neural Gemini embeddings, or 0.60 for local fallback embeddings
    const baseThreshold = ENV.GEMINI_API_KEY ? 0.85 : 0.60;

    for (const cand of candidates) {
      let candEmbedding: number[] | null = null;
      if (cand.embedding_data) {
        try {
          candEmbedding = JSON.parse(cand.embedding_data);
        } catch (e) {}
      }

      if (!candEmbedding) {
        candEmbedding = await AIService.generateEmbedding(`${cand.title} ${cand.description}`);
      }

      const sim = cosineSimilarity(embedding, candEmbedding);
      const isSameRoom = cand.room_id === complaint.room_id;
      const effectiveThreshold = isSameRoom ? baseThreshold - 0.05 : baseThreshold;

      if (sim >= effectiveThreshold && sim > highestSim) {
        highestSim = sim;
        duplicateOfId = cand.id;
        parentCandidate = cand;
      }
    }

    // 5. Calculate Priority score
    const priority = AIService.calculatePriorityScore({
      severity: aiResult.severity,
      isSafetyIssue: aiResult.severity === Severity.CRITICAL,
      duplicateCount: duplicateOfId ? 1 : 0,
      ageHours: 0,
    });

    // 6. Routing and Staff Assignment
    let assignedTeamId: string | null = null;
    let assignedTo: string | null = null;

    // Check if category has a team mapping
    const categoryInfo = await prisma.category.findUnique({
      where: { id: resolvedCategoryId },
      include: { subcategories: true },
    });

    if (categoryInfo?.default_team_id) {
      assignedTeamId = categoryInfo.default_team_id;

      // Assign to active member with the lowest open load
      const members = await prisma.teamMember.findMany({
        where: { team_id: assignedTeamId, active: true },
        orderBy: { current_load: 'asc' },
      });

      if (members.length > 0) {
        assignedTo = members[0].user_id;
        // Bump staff load
        await prisma.teamMember.update({
          where: { id: members[0].id },
          data: { current_load: { increment: 1 } },
        });
      }
    }

    // 7. Calculate SLA Due Date
    const slaDueAt = WorkflowService.calculateSLADueDate(
      aiResult.severity,
      categoryInfo?.default_sla_hours
    );

    // Determine target status: NEEDS_REVIEW if confidence < 0.6, else ASSIGNED or AI_PROCESSED
    let nextStatus: ComplaintStatus = ComplaintStatus.AI_PROCESSED;
    if (aiResult.confidence < 0.6) {
      nextStatus = ComplaintStatus.NEEDS_REVIEW;
    } else if (assignedTeamId) {
      nextStatus = ComplaintStatus.ASSIGNED;
    }

    // Update Complaint with AI findings
    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        category_id: resolvedCategoryId,
        subcategory_id: resolvedSubcategoryId,
        severity: aiResult.severity,
        priority_score: priority,
        status: nextStatus,
        ai_category: aiResult.category,
        ai_confidence: aiResult.confidence,
        ai_summary: aiResult.summary,
        duplicate_of_id: duplicateOfId,
        embedding_data: JSON.stringify(embedding),
        assigned_team_id: assignedTeamId,
        assigned_to: assignedTo,
        sla_due_at: slaDueAt,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignedUser: { select: { id: true, name: true, phone: true } },
        assignedTeam: { select: { id: true, name: true } },
        category: true,
        subcategory: true,
        room: {
          include: {
            floor: {
              include: { block: { include: { hostel: true } } },
            },
          },
        },
        attachments: true,
        events: true,
      },
    });

    // If duplicate detected: bump parent priority & notify student
    if (duplicateOfId && parentCandidate) {
      await prisma.complaint.update({
        where: { id: duplicateOfId },
        data: {
          priority_score: { increment: 1.0 },
        },
      });

      const duplicateNotice = `Your issue was identified as similar to existing complaint #${duplicateOfId.slice(0, 8)} (${Math.round(highestSim * 100)}% match) and has been grouped for priority resolution.`;

      const notif = await prisma.notification.create({
        data: {
          user_id: complaint.student_id,
          complaint_id: complaint.id,
          message: duplicateNotice,
        },
      });
      socketEvents.notificationNew(complaint.student_id, notif);

      await WorkflowService.recordEvent({
        complaintId: complaint.id,
        action: 'AI_DUPLICATE_LINKED',
        toStatus: nextStatus,
        note: `Linked as duplicate of #${duplicateOfId} with similarity score ${(highestSim * 100).toFixed(1)}%`,
      });
    } else {
      await WorkflowService.recordEvent({
        complaintId: complaint.id,
        action: 'AI_PROCESSED',
        fromStatus: ComplaintStatus.SUBMITTED,
        toStatus: nextStatus,
        note: `AI classified as ${aiResult.category} / ${aiResult.subcategory} (${aiResult.severity}, confidence: ${(aiResult.confidence * 100).toFixed(0)}%). Assigned to team: ${assignedTeamId ? 'Yes' : 'Queue'}`,
      });
    }

    // Send notification to assigned technician if assigned
    if (assignedTo) {
      const techNotif = await prisma.notification.create({
        data: {
          user_id: assignedTo,
          complaint_id: complaint.id,
          message: `New task assigned: "${complaint.title}" (Severity: ${aiResult.severity})`,
        },
      });
      socketEvents.notificationNew(assignedTo, techNotif);
      socketEvents.complaintAssigned(updatedComplaint);
    }

    // Broadcast updated complaint
    socketEvents.complaintUpdated(updatedComplaint);
    console.log(`[AI Pipeline] Finished triage for #${complaintId} -> ${nextStatus}`);
  }

  /**
   * Search and filter complaints with row-level RBAC
   */
  static async getComplaints(filter: {
    status?: string;
    hostel?: string;
    category?: string;
    q?: string;
    from?: string;
    to?: string;
    userRole?: Role;
    userId?: string;
    userHostelId?: string;
  }) {
    const where: any = {};

    // 1. RBAC Row-Level Scoping
    if (filter.userRole === Role.STUDENT && filter.userId) {
      where.student_id = filter.userId;
    } else if (filter.userRole === Role.WARDEN && filter.userHostelId) {
      where.hostel_id = filter.userHostelId;
    } else if (filter.userRole === Role.MAINTENANCE && filter.userId) {
      where.OR = [
        { assigned_to: filter.userId },
        { assignedTeam: { members: { some: { user_id: filter.userId } } } },
      ];
    }

    // 2. Query Filters
    if (filter.status) {
      where.status = filter.status as ComplaintStatus;
    }
    if (filter.hostel) {
      where.hostel_id = filter.hostel;
    }
    if (filter.category) {
      where.category_id = filter.category;
    }
    if (filter.q) {
      where.OR = [
        { title: { contains: filter.q } },
        { description: { contains: filter.q } },
        { ai_summary: { contains: filter.q } },
      ];
    }
    if (filter.from || filter.to) {
      where.created_at = {};
      if (filter.from) where.created_at.gte = new Date(filter.from);
      if (filter.to) where.created_at.lte = new Date(filter.to);
    }

    return prisma.complaint.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignedUser: { select: { id: true, name: true } },
        assignedTeam: { select: { id: true, name: true } },
        category: true,
        subcategory: true,
        room: {
          include: {
            floor: {
              include: { block: { include: { hostel: true } } },
            },
          },
        },
        attachments: true,
        feedbacks: true,
        _count: { select: { duplicates: true } },
      },
      orderBy: [{ priority_score: 'desc' }, { created_at: 'desc' }],
    });
  }

  /**
   * Get single complaint with full timeline and details
   */
  static async getComplaintById(complaintId: string) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        assignedUser: { select: { id: true, name: true, email: true, phone: true } },
        assignedTeam: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
        category: true,
        subcategory: true,
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
        attachments: true,
        events: {
          include: {
            actor: { select: { id: true, name: true, role: true } },
          },
          orderBy: { created_at: 'asc' },
        },
        feedbacks: {
          orderBy: { created_at: 'desc' },
        },
        duplicates: {
          select: {
            id: true,
            title: true,
            status: true,
            created_at: true,
            student: { select: { id: true, name: true } },
          },
        },
        parentComplaint: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!complaint) {
      throw { status: 404, message: 'Complaint not found' };
    }

    return complaint;
  }

  /**
   * Manual assignment or category/priority override
   */
  static async assignComplaint(params: {
    complaintId: string;
    actorId: string;
    teamId?: string;
    assignedTo?: string;
    severity?: Severity;
    categoryId?: string;
    note?: string;
  }) {
    const updateData: any = {};
    if (params.teamId) updateData.assigned_team_id = params.teamId;
    if (params.assignedTo) updateData.assigned_to = params.assignedTo;
    if (params.severity) updateData.severity = params.severity;
    if (params.categoryId) updateData.category_id = params.categoryId;

    updateData.status = ComplaintStatus.ASSIGNED;

    const updated = await prisma.complaint.update({
      where: { id: params.complaintId },
      data: updateData,
      include: {
        assignedUser: { select: { id: true, name: true } },
        assignedTeam: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } },
      },
    });

    await WorkflowService.recordEvent({
      complaintId: params.complaintId,
      actorId: params.actorId,
      action: 'REASSIGNED_OR_OVERRIDDEN',
      fromStatus: updated.status,
      toStatus: ComplaintStatus.ASSIGNED,
      note: params.note || 'Complaint assignment / parameters manually updated by admin',
    });

    socketEvents.complaintAssigned(updated);
    return updated;
  }

  /**
   * Student leaves feedback
   */
  static async addFeedback(data: {
    complaintId: string;
    studentId: string;
    rating: number;
    comment?: string;
  }) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: data.complaintId },
    });

    if (!complaint) throw { status: 404, message: 'Complaint not found' };
    if (complaint.student_id !== data.studentId) {
      throw { status: 403, message: 'Only the student who submitted can provide feedback' };
    }

    const feedback = await prisma.feedback.create({
      data: {
        complaint_id: data.complaintId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Auto-close complaint on rating
    await WorkflowService.transitionStatus({
      complaintId: data.complaintId,
      newStatus: ComplaintStatus.CLOSED,
      actorId: data.studentId,
      note: `Complaint closed by student with a ${data.rating}/5 rating.`,
    });

    return feedback;
  }

  /**
   * Student reopens complaint within 48 hours
   */
  static async reopenComplaint(params: {
    complaintId: string;
    studentId: string;
    reason: string;
  }) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.complaintId },
    });

    if (!complaint) throw { status: 404, message: 'Complaint not found' };
    if (complaint.student_id !== params.studentId) {
      throw { status: 403, message: 'Only the student who submitted can reopen this complaint' };
    }

    // Check 48h limit from resolution/closure
    const resolvedTime = complaint.resolved_at || complaint.closed_at || complaint.created_at;
    const diffHours = (Date.now() - new Date(resolvedTime).getTime()) / (1000 * 3600);

    if (diffHours > 48) {
      throw {
        status: 400,
        message: 'Complaints can only be reopened within 48 hours of resolution. Please submit a new complaint.',
      };
    }

    return WorkflowService.transitionStatus({
      complaintId: params.complaintId,
      newStatus: ComplaintStatus.REOPENED,
      actorId: params.studentId,
      note: `Reopened by student. Reason: ${params.reason}`,
    });
  }
}
