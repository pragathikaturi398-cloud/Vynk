import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../api/client';
import { Complaint, ComplaintStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Upload,
  Camera,
  ExternalLink,
  Filter,
  Layers,
  Search,
  Phone,
  MapPin,
  Star,
  RotateCcw,
  Check,
  Zap,
  Droplets,
  Trash2,
  Wifi,
  Utensils,
  Shield,
  Building,
  Flame,
  UserCheck,
  UserPlus,
  Sparkles,
  Mail,
} from 'lucide-react';

type StatusTab = 'ALL' | 'ACTIVE' | 'IN_PROGRESS' | 'CLOSED';
type ViewMode = 'GROUPED' | 'LIST';

export const MaintenanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & display modes
  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('GROUPED');
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'my' | 'all'>('all');

  // Resolution modal state
  const [resolvingTask, setResolvingTask] = useState<Complaint | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Assign Worker modal state
  const [assigningTask, setAssigningTask] = useState<Complaint | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [workerDept, setWorkerDept] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [knownWorkers, setKnownWorkers] = useState<
    Array<{ id: string; name: string; phone?: string; email: string; department: string }>
  >([]);
  const [autoCategorizingId, setAutoCategorizingId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const endpoint = scope === 'all' ? '/complaints?scope=all' : '/complaints';
      const res: any = await api.get(endpoint);
      if (res?.success) {
        setTasks(res.data);
      }
    } catch (e) {
      console.warn('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user, scope]);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchTasks();
    };

    socket.on('complaint:created', handleRefresh);
    socket.on('complaint:updated', handleRefresh);
    socket.on('complaint:assigned', handleRefresh);

    return () => {
      socket.off('complaint:created', handleRefresh);
      socket.off('complaint:updated', handleRefresh);
      socket.off('complaint:assigned', handleRefresh);
    };
  }, [socket, scope]);

  const updateTaskStatus = async (complaintId: string, status: ComplaintStatus, note?: string) => {
    try {
      await api.patch(`/complaints/${complaintId}/status`, { status, note });
      await fetchTasks();
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTask) return;
    setSubmittingResolution(true);
    try {
      await api.patch(`/complaints/${resolvingTask.id}/status`, {
        status: 'RESOLVED',
        note: `Resolved by ${user?.name}. Note: ${resolutionNote || 'Work verified and completed on site.'}`,
      });
      setResolvingTask(null);
      setResolutionNote('');
      setProofFile(null);
      await fetchTasks();
    } catch (err: any) {
      alert(err?.message || 'Failed to resolve task.');
    } finally {
      setSubmittingResolution(false);
    }
  };

  useEffect(() => {
    const loadKnownWorkers = async () => {
      try {
        const res: any = await api.get('/teams');
        if (res?.success && res.data) {
          const list: Array<{ id: string; name: string; phone?: string; email: string; department: string }> = [];
          res.data.forEach((team: any) => {
            const dept = team.name.replace(' Maintenance Team', '').replace(' Team', '');
            if (team.members) {
              team.members.forEach((m: any) => {
                if (m.user && !list.some((w) => w.email === m.user.email)) {
                  list.push({
                    id: m.user.id,
                    name: m.user.name,
                    phone: m.user.phone,
                    email: m.user.email,
                    department: dept,
                  });
                }
              });
            }
          });
          setKnownWorkers(list);
        }
      } catch (e) {
        console.warn('Could not load teams/workers');
      }
    };
    loadKnownWorkers();
  }, []);

  const openAssignModal = (task: Complaint) => {
    setAssigningTask(task);
    if (task.assignedUser) {
      setWorkerName(task.assignedUser.name || '');
      setWorkerPhone(task.assignedUser.phone || '');
      setWorkerEmail(task.assignedUser.email || '');
      setWorkerDept(task.assignedTeam?.name?.replace(' Maintenance Team', '') || task.category.name);
    } else {
      setWorkerName('');
      setWorkerPhone('');
      setWorkerEmail('');
      setWorkerDept(task.category.name);
    }
    setAssignNote('');
  };

  const handleSelectKnownWorker = (workerId: string) => {
    const selected = knownWorkers.find((w) => w.id === workerId);
    if (selected) {
      setWorkerName(selected.name);
      setWorkerPhone(selected.phone || '');
      setWorkerEmail(selected.email);
      setWorkerDept(selected.department);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask) return;
    if (!workerName.trim() || !workerEmail.trim()) {
      alert('Please provide worker name and email.');
      return;
    }
    setSubmittingAssign(true);
    try {
      await api.patch(`/complaints/${assigningTask.id}/assign`, {
        worker: {
          name: workerName.trim(),
          department: workerDept.trim() || assigningTask.category.name,
          phone: workerPhone.trim(),
          email: workerEmail.trim(),
        },
        note: assignNote.trim() || `Assigned to worker ${workerName} (${workerPhone || 'Contact on file'})`,
      });
      setAssigningTask(null);
      await fetchTasks();
    } catch (err: any) {
      alert(err?.message || 'Failed to assign worker.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleAutoCategorize = async (complaintId: string) => {
    setAutoCategorizingId(complaintId);
    try {
      const res: any = await api.post(`/complaints/${complaintId}/auto-category`);
      if (res?.success) {
        await fetchTasks();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to auto-categorize problem.');
    } finally {
      setAutoCategorizingId(null);
    }
  };

  // Status counts
  const activeCount = tasks.filter((t) => t.status === 'ASSIGNED').length;
  const inProgressCount = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'ON_HOLD' || t.status === 'REOPENED'
  ).length;
  const closedCount = tasks.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;

  // Extract unique categories from tasks
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    tasks.forEach((t) => {
      const name = t.category.name;
      const existing = map.get(name);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(name, { id: t.category.id, name, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [tasks]);

  // Filter tasks based on Status Tab, Category, and Search
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Status filtering
        if (statusTab === 'ACTIVE') {
          if (t.status !== 'ASSIGNED') return false;
        } else if (statusTab === 'IN_PROGRESS') {
          if (t.status !== 'IN_PROGRESS' && t.status !== 'ON_HOLD' && t.status !== 'REOPENED')
            return false;
        } else if (statusTab === 'CLOSED') {
          if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
        }

        // Category filtering
        if (selectedCategory !== 'ALL' && t.category.name !== selectedCategory) {
          return false;
        }

        // Search query filtering
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchRoom = t.room.room_no.toLowerCase().includes(q);
          const matchStudent = t.student?.name.toLowerCase().includes(q);
          const matchCategory = t.category.name.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchRoom && !matchStudent && !matchCategory)
            return false;
        }

        return true;
      })
      // Strictly sort by priority_score descending (Priority First)
      .sort((a, b) => b.priority_score - a.priority_score);
  }, [tasks, statusTab, selectedCategory, searchQuery]);

  // Group filtered tasks by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Complaint[]> = {};
    filteredTasks.forEach((t) => {
      const cat = t.category.name;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return groups;
  }, [filteredTasks]);

  const getCategoryIcon = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('plumb') || lower.includes('water'))
      return <Droplets className="w-4 h-4 text-cyan-400" />;
    if (lower.includes('electr') || lower.includes('power'))
      return <Zap className="w-4 h-4 text-amber-400" />;
    if (lower.includes('sanitat') || lower.includes('clean'))
      return <Trash2 className="w-4 h-4 text-emerald-400" />;
    if (lower.includes('carpent') || lower.includes('furniture'))
      return <Wrench className="w-4 h-4 text-orange-400" />;
    if (lower.includes('internet') || lower.includes('wi-fi'))
      return <Wifi className="w-4 h-4 text-indigo-400" />;
    if (lower.includes('food') || lower.includes('mess'))
      return <Utensils className="w-4 h-4 text-rose-400" />;
    if (lower.includes('security')) return <Shield className="w-4 h-4 text-purple-400" />;
    return <Building className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Maintenance Operations Portal
            </span>
            <span className="text-xs text-slate-400">{user?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workload & Priority Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Issues organized by category, ranked by priority score, and differentiated by operational status.
          </p>
        </div>

        {/* Scope Toggle: My Assigned vs All Campus */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setScope('my')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                scope === 'my'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Work Orders
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                scope === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Campus Issues
            </button>
          </div>
        </div>

        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusTab('ALL')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            statusTab === 'ALL'
              ? 'bg-slate-800/90 border-slate-600 ring-2 ring-slate-500/20 shadow-xl'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Work Orders</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{tasks.length}</div>
          <span className="text-[11px] text-slate-500">All recorded tickets</span>
        </button>

        <button
          onClick={() => setStatusTab('ACTIVE')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            statusTab === 'ACTIVE'
              ? 'bg-cyan-950/40 border-cyan-500/60 ring-2 ring-cyan-500/20 shadow-xl'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-300">Active / Assigned</span>
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">{activeCount}</div>
          <span className="text-[11px] text-cyan-300/70">Ready for technician start</span>
        </button>

        <button
          onClick={() => setStatusTab('IN_PROGRESS')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            statusTab === 'IN_PROGRESS'
              ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/20 shadow-xl'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">In Progress / Paused</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{inProgressCount}</div>
          <span className="text-[11px] text-amber-300/70">Repairs actively underway</span>
        </button>

        <button
          onClick={() => setStatusTab('CLOSED')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            statusTab === 'CLOSED'
              ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xl'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300">Closed & Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{closedCount}</div>
          <span className="text-[11px] text-emerald-300/70">Fixed and verified</span>
        </button>
      </div>

      {/* Control Bar: Status Tabs, Category Filter & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Selection Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                statusTab === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Statuses ({tasks.length})
            </button>
            <button
              onClick={() => setStatusTab('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                statusTab === 'ACTIVE'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusTab('IN_PROGRESS')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                statusTab === 'IN_PROGRESS'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusTab('CLOSED')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                statusTab === 'CLOSED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Closed ({closedCount})
            </button>
          </div>

          {/* View Mode Toggle: Grouped by Category vs Flat List */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Layout:</span>
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('GROUPED')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'GROUPED'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'LIST'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Priority List
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar & Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Categories ({filteredTasks.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {getCategoryIcon(cat.name)}
                <span>{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, room, student..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center p-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-400 text-sm">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-70" />
          <h3 className="text-base font-bold text-white">No maintenance issues match your filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try switching the status tab or clearing category filters.
          </p>
        </div>
      ) : viewMode === 'GROUPED' ? (
        /* ================= GROUPED BY CATEGORY VIEW ================= */
        <div className="space-y-8">
          {Object.entries(groupedByCategory).map(([catName, items]) => {
            const criticalCount = items.filter((i) => i.severity === 'CRITICAL').length;

            return (
              <div
                key={catName}
                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4"
              >
                {/* Category Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                      {getCategoryIcon(catName)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                        <span>{catName}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {items.length} issue{items.length !== 1 ? 's' : ''}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Ranked by priority score • Highest urgency first
                      </p>
                    </div>
                  </div>

                  {criticalCount > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold animate-pulse">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>{criticalCount} Critical Priority Issue{criticalCount > 1 ? 's' : ''}</span>
                    </span>
                  )}
                </div>

                {/* Cards Grid inside this category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStatus={updateTaskStatus}
                      onOpenResolve={() => setResolvingTask(task)}
                      onOpenAssign={openAssignModal}
                      onAutoCategorize={handleAutoCategorize}
                      isAutoCategorizing={autoCategorizingId === task.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= FLAT PRIORITY LIST VIEW ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>All Issues Sorted by Priority Score</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredTasks.length} issues
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdateStatus={updateTaskStatus}
                onOpenResolve={() => setResolvingTask(task)}
                onOpenAssign={openAssignModal}
                onAutoCategorize={handleAutoCategorize}
                isAutoCategorizing={autoCategorizingId === task.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolution Proof & Notes Modal */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Complete & Resolve Issue
              </h3>
              <button
                onClick={() => setResolvingTask(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-4">
              Enter the repair notes and confirm work completion for student review:
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution Summary & Action Taken
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Replaced faulty switchboard breaker and tested voltage. Tap gasket replaced with ceramic disc."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proof Photo (Optional)
                </label>
                <div className="border border-dashed border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:border-slate-600 bg-slate-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolvingTask(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResolution}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submittingResolution ? 'Submitting...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Worker Details Modal */}
      {assigningTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Assign Worker to Issue</h3>
                  <p className="text-xs text-slate-400">
                    Fill technician details to dispatch and notify student
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningTask(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Target Issue Context */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="font-mono text-cyan-400">#{assigningTask.id.slice(0, 8)}</span>
                <span>{assigningTask.title}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Location: {assigningTask.room.floor.block.hostel.name} • Block {assigningTask.room.floor.block.name} • Room {assigningTask.room.room_no}
              </div>
            </div>

            {/* Quick Picker for Known Technicians */}
            {knownWorkers.length > 0 && (
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Quick Select Existing Technician (Auto-fills details):
                </label>
                <select
                  onChange={(e) => handleSelectKnownWorker(e.target.value)}
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="" disabled>-- Choose a registered technician or enter details below --</option>
                  {knownWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.department} • {w.phone || 'No phone'} • {w.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Worker Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department / Trade *
                  </label>
                  <input
                    required
                    type="text"
                    value={workerDept}
                    onChange={(e) => setWorkerDept(e.target.value)}
                    placeholder="e.g. Plumbing, Electrical, HVAC"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Department Suggestions Quick Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Suggestions:</span>
                {['Plumbing', 'Electrical', 'HVAC & AC', 'Carpentry', 'Sanitation', 'Appliances'].map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setWorkerDept(dept)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    {dept}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Contact Number (Phone) *</span>
                    <span className="text-[10px] text-emerald-400">Shown to student</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={workerPhone}
                    onChange={(e) => setWorkerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 00010"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Worker Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={workerEmail}
                    onChange={(e) => setWorkerEmail(e.target.value)}
                    placeholder="e.g. worker@vynk.local"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assignment Instructions / Work Order Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="e.g. Urgent repair. Carry spare pipe seals and pressure valve."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningTask(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-600/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{submittingAssign ? 'Assigning...' : 'Confirm & Dispatch Worker'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * TaskCard Component that visually renders Active, In-Progress, and Closed issues differently
 */
interface TaskCardProps {
  task: Complaint;
  onUpdateStatus: (id: string, status: ComplaintStatus, note?: string) => void;
  onOpenResolve: () => void;
  onOpenAssign: (task: Complaint) => void;
  onAutoCategorize: (id: string) => void;
  isAutoCategorizing: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdateStatus,
  onOpenResolve,
  onOpenAssign,
  onAutoCategorize,
  isAutoCategorizing,
}) => {
  const isActive = task.status === 'ASSIGNED';
  const isInProgress =
    task.status === 'IN_PROGRESS' || task.status === 'ON_HOLD' || task.status === 'REOPENED';
  const isClosed = task.status === 'RESOLVED' || task.status === 'CLOSED';

  // Card border & background according to status
  const cardStyle = isActive
    ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 via-slate-900 to-slate-900 shadow-cyan-950/20'
    : isInProgress
    ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/25 via-slate-900 to-slate-900 shadow-amber-950/20'
    : 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/15 via-slate-900 to-slate-900 shadow-emerald-950/20';

  const hasFeedback = task.feedbacks && task.feedbacks.length > 0;

  return (
    <div
      className={`border rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01] ${cardStyle}`}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-500">#{task.id.slice(0, 8)}</span>
            <StatusBadge status={task.status} />
            <SeverityBadge severity={task.severity} />

            {/* Prominent Priority Score Badge */}
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                task.priority_score >= 10
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : task.priority_score >= 6
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Priority: {task.priority_score.toFixed(1)}
            </span>
          </div>

          <Link
            to={`/complaints/${task.id}`}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Title & Description */}
        <h4 className="text-base font-bold text-white">{task.title}</h4>
        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
          {task.ai_summary || task.description}
        </p>

        {/* Location & Contact Box */}
        <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span>
              <strong>{task.room.floor.block.hostel.name}</strong> • Block{' '}
              <strong>{task.room.floor.block.name}</strong> • Room <strong>{task.room.room_no}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Student: <strong className="text-white">{task.student?.name}</strong></span>
            {task.student?.phone && (
              <span className="font-mono text-slate-300">{task.student.phone}</span>
            )}
          </div>

          {/* Assigned Worker Contact Row */}
          {task.assignedUser ? (
            <div className="flex items-center justify-between text-slate-300 text-[11px] pt-1.5 border-t border-slate-800/60">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Worker: <strong className="text-white">{task.assignedUser.name}</strong></span>
              </span>
              {task.assignedUser.phone ? (
                <a
                  href={`tel:${task.assignedUser.phone}`}
                  className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{task.assignedUser.phone}</span>
                </a>
              ) : (
                <span className="text-slate-500 italic">No phone on file</span>
              )}
            </div>
          ) : !isClosed ? (
            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1.5 border-t border-slate-800/60">
              <span className="italic text-amber-400/90 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>No technician assigned yet</span>
              </span>
              <button
                type="button"
                onClick={() => onOpenAssign(task)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline"
              >
                Assign Worker
              </button>
            </div>
          ) : null}

          {task.sla_due_at && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Target Resolution:
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {new Date(task.sla_due_at).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Closed/Resolved specifics: feedback & resolution note */}
        {isClosed && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Job Completed</span>
              </span>
              {hasFeedback && (
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-bold text-[11px]">{task.feedbacks?.[0]?.rating} / 5</span>
                </div>
              )}
            </div>

            {hasFeedback && task.feedbacks?.[0]?.comment && (
              <p className="text-[11px] italic text-slate-300 truncate">
                "{task.feedbacks[0].comment}"
              </p>
            )}
          </div>
        )}

        {/* Reopened Alert */}
        {task.status === 'REOPENED' && (
          <div className="mt-3 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-1.5 font-bold">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reopened by Student — Immediate Inspection Required</span>
          </div>
        )}
      </div>

      {/* Action Footer Differentiated by Status */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400">
            Category: <strong className="text-white">{task.category.name}</strong>
          </span>

          {/* Auto-Categorize Wand Button */}
          {!isClosed && (
            <button
              type="button"
              onClick={() => onAutoCategorize(task.id)}
              disabled={isAutoCategorizing}
              title="Auto-detect or create category related to problem"
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700 transition-colors"
            >
              <Sparkles className={`w-3 h-3 ${isAutoCategorizing ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
              <span>{isAutoCategorizing ? 'Categorizing...' : 'Auto-Category'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* ASSIGN / REASSIGN WORKER BUTTON - Hidden when closed */}
          {!isClosed && (
            <button
              type="button"
              onClick={() => onOpenAssign(task)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>{task.assignedUser ? 'Reassign' : 'Assign Worker'}</span>
            </button>
          )}

          {/* ACTIVE TASK ACTION: Start Work */}
          {isActive && (
            <button
              onClick={() =>
                onUpdateStatus(task.id, 'IN_PROGRESS', 'Technician started investigation on site.')
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md shadow-cyan-600/30"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Work</span>
            </button>
          )}

          {/* IN PROGRESS TASK ACTIONS: Hold or Resolve */}
          {isInProgress && (
            <div className="flex items-center gap-2">
              {task.status !== 'ON_HOLD' ? (
                <button
                  onClick={() =>
                    onUpdateStatus(task.id, 'ON_HOLD', 'Waiting for spare parts / supplies.')
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <Pause className="w-3 h-3" />
                  <span>Hold</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    onUpdateStatus(task.id, 'IN_PROGRESS', 'Parts arrived. Resumed work.')
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={onOpenResolve}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Resolved</span>
              </button>
            </div>
          )}

          {/* CLOSED TASK DISPLAY */}
          {isClosed && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolution Verified</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
