import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  SuperAdminMetrics,
  HostelItem,
  BlockItem,
  FloorItem,
  RoomItem,
  RoomAllocationItem,
  CategoryItem,
  TeamItem,
  Complaint,
  Role,
  Severity,
  ComplaintStatus,
} from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import {
  Shield,
  Layers,
  Users,
  FolderTree,
  FileText,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Wrench,
  Search,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  UserPlus,
  UserCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Home,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Key,
  Edit,
  Power,
  Send,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ActiveTab = 'DASHBOARD' | 'INFRASTRUCTURE' | 'USERS' | 'MAINTENANCE_STAFF' | 'CATEGORIES_TEAMS' | 'COMPLAINTS' | 'AUDIT_LOG';
type InfraSubTab = 'HOSTELS' | 'BLOCKS' | 'FLOORS' | 'ROOMS' | 'ALLOCATIONS';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export const SuperAdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [loading, setLoading] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Dashboard State
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [hostelStats, setHostelStats] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);

  // 2. Infrastructure State
  const [infraSubTab, setInfraSubTab] = useState<InfraSubTab>('HOSTELS');
  const [hostels, setHostels] = useState<HostelItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [allocations, setAllocations] = useState<RoomAllocationItem[]>([]);
  // Infrastructure Modals
  const [showAddHostelModal, setShowAddHostelModal] = useState(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAllocateRoomModal, setShowAllocateRoomModal] = useState(false);

  // Form states for infrastructure
  const [newHostel, setNewHostel] = useState({ name: '', type: 'BOYS' });
  const [newBlock, setNewBlock] = useState({ hostel_id: '', name: '' });
  const [newFloor, setNewFloor] = useState({ block_id: '', number: 1 });
  const [newRoom, setNewRoom] = useState({ floor_id: '', room_no: '', capacity: 2 });
  const [newAllocation, setNewAllocation] = useState({ room_id: '', student_id: '' });

  // 3. Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STUDENT', phone: '' });
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<any | null>(null);
  const [targetRole, setTargetRole] = useState<Role>('STUDENT');
  const [targetHostelId, setTargetHostelId] = useState('');

  // 4. Categories & Teams State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState<string | null>(null); // categoryId
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState<string | null>(null); // teamId
  const [newCategory, setNewCategory] = useState({ name: '', default_sla_hours: 24 });
  const [newSubcategory, setNewSubcategory] = useState({ name: '', base_severity: 'MEDIUM' });
  const [newTeam, setNewTeam] = useState({ name: '', head_id: '' });
  const [selectedMemberUserId, setSelectedMemberUserId] = useState('');

  // 5. Complaints State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>('ALL');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState<string>('ALL');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [reassignModalComplaint, setReassignModalComplaint] = useState<Complaint | null>(null);
  const [reassignForm, setReassignForm] = useState({
    team_id: '',
    assigned_to: '',
    severity: 'MEDIUM',
    note: '',
    worker: { name: '', department: '', phone: '', email: '' },
    assignmentMode: 'TECHNICIAN' as 'TECHNICIAN' | 'WORKER_DETAILS',
  });

  // 6. Audit Log State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditFilter, setAuditFilter] = useState('');

  // Notification Banner Helper
  const showBanner = (type: 'success' | 'error', text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Master Data Loader
  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [
        metricsRes,
        hostelStatsRes,
        catStatsRes,
        hostelsRes,
        blocksRes,
        roomsRes,
        allocRes,
        usersRes,
        catsRes,
        teamsRes,
        compsRes,
        auditsRes,
      ]: any[] = await Promise.all([
        api.get('/analytics/super-admin'),
        api.get('/analytics/by-hostel'),
        api.get('/analytics/by-category'),
        api.get('/hostels'),
        api.get('/blocks'),
        api.get('/rooms'),
        api.get('/room-allocations'),
        api.get('/users'),
        api.get('/categories'),
        api.get('/teams'),
        api.get('/complaints'),
        api.get('/audit-logs'),
      ]);

      if (metricsRes?.success) setMetrics(metricsRes.data);
      if (hostelStatsRes?.success) setHostelStats(hostelStatsRes.data);
      if (catStatsRes?.success) setCategoryStats(catStatsRes.data);
      if (hostelsRes?.success) setHostels(hostelsRes.data);
      if (blocksRes?.success) setBlocks(blocksRes.data);
      if (roomsRes?.success) setRooms(roomsRes.data);
      if (allocRes?.success) setAllocations(allocRes.data);
      if (usersRes?.success) setUsersList(usersRes.data);
      if (catsRes?.success) setCategories(catsRes.data);
      if (teamsRes?.success) setTeams(teamsRes.data);
      if (compsRes?.success) setComplaints(compsRes.data);
      if (auditsRes?.success) {
        setAuditLogs(auditsRes.data);
        setAuditTotal(auditsRes.total);
      }
    } catch (err: any) {
      console.error('Failed to load Super Admin portal data', err);
      showBanner('error', err.response?.data?.message || 'Failed to fetch portal datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  // Infrastructure Actions
  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/hostels', newHostel);
      if (res?.success) {
        showBanner('success', `Hostel "${newHostel.name}" added successfully`);
        setShowAddHostelModal(false);
        setNewHostel({ name: '', type: 'BOYS' });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to add hostel');
    }
  };

  const handleDeleteHostel = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete hostel "${name}"? This action cannot be undone.`)) return;
    try {
      const res: any = await api.delete(`/hostels/${id}`);
      if (res?.success) {
        showBanner('success', `Hostel "${name}" removed successfully`);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Cannot delete hostel with active complaints.');
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/blocks', newBlock);
      if (res?.success) {
        showBanner('success', `Block "${newBlock.name}" created successfully`);
        setShowAddBlockModal(false);
        setNewBlock({ hostel_id: '', name: '' });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to add block');
    }
  };

  const handleDeleteBlock = async (id: string, name: string) => {
    if (!window.confirm(`Delete block "${name}"?`)) return;
    try {
      const res: any = await api.delete(`/blocks/${id}`);
      if (res?.success) {
        showBanner('success', `Block "${name}" deleted`);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to delete block');
    }
  };

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/floors', {
        block_id: newFloor.block_id,
        number: Number(newFloor.number),
      });
      if (res?.success) {
        showBanner('success', `Floor ${newFloor.number} added successfully`);
        setShowAddFloorModal(false);
        setNewFloor({ block_id: '', number: 1 });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to add floor');
    }
  };

  const handleDeleteFloor = async (id: string, num: number) => {
    if (!window.confirm(`Delete Floor ${num}?`)) return;
    try {
      const res: any = await api.delete(`/floors/${id}`);
      if (res?.success) {
        showBanner('success', `Floor ${num} deleted`);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to delete floor');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/rooms', {
        floor_id: newRoom.floor_id,
        room_no: newRoom.room_no,
        capacity: Number(newRoom.capacity),
      });
      if (res?.success) {
        showBanner('success', `Room ${newRoom.room_no} created successfully`);
        setShowAddRoomModal(false);
        setNewRoom({ floor_id: '', room_no: '', capacity: 2 });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to add room');
    }
  };

  const handleDeleteRoom = async (id: string, roomNo: string) => {
    if (!window.confirm(`Delete Room ${roomNo}?`)) return;
    try {
      const res: any = await api.delete(`/rooms/${id}`);
      if (res?.success) {
        showBanner('success', `Room ${roomNo} deleted`);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Cannot delete room with active complaints.');
    }
  };

  const handleAllocateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/room-allocations', newAllocation);
      if (res?.success) {
        showBanner('success', 'Student room allocated successfully');
        setShowAllocateRoomModal(false);
        setNewAllocation({ room_id: '', student_id: '' });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to allocate room');
    }
  };

  const handleRevokeAllocation = async (id: string) => {
    if (!window.confirm('Revoke this room allocation?')) return;
    try {
      const res: any = await api.delete(`/room-allocations/${id}`);
      if (res?.success) {
        showBanner('success', 'Allocation revoked successfully');
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to revoke allocation');
    }
  };

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/users', newUser);
      if (res?.success) {
        showBanner('success', `Account for "${newUser.name}" (${newUser.role}) created successfully`);
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'STUDENT', phone: '' });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to provision user');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRoleChange) return;
    try {
      const res: any = await api.put(`/users/${selectedUserForRoleChange.id}/role`, {
        role: targetRole,
        hostel_id: targetRole === 'WARDEN' ? targetHostelId || undefined : undefined,
      });
      if (res?.success) {
        showBanner('success', `Role updated to ${targetRole} for ${selectedUserForRoleChange.name}`);
        setSelectedUserForRoleChange(null);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === user?.id) {
      alert('You cannot delete your own active Super Admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;
    try {
      const res: any = await api.delete(`/users/${id}`);
      if (res?.success) {
        showBanner('success', `User "${name}" deleted`);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Category & Team Actions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/categories', {
        name: newCategory.name,
        default_sla_hours: Number(newCategory.default_sla_hours),
      });
      if (res?.success) {
        showBanner('success', `Category "${newCategory.name}" created`);
        setShowAddCategoryModal(false);
        setNewCategory({ name: '', default_sla_hours: 24 });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? All associated complaints must be cleared first.`)) return;
    try {
      const res: any = await api.delete(`/categories/${id}`);
      if (res?.success) {
        showBanner('success', `Category "${name}" deleted`);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Cannot delete category with associated complaints');
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddSubcategoryModal) return;
    try {
      const res: any = await api.post('/subcategories', {
        category_id: showAddSubcategoryModal,
        name: newSubcategory.name,
        base_severity: newSubcategory.base_severity,
      });
      if (res?.success) {
        showBanner('success', `Subcategory "${newSubcategory.name}" added`);
        setShowAddSubcategoryModal(null);
        setNewSubcategory({ name: '', base_severity: 'MEDIUM' });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to add subcategory');
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete subcategory "${name}"?`)) return;
    try {
      const res: any = await api.delete(`/subcategories/${id}`);
      if (res?.success) {
        showBanner('success', `Subcategory "${name}" deleted`);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Cannot delete subcategory with existing complaints');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/teams', {
        name: newTeam.name,
        head_id: newTeam.head_id || undefined,
      });
      if (res?.success) {
        showBanner('success', `Team "${newTeam.name}" created`);
        setShowAddTeamModal(false);
        setNewTeam({ name: '', head_id: '' });
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to create team');
    }
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!window.confirm(`Delete team "${name}"?`)) return;
    try {
      const res: any = await api.delete(`/teams/${id}`);
      if (res?.success) {
        showBanner('success', `Team "${name}" deleted`);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to delete team');
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddTeamMemberModal || !selectedMemberUserId) return;
    try {
      const res: any = await api.post(`/teams/${showAddTeamMemberModal}/members`, {
        user_id: selectedMemberUserId,
      });
      if (res?.success) {
        showBanner('success', 'Staff member added to team');
        setShowAddTeamMemberModal(null);
        setSelectedMemberUserId('');
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to add member to team');
    }
  };

  const handleRemoveTeamMember = async (teamId: string, memberUserId: string) => {
    if (!window.confirm('Remove staff member from team?')) return;
    try {
      const res: any = await api.delete(`/teams/${teamId}/members/${memberUserId}`);
      if (res?.success) {
        showBanner('success', 'Staff member removed from team');
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to remove staff member');
    }
  };

  // Complaint Reassignment
  const openReassignModal = (complaint: Complaint) => {
    setReassignModalComplaint(complaint);
    setReassignForm({
      team_id: complaint.assigned_team_id || '',
      assigned_to: complaint.assigned_to || '',
      severity: complaint.severity,
      note: '',
      worker: {
        name: complaint.assignedUser?.name || '',
        department: complaint.assignedTeam?.name || '',
        phone: complaint.assignedUser?.phone || '',
        email: complaint.assignedUser?.email || '',
      },
      assignmentMode: complaint.assigned_to ? 'TECHNICIAN' : 'WORKER_DETAILS',
    });
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalComplaint) return;
    try {
      const payload: any = {
        severity: reassignForm.severity,
        note: reassignForm.note || 'Reassigned by Super Admin',
      };

      if (reassignForm.assignmentMode === 'TECHNICIAN') {
        payload.assigned_to = reassignForm.assigned_to || undefined;
        payload.team_id = reassignForm.team_id || undefined;
      } else {
        if (!reassignForm.worker.name) {
          alert('Worker Name is required');
          return;
        }
        payload.worker = reassignForm.worker;
        if (reassignForm.team_id) payload.team_id = reassignForm.team_id;
      }

      const res: any = await api.patch(`/complaints/${reassignModalComplaint.id}/assign`, payload);
      if (res?.success) {
        showBanner('success', `Complaint #${reassignModalComplaint.id.slice(0, 8)} successfully reassigned`);
        setReassignModalComplaint(null);
        loadPortalData();
      }
    } catch (err: any) {
      showBanner('error', err.response?.data?.message || 'Failed to reassign complaint');
    }
  };

  // Filtered datasets
  const filteredUsers = usersList.filter((u) => {
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchQuery =
      !userSearchQuery ||
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearchQuery));
    return matchRole && matchQuery;
  });

  const filteredComplaints = complaints.filter((c) => {
    const matchStatus = complaintStatusFilter === 'ALL' || c.status === complaintStatusFilter;
    const matchCat = complaintCategoryFilter === 'ALL' || c.category_id === complaintCategoryFilter;
    const matchQ =
      !complaintSearch ||
      c.title.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      (c.student?.name && c.student.name.toLowerCase().includes(complaintSearch.toLowerCase())) ||
      (c.room?.room_no && c.room.room_no.includes(complaintSearch));
    return matchStatus && matchCat && matchQ;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditFilter) return true;
    const q = auditFilter.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.actor?.name && log.actor.name.toLowerCase().includes(q)) ||
      (log.complaint?.title && log.complaint.title.toLowerCase().includes(q)) ||
      (log.note && log.note.toLowerCase().includes(q))
    );
  });

  // Maintenance staff candidate list
  const maintenanceCandidates = usersList.filter((u) => u.role === 'MAINTENANCE');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner Notifications */}
      {notificationMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between shadow-lg border transition-all ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30 border border-purple-800/30 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Super Admin Command Center</h1>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Root Privilege
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Comprehensive campus-wide oversight, infrastructure management, provisioning, and immutable audit logs.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPortalData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 border-b border-slate-800 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'DASHBOARD'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('INFRASTRUCTURE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'INFRASTRUCTURE'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Infrastructure</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'USERS'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('CATEGORIES_TEAMS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'CATEGORIES_TEAMS'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Categories & Teams</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLAINTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'COMPLAINTS'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Complaints</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOG')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'AUDIT_LOG'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top 4 KPI Counter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Complaints */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Complaints</span>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white mt-3">{metrics?.total ?? 0}</div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <span className="text-blue-400 font-semibold">Campus-Wide</span> across all hostels & blocks
              </div>
            </div>

            {/* Pending Complaints */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Triage</span>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-amber-400 mt-3">{metrics?.pending ?? 0}</div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <span className="text-amber-400 font-semibold">Awaiting Dispatch</span> or review
              </div>
            </div>

            {/* Assigned Complaints */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned / In Progress</span>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-purple-400 mt-3">{metrics?.assigned ?? 0}</div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <span className="text-purple-400 font-semibold">Active Work</span> with staff or teams
              </div>
            </div>

            {/* Solved Complaints */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Solved & Closed</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-400 mt-3">{metrics?.solved ?? 0}</div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <span className="text-emerald-400 font-semibold">
                  {metrics?.total ? Math.round((metrics.solved / metrics.total) * 100) : 0}%
                </span>{' '}
                resolution rate
              </div>
            </div>
          </div>

          {/* Secondary Operational Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">Critical Issues</span>
              <span className="text-2xl font-black text-white mt-1 block">{metrics?.critical ?? 0}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">SLA Breached</span>
              <span className="text-2xl font-black text-white mt-1 block">{metrics?.slaBreached ?? 0}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">Total Hostels</span>
              <span className="text-2xl font-black text-white mt-1 block">{metrics?.totalHostels ?? 0}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">Total Rooms</span>
              <span className="text-2xl font-black text-white mt-1 block">{metrics?.totalRooms ?? 0}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">Students</span>
              <span className="text-2xl font-black text-white mt-1 block">{metrics?.totalStudents ?? 0}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block">Staff & Wardens</span>
              <span className="text-2xl font-black text-white mt-1 block">{metrics?.totalStaff ?? 0}</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Hostel */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>Complaints by Hostel</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">Campus Facilities</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Distribution across campus residence facilities</p>
              
              {hostelStats && hostelStats.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-64 w-full min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hostelStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          interval={0}
                          tickFormatter={(val: string) => {
                            if (!val) return '';
                            return val.split(' ')[0] || val;
                          }}
                        />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                          itemStyle={{ color: '#cbd5e1' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="totalComplaints" name="Total Complaints" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="openComplaints" name="Open / Active" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary list below the chart */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                    {hostelStats.map((h: any) => (
                      <div key={h.hostelId || h.name} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-xs text-white">{h.name}</div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase mt-0.5 inline-block">
                            {h.type}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-purple-400">{h.totalComplaints} Total</div>
                          <div className="text-[10px] text-amber-400">{h.openComplaints} Open</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <Building className="w-8 h-8 text-slate-600 animate-pulse" />
                  <span>Loading hostel data...</span>
                </div>
              )}
            </div>

            {/* By Category */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-emerald-400" />
                  <span>Issue Category Breakdown</span>
                </h3>
                <span className="text-xs text-slate-400 font-medium">Issue Types</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Proportion of campus maintenance requirements</p>
              
              {categoryStats && categoryStats.some((c: any) => c.total > 0) ? (
                <div className="space-y-4">
                  <div className="h-64 w-full min-h-[256px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats.filter((c: any) => c.total > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="total"
                          nameKey="name"
                        >
                          {categoryStats
                            .filter((c: any) => c.total > 0)
                            .map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                          itemStyle={{ color: '#cbd5e1' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top categories legend with counts */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
                    {categoryStats
                      .filter((c: any) => c.total > 0)
                      .slice(0, 4)
                      .map((cat: any, idx: number) => (
                        <div key={cat.categoryId || cat.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-slate-300 truncate">{cat.name}</span>
                          </div>
                          <span className="font-bold text-white ml-1">{cat.total}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <FolderTree className="w-8 h-8 text-slate-600" />
                  <span>No category statistics available</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Recent Activity */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Recent System Incidents</span>
              </h3>
              <button
                onClick={() => setActiveTab('COMPLAINTS')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>View All Complaints</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {metrics?.recentComplaints?.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-200">{c.title}</td>
                      <td className="p-3 text-slate-300">{c.category?.name || 'General'}</td>
                      <td className="p-3 text-slate-300">Room {c.room?.room_no || 'N/A'}</td>
                      <td className="p-3">
                        <SeverityBadge severity={c.severity as Severity} />
                      </td>
                      <td className="p-3">
                        <StatusBadge status={c.status as ComplaintStatus} />
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INFRASTRUCTURE MANAGEMENT */}
      {activeTab === 'INFRASTRUCTURE' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              {(['HOSTELS', 'BLOCKS', 'FLOORS', 'ROOMS', 'ALLOCATIONS'] as InfraSubTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInfraSubTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    infraSubTab === tab
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab === 'ALLOCATIONS' ? 'Room Allocations' : tab}
                </button>
              ))}
            </div>

            {/* Quick Add buttons depending on subtab */}
            <div>
              {infraSubTab === 'HOSTELS' && (
                <button
                  onClick={() => setShowAddHostelModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Hostel</span>
                </button>
              )}
              {infraSubTab === 'BLOCKS' && (
                <button
                  onClick={() => setShowAddBlockModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Block</span>
                </button>
              )}
              {infraSubTab === 'FLOORS' && (
                <button
                  onClick={() => setShowAddFloorModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Floor</span>
                </button>
              )}
              {infraSubTab === 'ROOMS' && (
                <button
                  onClick={() => setShowAddRoomModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Room</span>
                </button>
              )}
              {infraSubTab === 'ALLOCATIONS' && (
                <button
                  onClick={() => setShowAllocateRoomModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Allocate Student Room</span>
                </button>
              )}
            </div>
          </div>

          {/* Subtab: HOSTELS */}
          {infraSubTab === 'HOSTELS' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Hostel Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Assigned Warden</th>
                    <th className="p-4">Blocks</th>
                    <th className="p-4">Complaints Count</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {hostels.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-slate-200 flex items-center gap-2">
                        <Building className="w-4 h-4 text-purple-400" />
                        <span>{h.name}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {h.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        {h.warden ? `${h.warden.name} (${h.warden.email})` : <span className="text-slate-500 italic">None Assigned</span>}
                      </td>
                      <td className="p-4 text-slate-300">{h.blocks?.length ?? 0} Block(s)</td>
                      <td className="p-4 text-slate-300">{h._count?.complaints ?? 0}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteHostel(h.id, h.name)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Hostel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Subtab: BLOCKS */}
          {infraSubTab === 'BLOCKS' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Block Name</th>
                    <th className="p-4">Hostel</th>
                    <th className="p-4">Floors Count</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {blocks.map((b) => {
                    const parentHostel = hostels.find((h) => h.id === b.hostel_id);
                    return (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-slate-200">{b.name}</td>
                        <td className="p-4 text-slate-300">{parentHostel?.name || 'Hostel'}</td>
                        <td className="p-4 text-slate-300">{b.floors?.length ?? 0} Floor(s)</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteBlock(b.id, b.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Subtab: FLOORS */}
          {infraSubTab === 'FLOORS' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 text-xs text-slate-400 bg-slate-950/40 border-b border-slate-800">
                Total campus floor units configured across all blocks.
              </div>
              <div className="divide-y divide-slate-800/60">
                {blocks.map((b) => (
                  <div key={b.id} className="p-4">
                    <div className="font-bold text-sm text-purple-400 mb-2">{b.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {b.floors && b.floors.length > 0 ? (
                        b.floors.map((fl) => (
                          <div
                            key={fl.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                          >
                            <span>Floor {fl.number}</span>
                            <span className="text-[10px] text-slate-400">({fl.rooms?.length ?? 0} rooms)</span>
                            <button
                              onClick={() => handleDeleteFloor(fl.id, fl.number)}
                              className="text-slate-400 hover:text-rose-400 ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">No floors configured in this block.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtab: ROOMS */}
          {infraSubTab === 'ROOMS' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Room No</th>
                    <th className="p-4">Floor / Block / Hostel</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">Current Occupants</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-black text-slate-200 text-sm">Room {r.room_no}</td>
                      <td className="p-4 text-slate-300">
                        Floor {r.floor?.number ?? '?'}, {r.floor?.block?.name ?? 'Block'} ({r.floor?.block?.hostel?.name ?? 'Hostel'})
                      </td>
                      <td className="p-4 text-slate-300">{r.capacity} Beds</td>
                      <td className="p-4 text-slate-300">
                        {r.allocations && r.allocations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {r.allocations.map((a) => (
                              <span
                                key={a.id}
                                className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]"
                              >
                                {a.student?.name || 'Student'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Vacant</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteRoom(r.id, r.room_no)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Subtab: ALLOCATIONS */}
          {infraSubTab === 'ALLOCATIONS' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Room</th>
                    <th className="p-4">Hostel / Location</th>
                    <th className="p-4">Allocated Since</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-200">{a.student?.name || 'Student'}</div>
                        <div className="text-[10px] text-slate-400">{a.student?.email}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">Room {a.room?.room_no}</td>
                      <td className="p-4 text-slate-300">
                        {a.room?.floor?.block?.hostel?.name}, {a.room?.floor?.block?.name} (Floor {a.room?.floor?.number})
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(a.from_date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRevokeAllocation(a.id)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS & ROLES */}
      {activeTab === 'USERS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search user by name, email, or phone..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Roles ({usersList.length})</option>
                <option value="STUDENT">Students</option>
                <option value="MAINTENANCE">Maintenance Staff</option>
                <option value="WARDEN">Wardens</option>
                <option value="SUPERADMIN">Super Admins</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Associated Entity</th>
                  <th className="p-4">Activity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === user?.id;
                  const roleColors: Record<string, string> = {
                    STUDENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    MAINTENANCE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    WARDEN: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    SUPERADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                  };

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-normal">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-4 text-slate-300">{u.phone || '—'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
                            roleColors[u.role] || 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {u.role === 'SUPERADMIN' ? 'Super Admin' : u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        {u.role === 'WARDEN' && u.hostelsWarded && u.hostelsWarded.length > 0 && (
                          <span className="text-blue-400">Hostel: {u.hostelsWarded[0].name}</span>
                        )}
                        {u.role === 'STUDENT' && u.roomAllocations && u.roomAllocations.length > 0 && (
                          <span className="text-emerald-400">Room {u.roomAllocations[0].room.room_no}</span>
                        )}
                        {u.role === 'MAINTENANCE' && u.teamMemberships && u.teamMemberships.length > 0 && (
                          <span className="text-amber-400">{u.teamMemberships[0].team.name}</span>
                        )}
                        {(!u.hostelsWarded || u.hostelsWarded.length === 0) &&
                          (!u.roomAllocations || u.roomAllocations.length === 0) &&
                          (!u.teamMemberships || u.teamMemberships.length === 0) && (
                            <span className="text-slate-500 italic">None assigned</span>
                          )}
                      </td>
                      <td className="p-4 text-slate-400">
                        {u._count ? (
                          <span>
                            {u._count.complaintsSubmitted} filed / {u._count.complaintsAssigned} assigned
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserForRoleChange(u);
                              setTargetRole(u.role);
                              setTargetHostelId(u.hostelsWarded?.[0]?.id || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
                          >
                            Change Role
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES & TEAMS */}
      {activeTab === 'CATEGORIES_TEAMS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* Categories Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-emerald-400" />
                  <span>Complaint Categories</span>
                </h3>
                <p className="text-xs text-slate-400">SLA targets and subcategory classification</p>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-extrabold text-sm text-white">{cat.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">SLA: {cat.default_sla_hours} hrs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddSubcategoryModal(cat.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                      >
                        + Subcategory
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories list */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      cat.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                        >
                          <span>{sub.name}</span>
                          <span className="text-[9px] font-bold text-amber-400">({sub.base_severity})</span>
                          <button
                            onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No subcategories defined</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Teams Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <span>Maintenance Teams & Workload</span>
                </h3>
                <p className="text-xs text-slate-400">Team staffing, leadership, and member allocation</p>
              </div>
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Team</span>
              </button>
            </div>

            <div className="space-y-3">
              {teams.map((t) => (
                <div key={t.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-extrabold text-sm text-white">{t.name}</span>
                      <div className="text-[11px] text-slate-400">
                        Team Lead:{' '}
                        {t.head ? (
                          <span className="text-purple-400 font-semibold">{t.head.name}</span>
                        ) : (
                          <span className="italic text-slate-500">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddTeamMemberModal(t.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                      >
                        + Add Member
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(t.id, t.name)}
                        className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Members list */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Team Members ({t.members?.length ?? 0})
                    </span>
                    {t.members && t.members.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {t.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-200">{m.user.name}</div>
                              <div className="text-[10px] text-slate-400">Load: {m.current_load} tasks</div>
                            </div>
                            <button
                              onClick={() => handleRemoveTeamMember(t.id, m.user_id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Remove from team"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic block">No staff members enrolled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ALL COMPLAINTS & REASSIGNMENT */}
      {activeTab === 'COMPLAINTS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search issues by title, student, or room..."
                  value={complaintSearch}
                  onChange={(e) => setComplaintSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="AI_PROCESSED">Automated Triage</option>
                <option value="NEEDS_REVIEW">Needs Review</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REOPENED">Reopened</option>
              </select>

              <select
                value={complaintCategoryFilter}
                onChange={(e) => setComplaintCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400 font-semibold">
              Showing {filteredComplaints.length} of {complaints.length} campus complaints
            </div>
          </div>

          {/* Complaints Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Incident Details</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned Worker / Staff</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-200 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>By {c.student?.name || 'Student'}</span>
                        <span>•</span>
                        <span>{new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div>Room {c.room.room_no}</div>
                      <div className="text-[10px] text-slate-500">{c.room.floor.block.hostel.name}</div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div>{c.category?.name || 'Category'}</div>
                      <div className="text-[10px] text-slate-500">{c.subcategory?.name}</div>
                    </td>
                    <td className="p-4">
                      <SeverityBadge severity={c.severity} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-4 text-slate-300">
                      {c.assignedUser ? (
                        <div>
                          <span className="font-semibold text-purple-400">{c.assignedUser.name}</span>
                          {c.assignedUser.phone && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{c.assignedUser.phone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openReassignModal(c)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-semibold transition-all border border-purple-500/30"
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: STRICT READ-ONLY AUDIT LOG */}
      {activeTab === 'AUDIT_LOG' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Security & Immutability Notice Banner */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-indigo-200">Immutable Audit Ledger</h4>
                <p className="text-xs text-indigo-300/80">
                  Every state transition, assignment, and action generates a non-repudiable audit event. Modifying or deleting audit entries is strictly prohibited.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Read-Only
            </span>
          </div>

          {/* Audit Search */}
          <div className="flex items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filter by action, actor, or note..."
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              Total Records: {auditTotal}
            </div>
          </div>

          {/* Audit Trail List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Target Complaint</th>
                  <th className="p-4">State Shift</th>
                  <th className="p-4">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-200">
                      {log.actor ? (
                        <div>
                          <div className="font-semibold">{log.actor.name}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{log.actor.role}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">System Engine</span>
                      )}
                    </td>
                    <td className="p-4 max-w-xs font-sans">
                      {log.complaint ? (
                        <div>
                          <div className="font-semibold text-slate-200 truncate">{log.complaint.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ID: {log.complaint.id.slice(0, 8)}... ({log.complaint.hostel?.name})
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic font-mono">{log.complaint_id?.slice(0, 8) || 'N/A'}</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300 whitespace-nowrap">
                      {log.from_status && log.to_status ? (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400">{log.from_status}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-emerald-400 font-bold">{log.to_status}</span>
                        </div>
                      ) : log.to_status ? (
                        <span className="text-emerald-400 font-bold text-[10px]">{log.to_status}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate font-sans">{log.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================================= */}

      {/* Modal: Add Hostel */}
      {showAddHostelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Create New Hostel</h3>
              <button onClick={() => setShowAddHostelModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hostel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Himalaya Residency"
                  value={newHostel.name}
                  onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hostel Type</label>
                <select
                  value={newHostel.type}
                  onChange={(e) => setNewHostel({ ...newHostel, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="BOYS">Boys Hostel</option>
                  <option value="GIRLS">Girls Hostel</option>
                  <option value="COED">Co-Ed Hostel</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHostelModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Hostel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Block */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Create New Block</h3>
              <button onClick={() => setShowAddBlockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Hostel</label>
                <select
                  required
                  value={newBlock.hostel_id}
                  onChange={(e) => setNewBlock({ ...newBlock, hostel_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Parent Hostel...</option>
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Block Name / Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block A / North Wing"
                  value={newBlock.name}
                  onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Floor */}
      {showAddFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Add Floor to Block</h3>
              <button onClick={() => setShowAddFloorModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFloor} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Block</label>
                <select
                  required
                  value={newFloor.block_id}
                  onChange={(e) => setNewFloor({ ...newFloor, block_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Target Block...</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Floor Number</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={20}
                  value={newFloor.number}
                  onChange={(e) => setNewFloor({ ...newFloor, number: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFloorModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Add Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Room */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Create New Room</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Floor</label>
                <select
                  required
                  value={newRoom.floor_id}
                  onChange={(e) => setNewRoom({ ...newRoom, floor_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Floor...</option>
                  {blocks.flatMap((b) =>
                    (b.floors || []).map((f) => (
                      <option key={f.id} value={f.id}>
                        {b.name} - Floor {f.number}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, 204B"
                  value={newRoom.room_no}
                  onChange={(e) => setNewRoom({ ...newRoom, room_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Capacity (Occupants)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Allocate Room */}
      {showAllocateRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Allocate Room to Student</h3>
              <button onClick={() => setShowAllocateRoomModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAllocateRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Student</label>
                <select
                  required
                  value={newAllocation.student_id}
                  onChange={(e) => setNewAllocation({ ...newAllocation, student_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Student...</option>
                  {usersList
                    .filter((u) => u.role === 'STUDENT')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Room</label>
                <select
                  required
                  value={newAllocation.room_id}
                  onChange={(e) => setNewAllocation({ ...newAllocation, room_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Room...</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_no} ({r.floor?.block?.hostel?.name}, {r.floor?.block?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateRoomModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Assign Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Provision User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Provision User Account</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@campus.edu"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="STUDENT">Student</option>
                  <option value="MAINTENANCE">Maintenance Staff</option>
                  <option value="WARDEN">Hostel Warden</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update User Role */}
      {selectedUserForRoleChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                Modify Role for {selectedUserForRoleChange.name}
              </h3>
              <button onClick={() => setSelectedUserForRoleChange(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">New Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="STUDENT">Student</option>
                  <option value="MAINTENANCE">Maintenance Staff</option>
                  <option value="WARDEN">Hostel Warden</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>

              {targetRole === 'WARDEN' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Assign Hostel Jurisdiction</label>
                  <select
                    value={targetHostelId}
                    onChange={(e) => setTargetHostelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Choose Hostel...</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRoleChange(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Create Incident Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical, Plumbing, HVAC"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Default SLA Target (Hours)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={newCategory.default_sla_hours}
                  onChange={(e) => setNewCategory({ ...newCategory, default_sla_hours: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Subcategory */}
      {showAddSubcategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Add Subcategory</h3>
              <button onClick={() => setShowAddSubcategoryModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubcategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Subcategory Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken Bulb, Water Leak, Switch Failure"
                  value={newSubcategory.name}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Base Severity</label>
                <select
                  value={newSubcategory.base_severity}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, base_severity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubcategoryModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Add Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Team */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Create Maintenance Team</h3>
              <button onClick={() => setShowAddTeamModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rapid Plumbing Response"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Team Head (Optional)</label>
                <select
                  value={newTeam.head_id}
                  onChange={(e) => setNewTeam({ ...newTeam, head_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">No head designated</option>
                  {usersList
                    .filter((u) => u.role === 'MAINTENANCE' || u.role === 'SUPERADMIN')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Team Member */}
      {showAddTeamMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Enroll Staff Member to Team</h3>
              <button onClick={() => setShowAddTeamMemberModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTeamMember} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Maintenance Staff</label>
                <select
                  required
                  value={selectedMemberUserId}
                  onChange={(e) => setSelectedMemberUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Choose Staff User...</option>
                  {usersList
                    .filter((u) => u.role === 'MAINTENANCE')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamMemberModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Enroll Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reassign Complaint */}
      {reassignModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Reassign / Dispatch Incident</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complaint #{reassignModalComplaint.id.slice(0, 8)} • Room {reassignModalComplaint.room?.room_no}
                </p>
              </div>
              <button onClick={() => setReassignModalComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              {/* Assignment Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setReassignForm({ ...reassignForm, assignmentMode: 'TECHNICIAN' })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    reassignForm.assignmentMode === 'TECHNICIAN'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Registered Technician
                </button>
                <button
                  type="button"
                  onClick={() => setReassignForm({ ...reassignForm, assignmentMode: 'WORKER_DETAILS' })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    reassignForm.assignmentMode === 'WORKER_DETAILS'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fill Worker Details
                </button>
              </div>

              {/* Mode 1: Registered Technician */}
              {reassignForm.assignmentMode === 'TECHNICIAN' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Select Technician</label>
                    <select
                      value={reassignForm.assigned_to}
                      onChange={(e) => setReassignForm({ ...reassignForm, assigned_to: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Unassigned</option>
                      {maintenanceCandidates.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.phone || m.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Team</label>
                    <select
                      value={reassignForm.team_id}
                      onChange={(e) => setReassignForm({ ...reassignForm, team_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">General Dispatch</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Mode 2: Fill Worker Details */}
              {reassignForm.assignmentMode === 'WORKER_DETAILS' && (
                <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Worker Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={reassignForm.worker.name}
                        onChange={(e) =>
                          setReassignForm({
                            ...reassignForm,
                            worker: { ...reassignForm.worker, name: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Plumbing Services"
                        value={reassignForm.worker.department}
                        onChange={(e) =>
                          setReassignForm({
                            ...reassignForm,
                            worker: { ...reassignForm.worker, department: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={reassignForm.worker.phone}
                        onChange={(e) =>
                          setReassignForm({
                            ...reassignForm,
                            worker: { ...reassignForm.worker, phone: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Worker Email</label>
                      <input
                        type="email"
                        placeholder="worker@campus.com"
                        value={reassignForm.worker.email}
                        onChange={(e) =>
                          setReassignForm({
                            ...reassignForm,
                            worker: { ...reassignForm.worker, email: e.target.value },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Priority / Severity */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Severity & Priority Level</label>
                <select
                  value={reassignForm.severity}
                  onChange={(e) => setReassignForm({ ...reassignForm, severity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical (Immediate Dispatch)</option>
                </select>
              </div>

              {/* Super Admin Audit Note */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Admin Audit Note</label>
                <textarea
                  rows={2}
                  placeholder="Reason for reassignment or dispatch details..."
                  value={reassignForm.note}
                  onChange={(e) => setReassignForm({ ...reassignForm, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReassignModalComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPortal;
