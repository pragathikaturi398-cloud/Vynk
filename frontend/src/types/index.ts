export type Role = 'STUDENT' | 'MAINTENANCE' | 'WARDEN' | 'SUPERADMIN';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'AI_PROCESSED'
  | 'NEEDS_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  hostelWarded?: { id: string; name: string } | null;
  room?: {
    roomId: string;
    roomNo: string;
    floor: number;
    blockId?: string;
    blockName: string;
    hostelId: string;
    hostelName: string;
  } | null;
}

export interface ComplaintAttachment {
  id: string;
  url: string;
  mime_type: string;
  size: number;
}

export interface ComplaintEvent {
  id: string;
  action: string;
  from_status?: ComplaintStatus | null;
  to_status?: ComplaintStatus | null;
  note?: string | null;
  created_at: string;
  actor?: { id: string; name: string; role: Role } | null;
}

export interface Feedback {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  student_id: string;
  room_id: string;
  hostel_id: string;
  category_id: string;
  subcategory_id: string;
  title: string;
  description: string;
  severity: Severity;
  priority_score: number;
  status: ComplaintStatus;
  ai_category?: string | null;
  ai_confidence?: number | null;
  ai_summary?: string | null;
  duplicate_of_id?: string | null;
  assigned_team_id?: string | null;
  assigned_to?: string | null;
  sla_due_at?: string | null;
  escalation_level: number;
  created_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;

  student?: { id: string; name: string; email: string; phone?: string };
  assignedUser?: { id: string; name: string; phone?: string } | null;
  assignedTeam?: { id: string; name: string } | null;
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
  room: {
    id: string;
    room_no: string;
    floor: {
      number: number;
      block: {
        id: string;
        name: string;
        hostel: { id: string; name: string };
      };
    };
  };
  attachments?: ComplaintAttachment[];
  events?: ComplaintEvent[];
  feedbacks?: Feedback[];
  duplicates?: Array<{ id: string; title: string; status: ComplaintStatus; created_at: string }>;
}

export interface NotificationItem {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  complaint?: { id: string; title: string; status: string; severity: string } | null;
}

export interface AnalyticsOverview {
  total: number;
  open: number;
  submitted: number;
  inProgress: number;
  resolved: number;
  closed: number;
  needsReview: number;
  criticalCount: number;
  slaBreachedCount: number;
  avgResolutionHours: number;
  avgRating: number;
}
