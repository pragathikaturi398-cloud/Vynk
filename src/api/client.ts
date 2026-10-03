import { User, Complaint, HostelItem, CategoryItem, Severity } from '../types';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// Seed Mock Database Initializer (Persisted in localStorage for demo continuity)
// ---------------------------------------------------------------------------
const STORAGE_PREFIX = 'vynk_mock_';

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    if (val) return JSON.parse(val);
  } catch (e) {
    // fallback
  }
  return defaultVal;
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    // fallback
  }
}

const INITIAL_HOSTELS: HostelItem[] = [
  {
    id: 'hostel-boys-1',
    name: 'Aryabhata Boys Hostel',
    type: 'BOYS',
    warden: { id: 'u-warden-boys', name: 'Prof. Suresh Nair', email: 'warden.boys@vynk.local' },
    blocks: [
      { id: 'b-a', hostel_id: 'hostel-boys-1', name: 'Block A', floors: [] },
      { id: 'b-b', hostel_id: 'hostel-boys-1', name: 'Block B', floors: [] },
    ],
  },
  {
    id: 'hostel-girls-1',
    name: 'Sarojini Girls Hostel',
    type: 'GIRLS',
    warden: { id: 'u-warden-girls', name: 'Dr. Sunita Rao', email: 'warden.girls@vynk.local' },
    blocks: [{ id: 'b-c', hostel_id: 'hostel-girls-1', name: 'Block C', floors: [] }],
  },
];

