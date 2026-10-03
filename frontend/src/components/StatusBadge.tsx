import React from 'react';
import { ComplaintStatus } from '../types';

export const StatusBadge: React.FC<{ status: ComplaintStatus }> = ({ status }) => {
  const styles: Record<ComplaintStatus, { bg: string; text: string; dot: string; label: string }> = {
    SUBMITTED: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400', label: 'Submitted' },
    AI_PROCESSED: { bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-400', dot: 'bg-indigo-400', label: 'Triaged' },
    NEEDS_REVIEW: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400', label: 'Needs Review' },
    ASSIGNED: { bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-400', label: 'Assigned' },
    IN_PROGRESS: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400', label: 'In Progress' },
    ON_HOLD: { bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-400', label: 'On Hold' },
    RESOLVED: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Resolved' },
    CLOSED: { bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', dot: 'bg-slate-400', label: 'Closed' },
    REOPENED: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400', label: 'Reopened' },
  };

  const style = styles[status] || styles.SUBMITTED;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};
