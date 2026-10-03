import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { NewComplaintModal } from './NewComplaintModal';
import { Link } from 'react-router-dom';
import {
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Home,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const fetchMyComplaints = async () => {
    try {
      const res: any = await api.get('/complaints');
      if (res?.success) {
        setComplaints(res.data);
      }
    } catch (e) {
      console.warn('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, [user]);

  const activeCount = complaints.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CLOSED'
  ).length;

  const filteredComplaints = complaints.filter((c) => {
    if (filterTab === 'ACTIVE') return c.status !== 'RESOLVED' && c.status !== 'CLOSED';
    if (filterTab === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'CLOSED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Student Portal
            </span>
            <span className="text-xs text-slate-400">
              {user?.room
                ? `${user.room.hostelName} • ${user.room.blockName} • Room ${user.room.roomNo}`
                : 'No allocated room'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hello, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Report maintenance issues with automated AI triage, real-time tracking, and instant escalation.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Report New Issue</span>
        </button>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Reported</span>
            <div className="text-2xl font-extrabold text-white mt-1">{complaints.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Active / In Progress</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Resolved & Closed</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{resolvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterTab === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Complaints ({complaints.length})
          </button>
          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterTab === 'ACTIVE'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterTab('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterTab === 'RESOLVED'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No complaints found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Everything is running smoothly! If you face any issues with room maintenance, submit a report above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((c) => (
            <Link
              key={c.id}
              to={`/complaints/${c.id}`}
              className="block bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all group"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">#{c.id.slice(0, 8)}</span>
                  <StatusBadge status={c.status} />
                  <SeverityBadge severity={c.severity} />
                  {c.duplicate_of_id && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Duplicate Grouped
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                {c.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                {c.ai_summary || c.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>Category: <strong className="text-slate-200">{c.category.name}</strong></span>
                  <span>Room: <strong className="text-slate-200">{c.room.room_no}</strong></span>
                </div>

                {c.sla_due_at && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      Due: {new Date(c.sla_due_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      <NewComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchMyComplaints()}
      />
    </div>
  );
};