const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-plumbing',
    name: 'Plumbing',
    default_sla_hours: 24,
    subcategories: [
      { id: 'sub-plumb-1', category_id: 'cat-plumbing', name: 'Water Leakage', base_severity: 'HIGH' },
      { id: 'sub-plumb-2', category_id: 'cat-plumbing', name: 'Clogged Drain / Toilet', base_severity: 'MEDIUM' },
      { id: 'sub-plumb-3', category_id: 'cat-plumbing', name: 'Broken Tap / Flush Valve', base_severity: 'LOW' },
      { id: 'sub-plumb-4', category_id: 'cat-plumbing', name: 'No Water Supply', base_severity: 'CRITICAL' },
    ],
  },
  {
    id: 'cat-electrical',
    name: 'Electrical',
    default_sla_hours: 24,
    subcategories: [
      { id: 'sub-elec-1', category_id: 'cat-electrical', name: 'Sparking / Short Circuit / Exposed Wire', base_severity: 'CRITICAL' },
      { id: 'sub-elec-2', category_id: 'cat-electrical', name: 'Power Outage in Room', base_severity: 'HIGH' },
      { id: 'sub-elec-3', category_id: 'cat-electrical', name: 'Switchboard / Socket Fault', base_severity: 'MEDIUM' },
      { id: 'sub-elec-4', category_id: 'cat-electrical', name: 'Fan / Tube Light Not Working', base_severity: 'LOW' },
    ],
  },
  {
    id: 'cat-sanitation',
    name: 'Sanitation & Cleanliness',
    default_sla_hours: 12,
    subcategories: [
      { id: 'sub-san-1', category_id: 'cat-sanitation', name: 'Bathroom Deep Cleaning Needed', base_severity: 'MEDIUM' },
      { id: 'sub-san-2', category_id: 'cat-sanitation', name: 'Pest / Insect Infestation', base_severity: 'HIGH' },
      { id: 'sub-san-3', category_id: 'cat-sanitation', name: 'Corridor Garbage / Dustbin Overflow', base_severity: 'LOW' },
    ],
  },
  {
    id: 'cat-internet',
    name: 'Internet & Wi-Fi',
    default_sla_hours: 24,
    subcategories: [
      { id: 'sub-net-1', category_id: 'cat-internet', name: 'No Wi-Fi Signal / Access Point Down', base_severity: 'HIGH' },
      { id: 'sub-net-2', category_id: 'cat-internet', name: 'Slow Speed / Frequent Disconnects', base_severity: 'LOW' },
      { id: 'sub-net-3', category_id: 'cat-internet', name: 'LAN Port Not Working', base_severity: 'MEDIUM' },
    ],
  },
  {
    id: 'cat-furniture',
    name: 'Furniture & Carpentry',
    default_sla_hours: 48,
    subcategories: [
      { id: 'sub-furn-1', category_id: 'cat-furniture', name: 'Broken Door Lock / Latch', base_severity: 'HIGH' },
      { id: 'sub-furn-2', category_id: 'cat-furniture', name: 'Damaged Bed Frame / Cot', base_severity: 'MEDIUM' },
      { id: 'sub-furn-3', category_id: 'cat-furniture', name: 'Study Table / Chair Broken', base_severity: 'LOW' },
    ],
  },
  {
    id: 'cat-food',
    name: 'Food & Mess',
    default_sla_hours: 12,
    subcategories: [
      { id: 'sub-food-1', category_id: 'cat-food', name: 'Food Quality / Contamination Issue', base_severity: 'CRITICAL' },
      { id: 'sub-food-2', category_id: 'cat-food', name: 'Water Cooler / RO Dispenser Malfunction', base_severity: 'HIGH' },
    ],
  },
  {
    id: 'cat-security',
    name: 'Security & Access',
    default_sla_hours: 6,
    subcategories: [
      { id: 'sub-sec-1', category_id: 'cat-security', name: 'Unauthorized Intrusion / Suspicious Activity', base_severity: 'CRITICAL' },
      { id: 'sub-sec-2', category_id: 'cat-security', name: 'Lost Key / Locked Out Emergency', base_severity: 'MEDIUM' },
    ],
  },
  {
    id: 'cat-infra',
    name: 'Room Infrastructure',
    default_sla_hours: 72,
    subcategories: [
      { id: 'sub-infra-1', category_id: 'cat-infra', name: 'Severe Wall Dampness / Seepage', base_severity: 'MEDIUM' },
      { id: 'sub-infra-2', category_id: 'cat-infra', name: 'Ceiling Plaster Flaking', base_severity: 'LOW' },
    ],
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'u-student-1',
    name: 'Aarav Sharma',
    email: 'student1@vynk.local',
    role: 'STUDENT',
    phone: '+91 98765 10001',
    student_id_number: '2026-CS-084',
    is_first_login: false,
    room: {
      roomId: 'r-204',
      roomNo: 'A-204',
      floor: 2,
      blockName: 'Block A',
      hostelId: 'hostel-boys-1',
      hostelName: 'Aryabhata Boys Hostel',
    },
  },
  {
    id: 'u-student-2',
    name: 'Rohan Verma',
    email: 'student2@vynk.local',
    role: 'STUDENT',
    phone: '+91 98765 10002',
    student_id_number: '2026-ME-019',
    is_first_login: false,
    room: {
      roomId: 'r-204',
      roomNo: 'A-204',
      floor: 2,
      blockName: 'Block A',
      hostelId: 'hostel-boys-1',
      hostelName: 'Aryabhata Boys Hostel',
    },
  },
  {
    id: 'u-tech-plumb',
    name: 'Ramesh Kumar (Plumbing Lead)',
    email: 'tech.plumbing@vynk.local',
    role: 'MAINTENANCE',
    phone: '+91 98765 00010',
    is_first_login: false,
  },
  {
    id: 'u-warden-boys',
    name: 'Prof. Suresh Nair',
    email: 'warden.boys@vynk.local',
    role: 'WARDEN',
    phone: '+91 98765 00002',
    is_first_login: false,
    hostelWarded: { id: 'hostel-boys-1', name: 'Aryabhata Boys Hostel' },
  },
  {
    id: 'u-admin-1',
    name: 'Dr. Rajesh Sharma',
    email: 'admin@vynk.local',
    role: 'SUPERADMIN',
    phone: '+91 98765 00001',
    is_first_login: false,
  },
];

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'c-101',
    student_id: 'u-student-1',
    room_id: 'r-204',
    hostel_id: 'hostel-boys-1',
    category_id: 'cat-plumbing',
    subcategory_id: 'sub-plumb-1',
    title: 'Water leaking near electrical socket in room 204',
    description:
      'There is water actively dripping from the ceiling right next to the study desk power socket. Water is accumulating near electrical wiring.',
    severity: 'CRITICAL',
    priority_score: 9.5,
    status: 'ASSIGNED',
    ai_category: 'Plumbing',
    ai_confidence: 0.94,
    ai_summary: 'Critical water seepage near power outlet posing electrical shock hazard.',
    assigned_team_id: 'team-plumb',
    assigned_to: 'u-tech-plumb',
    sla_due_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    escalation_level: 0,
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    room: {
      id: 'r-204',
      room_no: 'A-204',
      floor: {
        number: 2,
        block: {
          id: 'b-a',
          name: 'Block A',
          hostel: { id: 'hostel-boys-1', name: 'Aryabhata Boys Hostel' },
        },
      },
    },
    category: { id: 'cat-plumbing', name: 'Plumbing' },
    subcategory: { id: 'sub-plumb-1', name: 'Water Leakage' },
    assignedUser: { id: 'u-tech-plumb', name: 'Ramesh Kumar (Plumbing Lead)', email: 'tech.plumbing@vynk.local' },
    assignedTeam: { id: 'team-plumb', name: 'Plumbing & Water Services' },
    events: [
      {
        id: 'ev-1',
        action: 'SUBMITTED',
        to_status: 'SUBMITTED',
        note: 'Complaint submitted by Aarav Sharma',
        created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
      {
        id: 'ev-2',
        action: 'AI_TRIAGE',
        from_status: 'SUBMITTED',
        to_status: 'AI_PROCESSED',
        note: 'Auto-classified as Plumbing / Water Leakage (Severity: CRITICAL, confidence 0.94)',
        created_at: new Date(Date.now() - 3550 * 1000).toISOString(),
      },
      {
        id: 'ev-3',
        action: 'ASSIGNED',
        from_status: 'AI_PROCESSED',
        to_status: 'ASSIGNED',
        note: 'Auto-routed to Plumbing & Water Services team; assigned to Ramesh Kumar',
        created_at: new Date(Date.now() - 3500 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'c-102',
    student_id: 'u-student-2',
    room_id: 'r-204',
    hostel_id: 'hostel-boys-1',
    category_id: 'cat-plumbing',
    subcategory_id: 'sub-plumb-1',
    title: 'Ceiling leaking water close to socket',
    description: 'Water is dripping from the ceiling above the desk socket. Pls fix ASAP.',
    severity: 'CRITICAL',
    priority_score: 8.0,
    status: 'AI_PROCESSED',
    ai_category: 'Plumbing',
    ai_confidence: 0.91,
    ai_summary: 'Duplicate ceiling leak report in Room 204.',
    duplicate_of_id: 'c-101',
    escalation_level: 0,
    created_at: new Date(Date.now() - 1800 * 1000).toISOString(),
    room: {
      id: 'r-204',
      room_no: 'A-204',
      floor: {
        number: 2,
        block: {
          id: 'b-a',
          name: 'Block A',
          hostel: { id: 'hostel-boys-1', name: 'Aryabhata Boys Hostel' },
        },
      },
    },
    category: { id: 'cat-plumbing', name: 'Plumbing' },
    subcategory: { id: 'sub-plumb-1', name: 'Water Leakage' },
    events: [
      {
        id: 'ev-4',
        action: 'SUBMITTED',
        to_status: 'SUBMITTED',
        note: 'Complaint submitted by Rohan Verma',
        created_at: new Date(Date.now() - 1800 * 1000).toISOString(),
      },
      {
        id: 'ev-5',
        action: 'AI_DUPLICATE_DETECTED',
        from_status: 'SUBMITTED',
        to_status: 'AI_PROCESSED',
        note: 'System detected 92% semantic similarity with complaint #c-101. Linked as duplicate.',
        created_at: new Date(Date.now() - 1750 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'c-103',
    student_id: 'u-student-1',
    room_id: 'r-204',
    hostel_id: 'hostel-boys-1',
    category_id: 'cat-electrical',
    subcategory_id: 'sub-elec-1',
    title: 'Switchboard sparking and burning smell',
    description: 'When switching on the ceiling fan, sparks flew out and there is a burning plastic smell.',
    severity: 'CRITICAL',
    priority_score: 9.8,
    status: 'IN_PROGRESS',
    ai_category: 'Electrical',
    ai_confidence: 0.96,
    ai_summary: 'Hazardous sparking switchboard with burning smell.',
    assigned_team_id: 'team-elec',
    assigned_to: 'u-tech-plumb',
    sla_due_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    escalation_level: 0,
    created_at: new Date(Date.now() - 7200 * 1000).toISOString(),
    room: {
      id: 'r-204',
      room_no: 'A-204',
      floor: {
        number: 2,
        block: {
          id: 'b-a',
          name: 'Block A',
          hostel: { id: 'hostel-boys-1', name: 'Aryabhata Boys Hostel' },
        },
      },
    },
    category: { id: 'cat-electrical', name: 'Electrical' },
    subcategory: { id: 'sub-elec-1', name: 'Sparking / Short Circuit / Exposed Wire' },
    events: [
      {
        id: 'ev-6',
        action: 'STATUS_CHANGE',
        from_status: 'ASSIGNED',
        to_status: 'IN_PROGRESS',
        note: 'Technician on site inspecting wiring and MCB',
        created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'c-104',
    student_id: 'u-student-1',
    room_id: 'r-204',
    hostel_id: 'hostel-boys-1',
    category_id: 'cat-furniture',
    subcategory_id: 'sub-furn-1',
    title: 'Broken door lock latch cannot latch shut',
    description: 'The internal latch came loose and room cannot be locked from inside.',
    severity: 'HIGH',
    priority_score: 6.5,
    status: 'RESOLVED',
    ai_category: 'Furniture & Carpentry',
    ai_confidence: 0.88,
    ai_summary: 'Internal room lock latch detached.',
    assigned_team_id: 'team-furn',
    escalation_level: 0,
    resolved_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 86400 * 1000).toISOString(),
    room: {
      id: 'r-204',
      room_no: 'A-204',
      floor: {
        number: 2,
        block: {
          id: 'b-a',
          name: 'Block A',
          hostel: { id: 'hostel-boys-1', name: 'Aryabhata Boys Hostel' },
        },
      },
    },
    category: { id: 'cat-furniture', name: 'Furniture & Carpentry' },
    subcategory: { id: 'sub-furn-1', name: 'Broken Door Lock / Latch' },
    feedbacks: [{ id: 'fb-1', rating: 5, comment: 'Fixed rapidly! Very courteous technician.', created_at: new Date().toISOString() }],
    events: [
      {
        id: 'ev-7',
        action: 'STATUS_CHANGE',
        from_status: 'IN_PROGRESS',
        to_status: 'RESOLVED',
        note: 'Replaced screws and reinforced latch plate.',
        created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
    ],
  },
];

// Helper to get active mock store
function getMockState() {
  return {
    hostels: getStored<HostelItem[]>('hostels', INITIAL_HOSTELS),
    categories: getStored<CategoryItem[]>('categories', INITIAL_CATEGORIES),
    users: getStored<User[]>('users', INITIAL_USERS),
    complaints: getStored<Complaint[]>('complaints', INITIAL_COMPLAINTS),
    notifications: getStored<any[]>('notifications', [
      { id: 'notif-1', user_id: 'u-student-1', message: 'Complaint c-101 has been assigned to Ramesh Kumar', read: false },
    ]),
  };
}

/**
 * Read-Time SLA Watchdog & Escalation Engine:
 * Evaluates target SLA deadlines dynamically when the admin dashboard, analytics,
 * or complaints load. Overdue complaints are automatically tagged and escalated
 * without relying on sub-daily cron schedules.
 */
function checkAndEscalateComplaintsAtReadTime(complaints: Complaint[]): boolean {
  const now = Date.now();
  let modified = false;

  for (const c of complaints) {
    if (c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.sla_due_at) {
      const dueTime = new Date(c.sla_due_at).getTime();
      if (now > dueTime) {
        const overdueHours = (now - dueTime) / (1000 * 60 * 60);
        let targetLevel = 1;
        if (overdueHours > 24) targetLevel = 3;
        else if (overdueHours > 6) targetLevel = 2;

        if ((c.escalation_level || 0) < targetLevel) {
          c.escalation_level = targetLevel;
          c.events = c.events || [];
          c.events.push({
            id: `ev-esc-${Date.now()}-${c.id}`,
            action: 'ESCALATED',
            from_status: c.status,
            to_status: c.status,
            note: `Target resolution SLA deadline breached by ${Math.max(1, Math.round(overdueHours))}h. Auto-escalated to Level ${targetLevel}.`,
            created_at: new Date().toISOString(),
          });
          modified = true;
        }
      }
    }
  }

  return modified;
}

// ---------------------------------------------------------------------------
// Client Request Dispatcher
// ---------------------------------------------------------------------------
const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Always route Gemini calls directly to /api/gemini
  if (endpoint.startsWith('/gemini')) {
    const res = await fetch('/api/gemini', options);
    if (!res.ok) throw new ApiError('Gemini request failed', res.status);
    return (await res.json()) as T;
  }

  // Attempt real network fetch first
  const token = localStorage.getItem('vynk_access_token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';

    // If server returned valid JSON API response, return it
    if (response.ok && contentType.includes('application/json')) {
      return await response.json();
    }
  } catch (netErr) {
    // Network failed or offline -> fall through to in-memory mock handler
  }

  // Fallback Mock Handler for Vercel deployment / offline mode
  return handleMockRequest<T>(endpoint, options);
}

// ---------------------------------------------------------------------------
// Mock Request Processor (Keeps all features working on Vercel)
// ---------------------------------------------------------------------------
async function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const state = getMockState();
  const urlParts = endpoint.split('?');
  const path = urlParts[0];

  let body: any = {};
  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = {};
      }
    } else if (options.body instanceof FormData) {
      body = Object.fromEntries((options.body as any).entries());
    }
  }

  // Current logged in user from mock
  const token = localStorage.getItem('vynk_access_token');
  const currentUser = state.users.find((u) => u.id === token) || state.users[0];

  // Trigger read-time SLA & escalation evaluation whenever complaints, details, or dashboards are accessed
  if (path.startsWith('/complaints') || path.includes('/analytics') || path === '/insights') {
    if (checkAndEscalateComplaintsAtReadTime(state.complaints)) {
      setStored('complaints', state.complaints);
    }
  }

  // 1. Auth routes
  if (path === '/auth/me') {
    if (!token) return { success: true, data: null } as unknown as T;
    return { success: true, data: currentUser } as unknown as T;
  }

  if (path === '/auth/login') {
    const email = body.email?.toLowerCase().trim();
    let matched = state.users.find((u) => u.email.toLowerCase() === email);

    // If student doesn't exist yet, auto-create
    if (!matched && email.includes('student')) {
      matched = {
        id: `u-student-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'STUDENT',
        is_first_login: true,
      };
      state.users.push(matched);
      setStored('users', state.users);
    }

    if (!matched) {
      throw new ApiError('Invalid email or password.', 401);
    }

    localStorage.setItem('vynk_access_token', matched.id);
    localStorage.setItem('vynk_refresh_token', `refresh-${matched.id}`);

    return {
      success: true,
      data: {
        accessToken: matched.id,
        refreshToken: `refresh-${matched.id}`,
        user: matched,
      },
    } as unknown as T;
  }

  if (path === '/auth/student/signup') {
    const email = body.email?.toLowerCase().trim();
    let user = state.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: `u-student-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'STUDENT',
        is_first_login: true,
      };
      state.users.push(user);
      setStored('users', state.users);
    }
    localStorage.setItem('vynk_access_token', user.id);
    return {
      success: true,
      data: { accessToken: user.id, refreshToken: `refresh-${user.id}`, user },
    } as unknown as T;
  }

  if (path === '/auth/student/onboarding') {
    currentUser.name = body.name || currentUser.name;
    currentUser.student_id_number = body.studentId;
    currentUser.is_first_login = false;
    currentUser.room = {
      roomId: `r-${body.roomNumber}`,
      roomNo: body.roomNumber,
      floor: 2,
      blockName: 'Block A',
      hostelId: 'hostel-boys-1',
      hostelName: body.hostelName || 'Aryabhata Boys Hostel',
    };
    setStored('users', state.users);
    return { success: true, data: { user: currentUser } } as unknown as T;
  }

  if (path === '/auth/set-password') {
    currentUser.is_first_login = false;
    setStored('users', state.users);
    return { success: true, message: 'Password updated' } as unknown as T;
  }

  // 2. Hostels & Categories
  if (path === '/hostels') {
    return { success: true, data: state.hostels } as unknown as T;
  }

  if (path === '/categories') {
    return { success: true, data: state.categories } as unknown as T;
  }

  // 3. Complaints
  if (path === '/complaints') {
    if (method === 'GET') {
      let filtered = [...state.complaints];
      // Role Scoping
      if (currentUser.role === 'STUDENT') {
        filtered = filtered.filter((c) => c.student_id === currentUser.id);
      } else if (currentUser.role === 'MAINTENANCE') {
        filtered = filtered.filter((c) => c.assigned_to === currentUser.id || !c.assigned_to);
      }
      return { success: true, data: filtered } as unknown as T;
    }

    if (method === 'POST') {
      // Call /api/gemini for AI triage
      let aiResult: any = null;
      try {
        const geminiRes = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'classify',
            title: body.title,
            description: body.description,
          }),
        });
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiResult = geminiData.data;
        }
      } catch (e) {
        // fallback
      }

      const assignedCategory = aiResult?.category || 'Plumbing';
      const assignedSeverity = (aiResult?.severity as Severity) || 'MEDIUM';

      const newComplaint: Complaint = {
        id: `c-${Date.now().toString().slice(-4)}`,
        student_id: currentUser.id,
        room_id: currentUser.room?.roomId || 'r-204',
        hostel_id: currentUser.room?.hostelId || 'hostel-boys-1',
        category_id: 'cat-plumbing',
        subcategory_id: 'sub-plumb-1',
        title: body.title,
        description: body.description,
        severity: assignedSeverity,
        priority_score: assignedSeverity === 'CRITICAL' ? 9.5 : 5.0,
        status: 'ASSIGNED',
        ai_category: assignedCategory,
        ai_confidence: aiResult?.confidence || 0.92,
        ai_summary: aiResult?.summary || body.title,
        created_at: new Date().toISOString(),
        room: {
          id: currentUser.room?.roomId || 'r-204',
          room_no: currentUser.room?.roomNo || 'A-204',
          floor: {
            number: 2,
            block: {
              id: 'b-a',
              name: 'Block A',
              hostel: {
                id: currentUser.room?.hostelId || 'hostel-boys-1',
                name: currentUser.room?.hostelName || 'Aryabhata Boys Hostel',
              },
            },
          },
        },
        category: { id: 'cat-plumbing', name: assignedCategory },
        subcategory: { id: 'sub-1', name: aiResult?.subcategory || 'General Issue' },
        assignedUser: { id: 'u-tech-plumb', name: 'Ramesh Kumar (Plumbing Lead)', email: 'tech.plumbing@vynk.local' },
        assigned_to: 'u-tech-plumb',
        sla_due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        escalation_level: 0,
        events: [
          {
            id: `ev-${Date.now()}`,
            action: 'SUBMITTED',
            to_status: 'SUBMITTED',
            note: `Submitted by ${currentUser.name}`,
            created_at: new Date().toISOString(),
          },
          {
            id: `ev-${Date.now() + 1}`,
            action: 'AI_TRIAGE',
            from_status: 'SUBMITTED',
            to_status: 'AI_PROCESSED',
            note: `Auto-classified as ${assignedCategory} (${assignedSeverity}, confidence: ${aiResult?.confidence || 0.92})`,
            created_at: new Date().toISOString(),
          },
          {
            id: `ev-${Date.now() + 2}`,
            action: 'ASSIGNED',
            from_status: 'AI_PROCESSED',
            to_status: 'ASSIGNED',
            note: 'Auto-routed to Maintenance Services team',
            created_at: new Date().toISOString(),
          },
        ],
      };

      state.complaints.unshift(newComplaint);
      setStored('complaints', state.complaints);
      return { success: true, data: newComplaint } as unknown as T;
    }
  }

  // Single complaint
  if (path.startsWith('/complaints/')) {
    const id = path.replace('/complaints/', '').split('/')[0];
    const subRoute = path.replace(`/complaints/${id}`, '');
    const complaint = state.complaints.find((c) => c.id === id);

    if (!complaint) {
      throw new ApiError('Complaint not found', 404);
    }

    if (!subRoute && method === 'GET') {
      return { success: true, data: complaint } as unknown as T;
    }

    if (subRoute === '/status' && method === 'PATCH') {
      const fromStatus = complaint.status;
      complaint.status = body.status;
      if (body.status === 'RESOLVED') complaint.resolved_at = new Date().toISOString();
      if (body.status === 'CLOSED') complaint.closed_at = new Date().toISOString();

      complaint.events = complaint.events || [];
      complaint.events.push({
        id: `ev-${Date.now()}`,
        action: 'STATUS_CHANGE',
        from_status: fromStatus,
        to_status: body.status,
        note: body.note || `Status transitioned to ${body.status}`,
        created_at: new Date().toISOString(),
      });

      setStored('complaints', state.complaints);
      return { success: true, data: complaint } as unknown as T;
    }

    if (subRoute === '/feedback' && method === 'POST') {
      complaint.feedbacks = complaint.feedbacks || [];
      complaint.feedbacks.push({
        id: `fb-${Date.now()}`,
        rating: body.rating,
        comment: body.comment,
        created_at: new Date().toISOString(),
      });
      setStored('complaints', state.complaints);
      return { success: true, data: complaint } as unknown as T;
    }

    if (subRoute === '/assign' && method === 'PATCH') {
      complaint.assigned_to = body.assigned_to;
      complaint.status = 'ASSIGNED';
      setStored('complaints', state.complaints);
      return { success: true, data: complaint } as unknown as T;
    }

    if (subRoute === '/reopen' && method === 'POST') {
      complaint.status = 'REOPENED';
      complaint.events = complaint.events || [];
      complaint.events.push({
        id: `ev-${Date.now()}`,
        action: 'REOPENED',
        to_status: 'REOPENED',
        note: body.reason || 'Reopened by student',
        created_at: new Date().toISOString(),
      });
      setStored('complaints', state.complaints);
      return { success: true, data: complaint } as unknown as T;
    }
  }

  // 4. Analytics & Dashboard Metrics
  if (path.includes('/analytics')) {
    const total = state.complaints.length;
    const resolved = state.complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const critical = state.complaints.filter((c) => c.severity === 'CRITICAL').length;
    const inProgress = state.complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;

    return {
      success: true,
      data: {
        kpis: {
          totalComplaints: total,
          resolvedComplaints: resolved,
          criticalComplaints: critical,
          inProgressComplaints: inProgress,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 100,
          avgResolutionHours: 4.8,
          slaAdherenceRate: 94.2,
        },
        categoryBreakdown: [
          { name: 'Plumbing', count: 8 },
          { name: 'Electrical', count: 5 },
          { name: 'Furniture & Carpentry', count: 3 },
          { name: 'Sanitation', count: 2 },
          { name: 'Internet & Wi-Fi', count: 1 },
        ],
        hostelComparison: [
          { name: 'Aryabhata Boys Hostel', total: 12, resolved: 9, critical: 3 },
          { name: 'Sarojini Girls Hostel', total: 7, resolved: 6, critical: 1 },
        ],
        dailyTrends: [
          { date: 'Mon', submitted: 4, resolved: 3 },
          { date: 'Tue', submitted: 6, resolved: 5 },
          { date: 'Wed', submitted: 3, resolved: 4 },
          { date: 'Thu', submitted: 5, resolved: 6 },
          { date: 'Fri', submitted: 8, resolved: 7 },
        ],
      },
    } as unknown as T;
  }

  // 5. Insights
  if (path.includes('/insights')) {
    return {
      success: true,
      data: {
        summary:
          'Aryabhata Boys Hostel (Block B, Floor 2) has recorded 7 plumbing complaints over the last 14 days, primarily related to pipe joint leakage. Preventive maintenance of the main distribution riser pipe is strongly recommended.',
      },
    } as unknown as T;
  }

  // 6. Notifications
  if (path.includes('/notifications')) {
    return { success: true, data: state.notifications } as unknown as T;
  }

  // 7. Maintenance Staff
  if (path.includes('/maintenance-staff')) {
    const staff = state.users.filter((u) => u.role === 'MAINTENANCE');
    return { success: true, data: staff } as unknown as T;
  }

  // 8. Users
  if (path.includes('/users')) {
    return { success: true, data: state.users } as unknown as T;
  }

  // 9. Audit Logs
  if (path.includes('/audit-logs') || path.includes('/audit')) {
    const allEvents = state.complaints.flatMap((c) =>
      (c.events || []).map((e) => ({
        ...e,
        complaint_title: c.title,
        complaint_id: c.id,
      }))
    );
    return { success: true, data: allEvents } as unknown as T;
  }

  // Default fallback response
  return { success: true, data: [] } as unknown as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  put: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
