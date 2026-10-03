import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Complaint, ComplaintStatus, Severity } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Wrench,
  Edit3,
  ExternalLink,
  ChevronDown,
  X,
  CheckCircle,
} from 'lucide-react';

export const ComplaintsTablePage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedHostel, setSelectedHostel] = useState('');

  // Dropdown lists
  const [hostels, setHostels] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Assign/Override Modal
  const [activeModalComplaint, setActiveModalComplaint] = useState<Complaint | null>(null);
  const [modalTeamId, setModalTeamId] = useState('');
  const [modalUserId, setModalUserId] = useState('');
  const [modalSeverity, setModalSeverity] = useState<Severity>('MEDIUM');
  const [modalNote, setModalNote] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedHostel) params.append('hostel', selectedHostel);

      const res: any = await api.get(`/complaints?${params.toString()}`);
      if (res?.success) {
        setComplaints(res.data);
      }
    } catch (e) {
      console.warn('Failed to load complaints table');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [hRes, tRes]: any[] = await Promise.all([
        api.get('/hostels'),
        api.get('/teams'),
      ]);
      if (hRes?.success) setHostels(hRes.data);
      if (tRes?.success) setTeams(tRes.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, selectedHostel]);

  const openAssignModal = (complaint: Complaint) => {
    setActiveModalComplaint(complaint);
    setModalTeamId(complaint.assigned_team_id || '');
    setModalUserId(complaint.assigned_to || '');
    setModalSeverity(complaint.severity);
    setModalNote('');
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalComplaint) return;
    setSubmittingAssign(true);
    try {
      await api.patch(`/complaints/${activeModalComplaint.id}/assign`, {
        team_id: modalTeamId || undefined,
        assigned_to: modalUserId || undefined,
        severity: modalSeverity,
        note: modalNote || 'Manually updated by Admin/Warden',
      });
      setActiveModalComplaint(null);
      await fetchComplaints();
    } catch (err: any) {
      alert(err?.message || 'Failed to update assignment');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const selectedTeamMembers =
    teams.find((t) => t.id === modalTeamId)?.members || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Complaint Directory</h1>
          <p className="text-xs text-slate-400">Search, filter, assign, and override complaints across all hostels.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, room, or AI summary..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="AI_PROCESSED">AI Triaged</option>
          <option value="NEEDS_REVIEW">Needs Review</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Hostel Filter */}
        <select
          value={selectedHostel}
          onChange={(e) => setSelectedHostel(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Hostels</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        {(searchQuery || selectedStatus || selectedHostel) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatus('');
              setSelectedHostel('');
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No complaints match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">#{c.id.slice(0, 6)}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{c.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {c.ai_summary || c.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{c.room.floor.block.hostel.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Block {c.room.floor.block.name} • Room {c.room.room_no}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{c.category.name}</div>
                      <div className="text-[10px] text-slate-500">{c.subcategory.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={c.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.assignedUser?.name || c.assignedTeam?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAssignModal(c)}
                          title="Assign or Override"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/complaints/${c.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Reassign & Severity Override Modal */}
      {activeModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                Assign & Override Complaint #{activeModalComplaint.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setActiveModalComplaint(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assign Maintenance Team
                </label>
                <select
                  value={modalTeamId}
                  onChange={(e) => {
                    setModalTeamId(e.target.value);
                    setModalUserId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTeamMembers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assign Specific Technician
                  </label>
                  <select
                    value={modalUserId}
                    onChange={(e) => setModalUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Team Pool (Auto / Unassigned)</option>
                    {selectedTeamMembers.map((m: any) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name} (Load: {m.current_load})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Override Severity
                </label>
                <select
                  value={modalSeverity}
                  onChange={(e) => setModalSeverity(e.target.value as Severity)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="LOW">Low (5 Days SLA)</option>
                  <option value="MEDIUM">Medium (48 Hours SLA)</option>
                  <option value="HIGH">High (24 Hours SLA)</option>
                  <option value="CRITICAL">Critical (4 Hours SLA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Audit Note
                </label>
                <textarea
                  rows={2}
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Reason for manual reassignment or priority adjustment..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModalComplaint(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submittingAssign ? 'Updating...' : 'Save & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
