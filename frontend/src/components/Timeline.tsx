import React from 'react';
import { Complaint, ComplaintEvent, ComplaintStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  User,
  FileText,
  Wrench,
  Check,
  PauseCircle,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface TimelineProps {
  events: ComplaintEvent[];
  complaint?: Complaint | null;
}

export const Timeline: React.FC<TimelineProps> = ({ events, complaint }) => {
  const currentStatus: ComplaintStatus = complaint?.status || (events.length > 0 ? (events[events.length - 1].to_status || 'SUBMITTED') : 'SUBMITTED');

  const isResolved = currentStatus === 'RESOLVED' || currentStatus === 'CLOSED';

  // Check if a required maintenance person or technician is assigned
  const hasAssignedPerson = Boolean(
    complaint?.assigned_to ||
    complaint?.assignedUser ||
    events.some((e) => e.action === 'ASSIGNED' || e.action === 'ASSIGNMENT' || (e.actor && e.actor.role === 'MAINTENANCE'))
  );

  // Filter out duplicate events after assigning the required person
  const displayEvents = events.filter((event) => {
    if (hasAssignedPerson) {
      if (
        event.action.includes('DUPLICATE') ||
        event.note?.toLowerCase().includes('duplicate')
      ) {
        return false;
      }
    }
    return true;
  });

  const sanitizeText = (text?: string | null) => {
    if (!text) return '';
    return text.replace(/\bAI\b/g, 'Smart');
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/^AI_/, 'SMART_')
      .replace(/_AI_/g, '_SMART_')
      .replace(/_/g, ' ');
  };

  const getActionIcon = (action: string) => {
    if (action.includes('AI') || action.includes('TRIAGE')) return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    if (action.includes('ESCALATION')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    if (action === 'RESOLVED' || action.includes('RESOLV')) return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    if (action === 'ASSIGNED' || action.includes('ASSIGN')) return <Wrench className="w-3.5 h-3.5 text-cyan-400" />;
    if (action === 'SUBMITTED') return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Status machine states configuration
  const stateMachineSteps = [
    { key: 'SUBMITTED', label: '1. Submitted', short: 'Logged' },
    { key: 'AI_PROCESSED', label: '2. Triaged', short: 'Assessed' },
    { key: 'ASSIGNED', label: '3. Staff Assigned', short: 'Assigned' },
    { key: 'IN_PROGRESS', label: '4. In Progress', short: 'Repairing' },
    { key: 'RESOLVED', label: isResolved ? '5. Problem Resolved' : '5. Resolution', short: isResolved ? 'Resolved' : 'Pending' },
  ];

  const getStepProgressIndex = (status: ComplaintStatus): number => {
    switch (status) {
      case 'SUBMITTED':
        return 0;
      case 'AI_PROCESSED':
      case 'NEEDS_REVIEW':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
      case 'ON_HOLD':
      case 'REOPENED':
        return 3;
      case 'RESOLVED':
      case 'CLOSED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepProgressIndex(currentStatus);

  return (
    <div className="space-y-6">
      {/* 1. Problem Resolved or Not Status Card */}
      <div
        className={`rounded-2xl p-5 border-2 shadow-xl transition-all ${
          isResolved
            ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-500/50 text-emerald-200'
            : 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Clock className="w-6 h-6 animate-pulse stroke-[2.5]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide ${
                    isResolved
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isResolved ? 'Problem Status: RESOLVED ✅' : 'Problem Status: NOT RESOLVED ⏳'}
                </span>
                <span className="text-xs text-slate-400 font-mono">#{complaint?.id.slice(0, 8)}</span>
              </div>
              <h4 className="text-base font-extrabold text-white mt-1">
                {isResolved
                  ? 'Problem Successfully Resolved'
                  : currentStatus === 'IN_PROGRESS'
                  ? 'Repairs In Progress on Site'
                  : currentStatus === 'ASSIGNED'
                  ? 'Technician Assigned — Work Pending'
                  : currentStatus === 'ON_HOLD'
                  ? 'Repairs On Hold'
                  : currentStatus === 'REOPENED'
                  ? 'Problem Reopened for Further Fix'
                  : 'Complaint Queued for Assignment'}
              </h4>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Workflow State</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Resolution or Pending Meta Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">
              {isResolved ? 'Resolved By' : 'Assigned Technician'}
            </span>
            <span className="font-semibold text-white">
              {complaint?.assignedUser?.name || complaint?.assignedTeam?.name || 'Awaiting Assignment'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">
              {isResolved ? 'Resolution Timestamp' : 'Target SLA Due'}
            </span>
            <span className="font-semibold text-white font-mono">
              {isResolved && complaint?.resolved_at
                ? new Date(complaint.resolved_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : complaint?.sla_due_at
                ? new Date(complaint.sla_due_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Pending Schedule'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Audit Verification</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                isResolved ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isResolved ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Work Verified & Logged</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Completion</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Complete Visual Status Machine Pipeline */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Complaint Status Machine Flow
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Step {currentStepIdx + 1} of 5
          </span>
        </div>

        {/* Status Machine Horizontal Steps */}
        <div className="relative">
          {/* Track line behind nodes */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800" />
          <div
            className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${(currentStepIdx / 4) * 100}%` }}
          />

          <div className="relative z-10 grid grid-cols-5 gap-1">
            {stateMachineSteps.map((step, idx) => {
              const isPast = idx < currentStepIdx || (isResolved && idx === 4);
              const isCurrent = idx === currentStepIdx && !isResolved;
              const isUpcoming = idx > currentStepIdx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-slate-900 border-2 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/20'
                        : 'bg-slate-900 border border-slate-700 text-slate-500'
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-semibold mt-2 ${
                      isCurrent
                        ? 'text-emerald-400'
                        : isPast
                        ? 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>

                  <span
                    className={`text-[10px] ${
                      isCurrent
                        ? 'text-amber-300 font-medium'
                        : isPast
                        ? 'text-emerald-400/80'
                        : 'text-slate-600'
                    }`}
                  >
                    {isCurrent ? 'Active' : isPast ? 'Done' : 'Upcoming'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch state notices if ON_HOLD or REOPENED */}
        {currentStatus === 'ON_HOLD' && (
          <div className="mt-4 p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center gap-2 text-xs text-purple-300">
            <PauseCircle className="w-4 h-4 flex-shrink-0" />
            <span>State Machine Branch: <strong>ON HOLD</strong> — Technician paused execution awaiting parts or authorization.</span>
          </div>
        )}
        {currentStatus === 'REOPENED' && (
          <div className="mt-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <RotateCcw className="w-4 h-4 flex-shrink-0" />
            <span>State Machine Branch: <strong>REOPENED</strong> — Student flagged recurrence; dispatched back to queue.</span>
          </div>
        )}
      </div>

      {/* 3. Live Audit Timeline Event Log Stream */}
      <div className="pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Chronological Audit Stream ({displayEvents.length} events logged)
        </h4>

        {displayEvents.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center bg-slate-950/40 rounded-xl border border-slate-800">
            No audit history recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {displayEvents.map((event, idx) => (
              <div key={event.id || idx} className="relative group">
                {/* Node Icon */}
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                  {getActionIcon(event.action)}
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 transition-all group-hover:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {formatActionName(event.action)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(event.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Status change transition */}
                  {event.to_status && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 text-[11px]">Transition:</span>
                      {event.from_status && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          {event.from_status} →
                        </span>
                      )}
                      <StatusBadge status={event.to_status} />
                    </div>
                  )}

                  {/* Note */}
                  {event.note && (
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                      {sanitizeText(event.note)}
                    </p>
                  )}

                  {/* Actor */}
                  {event.actor && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>
                        {event.actor.name} ({event.actor.role})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
