import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Shield, Clock, ExternalLink, Filter } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res: any = await api.get('/audit-logs');
      if (res?.success) {
        setLogs(res.data);
      }
    } catch (e) {
      console.warn('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Immutable Audit Trail
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          Append-only cryptographic record of all status changes, AI classifications, reassignments, and escalations.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Complaint</th>
                  <th className="py-3 px-4">Transition</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Audit Note</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors font-sans">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-200">
                      {log.complaint?.title || `#${log.complaint_id.slice(0, 8)}`}
                    </td>
                    <td className="py-3 px-4">
                      {log.to_status ? (
                        <div className="flex items-center gap-1.5">
                          {log.from_status && <span className="text-slate-500">{log.from_status} →</span>}
                          <StatusBadge status={log.to_status} />
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.actor ? `${log.actor.name} (${log.actor.role})` : 'System / AI Engine'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {log.note || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/complaints/${log.complaint_id}`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 inline-flex items-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
