import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
} from 'lucide-react';

export const MaintenanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal state
  const [resolvingTask, setResolvingTask] = useState<Complaint | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fetchTasks = async () => {
    try {
      const res: any = await api.get('/complaints');
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
  }, [user]);

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
        note: `Resolved by ${user?.name}. Note: ${resolutionNote || 'Work verified and completed.'}`,
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

  const assignedTasks = tasks.filter((t) => t.status === 'ASSIGNED');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const resolvedTasks = tasks.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Maintenance Staff Portal
            </span>
            <span className="text-xs text-slate-400">{user?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workload & Tasks Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Pick up assigned repairs, update operational status, upload completion proof, and satisfy SLAs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
            <div className="text-xs text-slate-400">Current Load</div>
            <div className="text-xl font-bold text-amber-400">
              {assignedTasks.length + inProgressTasks.length} active
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Assigned / Pending</span>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1">{assignedTasks.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">In Progress</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{inProgressTasks.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Completed / Resolved</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{resolvedTasks.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tasks Queue */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Active Task Queue</span>
        </h2>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-sm">
            No maintenance tasks assigned. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">#{task.id.slice(0, 8)}</span>
                      <StatusBadge status={task.status} />
                      <SeverityBadge severity={task.severity} />
                    </div>
                    <Link
                      to={`/complaints/${task.id}`}
                      className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                    >
                      <span>Full View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <h3 className="text-base font-bold text-white">{task.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {task.ai_summary || task.description}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div>
                      <strong className="text-slate-400">Location:</strong> {task.room.floor.block.hostel.name} • Block {task.room.floor.block.name} • Room {task.room.room_no}
                    </div>
                    <div>
                      <strong className="text-slate-400">Student:</strong> {task.student?.name} {task.student?.phone && `(${task.student.phone})`}
                    </div>
                    {task.sla_due_at && (
                      <div className="text-emerald-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>SLA Target: {new Date(task.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Maintenance Quick Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  {task.status === 'ASSIGNED' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS', 'Technician started investigation on site.')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Work
                    </button>
                  )}

                  {task.status === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => updateTaskStatus(task.id, 'ON_HOLD', 'Waiting for spare parts / supplies.')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Hold
                      </button>

                      <button
                        onClick={() => setResolvingTask(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Resolved
                      </button>
                    </>
                  )}

                  {task.status === 'ON_HOLD' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS', 'Parts arrived. Resumed work.')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Resume
                    </button>
                  )}

                  {(task.status === 'RESOLVED' || task.status === 'CLOSED') && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Complete & Resolve Task
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter resolution summary and upload proof of work for student confirmation:
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g., Replaced washer and tightened pipe union. No further water leakage."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proof Photo (Optional)
                </label>
                <div className="border border-dashed border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:border-slate-600">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {submittingResolution ? 'Submitting...' : 'Confirm Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
