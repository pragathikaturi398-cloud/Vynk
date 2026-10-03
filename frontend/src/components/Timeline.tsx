import React from 'react';
import { ComplaintEvent } from '../types';
import { StatusBadge } from './StatusBadge';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Sparkles, User, FileText } from 'lucide-react';

export const Timeline: React.FC<{ events: ComplaintEvent[] }> = ({ events }) => {
  if (!events || events.length === 0) {
    return <div className="text-xs text-slate-500 py-4">No activity history recorded yet.</div>;
  }

  const getActionIcon = (action: string) => {
    if (action.includes('AI')) return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    if (action.includes('ESCALATION')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
    if (action === 'RESOLVED') return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    if (action === 'SUBMITTED') return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {events.map((event, idx) => (
        <div key={event.id || idx} className="relative group">
          {/* Node Icon */}
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
            {getActionIcon(event.action)}
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 transition-all group-hover:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {event.action.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] text-slate-500">
                {new Date(event.created_at).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Status change pill */}
            {event.to_status && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Status:</span>
                <StatusBadge status={event.to_status} />
              </div>
            )}

            {/* Note */}
            {event.note && (
              <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                {event.note}
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
  );
};
