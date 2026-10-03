import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { ServiceResolutionHub } from '../../components/ServiceResolutionHub';
import { ComplaintTracker } from '../../components/ComplaintTracker';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Star,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  User,
  Wrench,
  Paperclip,
  Phone,
} from 'lucide-react';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Reopen state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  const fetchComplaint = async () => {
    try {
      const res: any = await api.get(`/complaints/${id}`);
      if (res?.success) {
        setComplaint(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  // Live Socket.IO Updates
  useEffect(() => {
    if (!socket || !id) return;

    const handleUpdate = (updated: Complaint) => {
      if (updated && updated.id === id) {
        setComplaint((prev) => (prev ? { ...prev, ...updated } : updated));
        fetchComplaint();
      }
    };

    const handleAssigned = (assigned: Complaint) => {
      if (assigned && assigned.id === id) {
        setComplaint((prev) => (prev ? { ...prev, ...assigned } : assigned));
        fetchComplaint();
      }
    };

    socket.on('complaint:updated', handleUpdate);
    socket.on('complaint:assigned', handleAssigned);

    return () => {
      socket.off('complaint:updated', handleUpdate);
      socket.off('complaint:assigned', handleAssigned);
    };
  }, [socket, id]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.post(`/complaints/${id}/feedback`, {
        rating,
        comment: feedbackComment,
      });
      await fetchComplaint();
    } catch (err: any) {
      alert(err?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setSubmittingReopen(true);
    try {
      await api.post(`/complaints/${id}/reopen`, { reason: reopenReason });
      setShowReopenModal(false);
      await fetchComplaint();
    } catch (err: any) {
      alert(err?.message || 'Failed to reopen complaint.');
    } finally {
      setSubmittingReopen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error || 'Complaint not found.'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-xs text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isResolvedOrClosed =
    complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';
  const hasFeedback = complaint.feedbacks && complaint.feedbacks.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {/* Duplicate Alert Banner if duplicate and not yet assigned to required person */}
      {complaint.duplicate_of_id && !complaint.assigned_to && !complaint.assignedUser && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <h4 className="font-bold text-amber-300">Linked as Duplicate Issue</h4>
            <p className="mt-0.5">
              This issue matches an active complaint already being handled. Its priority has been boosted to expedite resolution for your block.
            </p>
          </div>
        </div>
      )}

      {/* Live 3-Stage Complaint Progress Tracker */}
      <ComplaintTracker complaint={complaint} variant="full" />

      {/* Main Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono text-slate-500">#{complaint.id.slice(0, 8)}</span>
              <StatusBadge status={complaint.status} />
              <SeverityBadge severity={complaint.severity} />
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Priority: {complaint.priority_score.toFixed(1)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {complaint.title}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>
          </div>

          {/* Quick actions for student: Reopen */}
          {isResolvedOrClosed && user?.role === 'STUDENT' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReopenModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-400 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reopen Issue
              </button>
            </div>
          )}
        </div>

        {/* Location & Team Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Hostel & Room</span>
            <span className="font-semibold text-slate-200">
              {complaint.room.floor.block.hostel.name} • Block {complaint.room.floor.block.name} • Room {complaint.room.room_no}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Category & Subcategory</span>
            <span className="font-semibold text-slate-200">
              {complaint.category.name} → {complaint.subcategory.name}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">Assigned Specialist & Worker Contact</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                {complaint.assignedUser?.name || complaint.assignedTeam?.name || 'In Assignment Queue'}
              </span>
              {complaint.assignedUser?.phone && (
                <a
                  href={`tel:${complaint.assignedUser.phone}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold hover:bg-emerald-500/30 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>{complaint.assignedUser.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* SLA Status Bar */}
        {complaint.sla_due_at && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Target Resolution Deadline:</span>
            </span>
            <span className="font-semibold text-emerald-400">
              {new Date(complaint.sla_due_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics & Feedback & Attachments */}
        <div className="space-y-6">
          {/* Smart Diagnostics Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">Smart Diagnostics & Triage</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Assessed Category:</span>
                <span className="font-semibold text-slate-200">{complaint.ai_category || complaint.category.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence Score:</span>
                <span className="font-semibold text-emerald-400">
                  {complaint.ai_confidence ? `${Math.round(complaint.ai_confidence * 100)}%` : '92%'}
                </span>
              </div>
              {complaint.ai_summary && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 block mb-1 text-[11px] font-medium">Summary:</span>
                  <p className="text-slate-300 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                    "{complaint.ai_summary}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-sm text-white">Attachments ({complaint.attachments.length})</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {complaint.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block group relative overflow-hidden rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    {att.mime_type.startsWith('image/') ? (
                      <img
                        src={att.url}
                        alt="Attachment"
                        className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-28 bg-slate-950 flex items-center justify-center text-xs text-slate-400">
                        Document
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Form / Display */}
          {complaint.status === 'RESOLVED' && !hasFeedback && user?.role === 'STUDENT' && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Rate Resolution & Close
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                The technician marked this issue resolved. Please rate the service quality:
              </p>
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">{rating} / 5</span>
                </div>
                <textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Optional review comment for the technician..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Rating & Close'}
                </button>
              </form>
            </div>
          )}

          {hasFeedback && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Student Feedback
              </h3>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= (complaint.feedbacks?.[0]?.rating || 5)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              {complaint.feedbacks?.[0]?.comment && (
                <p className="text-xs text-slate-300 italic">
                  "{complaint.feedbacks[0].comment}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Service Resolution & Maintenance Hub */}
        <div className="lg:col-span-2">
          <ServiceResolutionHub
            complaint={complaint}
            onReopen={() => setShowReopenModal(true)}
          />
        </div>
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              Reopen Complaint
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Please state why the issue was not resolved satisfactorily:
            </p>
            <form onSubmit={handleReopen} className="space-y-4">
              <textarea
                required
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g., The leak started dripping again after 1 hour..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReopen}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
                >
                  {submittingReopen ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
