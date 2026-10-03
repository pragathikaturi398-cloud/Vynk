import React from 'react';
import { Complaint, ComplaintStatus } from '../types';
import { Check, Clock, Wrench, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

interface ComplaintTrackerProps {
  complaint: Complaint;
  variant?: 'full' | 'compact';
}

/**
 * 3 Stages per architecture & specification:
 * 1. Submitted: complaint submitted by the student
 * 2. Assigned: a maintenance member is assigned
 * 3. Solved: problem solved
 */
export type TrackerStage = 1 | 2 | 3;

export const getTrackerStageInfo = (status: ComplaintStatus) => {
  switch (status) {
    case 'SUBMITTED':
    case 'AI_PROCESSED':
    case 'NEEDS_REVIEW':
      return { currentStage: 1 as TrackerStage, isResolved: false, isClosed: false };
    case 'ASSIGNED':
    case 'IN_PROGRESS':
    case 'ON_HOLD':
    case 'REOPENED':
      return { currentStage: 2 as TrackerStage, isResolved: false, isClosed: false };
    case 'RESOLVED':
      return { currentStage: 3 as TrackerStage, isResolved: true, isClosed: false };
    case 'CLOSED':
      return { currentStage: 3 as TrackerStage, isResolved: true, isClosed: true };
    default:
      return { currentStage: 1 as TrackerStage, isResolved: false, isClosed: false };
  }
};

export const ComplaintTracker: React.FC<ComplaintTrackerProps> = ({
  complaint,
  variant = 'full',
}) => {
  const { currentStage, isResolved, isClosed } = getTrackerStageInfo(complaint.status);

  const stages = [
    {
      id: 1 as TrackerStage,
      name: 'Submitted',
      tagline: 'Complaint submitted by student',
      detail: complaint.created_at
        ? new Date(complaint.created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Logged in system',
    },
    {
      id: 2 as TrackerStage,
      name: 'Assigned',
      tagline: 'Maintenance member assigned',
      detail:
        complaint.assignedUser?.name
          ? `${complaint.assignedUser.name}${complaint.assignedUser.phone ? ` • 📞 ${complaint.assignedUser.phone}` : ''} (${complaint.assignedTeam?.name || 'Technician'})`
          : complaint.assignedTeam?.name
          ? complaint.assignedTeam.name
          : currentStage >= 2
          ? 'Team Dispatched'
          : 'Awaiting assignment',
    },
    {
      id: 3 as TrackerStage,
      name: 'Solved',
      tagline: 'Problem solved',
      detail:
        complaint.resolved_at
          ? `Solved on ${new Date(complaint.resolved_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : isClosed
          ? 'Closed & Verified'
          : currentStage === 3
          ? 'Resolution verified'
          : 'Pending resolution',
    },
  ];

  // Calculate progress line percentage: Stage 1 = 0%, Stage 2 = 50%, Stage 3 = 100%
  const progressPercent = currentStage === 1 ? 0 : currentStage === 2 ? 50 : 100;

  if (variant === 'compact') {
    return (
      <div className="w-full py-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Stage {currentStage} of 3: <strong className="text-white">{stages[currentStage - 1].name}</strong>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {currentStage === 3 ? 'Completed' : 'In Progress'}
          </span>
        </div>

        {/* Compact Progress Bar with Ticks */}
        <div className="relative flex items-center justify-between">
          {/* Background track line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-slate-800 rounded-full" />
          {/* Active filled line */}
          <div
            className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />

          {stages.map((stage) => {
            const isCompleted = currentStage > stage.id || (currentStage === 3 && stage.id === 3);
            const isCurrent = currentStage === stage.id && stage.id !== 3;

            return (
              <div key={stage.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/20'
                      : 'bg-slate-800 border border-slate-700 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ) : (
                    <span>{stage.id}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors ${
                    isCurrent
                      ? 'text-emerald-400 font-bold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full Variant for Complaint Detail Page
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-md mb-6">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live Progress Tracker
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time synchronization active
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            Status: <span className="text-emerald-400">{stages[currentStage - 1].name}</span>
          </h2>
        </div>

        {/* Current Stage Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
          <span className="text-slate-400">Active Phase:</span>
          <span className="font-extrabold text-emerald-400">
            {currentStage === 1 && 'Stage 1: Submitted'}
            {currentStage === 2 && 'Stage 2: Assigned'}
            {currentStage === 3 && 'Stage 3: Solved'}
          </span>
        </div>
      </div>

      {/* The 3-Stage Progress Bar with Ticks */}
      <div className="relative px-4 sm:px-12 my-6">
        {/* Background track bar */}
        <div className="absolute top-7 left-12 right-12 sm:left-24 sm:right-24 h-1.5 bg-slate-800 rounded-full -translate-y-1/2" />

        {/* Dynamic completed track fill */}
        <div
          className="absolute top-7 left-12 sm:left-24 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full -translate-y-1/2 transition-all duration-700 ease-out shadow-lg shadow-emerald-500/30"
          style={{
            width:
              currentStage === 1
                ? '0%'
                : currentStage === 2
                ? 'calc(50% - 24px)'
                : 'calc(100% - 48px)',
          }}
        />

        {/* 3 Interactive Nodes */}
        <div className="relative z-10 grid grid-cols-3 gap-2">
          {stages.map((stage) => {
            const isCompleted = currentStage > stage.id || (currentStage === 3 && stage.id === 3);
            const isCurrent = currentStage === stage.id && stage.id !== 3;
            const isPending = currentStage < stage.id;

            return (
              <div key={stage.id} className="flex flex-col items-center text-center">
                {/* Tick Circle Node */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
                    isCompleted
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-xl shadow-emerald-500/30 scale-105'
                      : isCurrent
                      ? 'bg-slate-900 border-2 border-emerald-400 text-emerald-400 shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-500/15 scale-110'
                      : 'bg-slate-900 border-2 border-slate-800 text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <div className="flex items-center justify-center">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="flex flex-col items-center justify-center">
                      {stage.id === 1 && <Clock className="w-6 h-6 animate-pulse text-emerald-400" />}
                      {stage.id === 2 && <Wrench className="w-6 h-6 animate-pulse text-emerald-400" />}
                      {stage.id === 3 && <CheckCircle2 className="w-6 h-6 animate-pulse text-emerald-400" />}
                    </div>
                  ) : (
                    <span className="text-base font-bold text-slate-600">{stage.id}</span>
                  )}

                  {/* Pulsing indicator on current active stage */}
                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
                    </span>
                  )}
                </div>

                {/* Stage Label & Details */}
                <div className="mt-4 space-y-1 max-w-[200px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`text-sm font-extrabold ${
                        isCurrent
                          ? 'text-emerald-400'
                          : isCompleted
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {stage.id}. {stage.name}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Tick
                      </span>
                    )}
                    {isCurrent && (
                      <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Current
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs ${
                      isCurrent
                        ? 'text-slate-200 font-medium'
                        : isCompleted
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {stage.tagline}
                  </p>

                  <div
                    className={`text-[11px] pt-1 font-mono ${
                      isCurrent
                        ? 'text-emerald-300 font-semibold'
                        : isCompleted
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {stage.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helpful stage context footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {currentStage === 1 && (
            <span className="text-slate-300">
              Your complaint is registered and queued for team dispatch.
            </span>
          )}
          {currentStage === 2 && (
            <span className="text-slate-300">
              A technician is assigned and actively addressing your issue.
            </span>
          )}
          {currentStage === 3 && (
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Work has been successfully completed and resolved.
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500">
          Last status update: <span className="text-slate-300 font-mono">{complaint.status}</span>
        </div>
      </div>
    </div>
  );
};
