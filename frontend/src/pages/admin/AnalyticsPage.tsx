import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Wrench,
  FileSpreadsheet,
  Building,
  Sparkles,
} from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

export const AnalyticsPage: React.FC = () => {
  const [resolutionTimes, setResolutionTimes] = useState<any[]>([]);
  const [recurringIssues, setRecurringIssues] = useState<any[]>([]);
  const [workload, setWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [resTime, recurRes, workRes]: any[] = await Promise.all([
        api.get('/analytics/resolution-time'),
        api.get('/analytics/recurring'),
        api.get('/analytics/workload'),
      ]);

      if (resTime?.success) setResolutionTimes(resTime.data);
      if (recurRes?.success) setRecurringIssues(recurRes.data);
      if (workRes?.success) setWorkload(workRes.data);
    } catch (e) {
      console.warn('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/reports/export?format=csv', '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Advanced Analytics & Insights
          </h1>
          <p className="text-xs text-slate-400">
            Deep dive into SLA resolution compliance, recurring failure clusters, and team capacities.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Full CSV Audit</span>
        </button>
      </div>

      {/* Grid: Resolution Times & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Time Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Avg Resolution Time by Severity (Hours)</span>
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionTimes} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <XAxis dataKey="severity" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avgHours" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {resolutionTimes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Workload */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Maintenance Team Workload Distribution</span>
            </h3>
          </div>

          <div className="space-y-4">
            {workload.map((team) => (
              <div key={team.teamId} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white">{team.teamName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-semibold">
                    {team.activeComplaints} Active Tickets
                  </span>
                </div>
                <div className="space-y-1.5 mt-2">
                  {team.members.map((m: any) => (
                    <div key={m.userId} className="flex items-center justify-between text-xs text-slate-400">
                      <span>{m.name}</span>
                      <span className="text-slate-200">Load: <strong>{m.currentLoad}</strong> tickets</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recurring Issues Hotspots */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">
              Recurring Issues Detector (Past 30 Days)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Repeated complaints aggregated by block & subcategory</span>
        </div>

        {recurringIssues.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No recurring hotspots detected within the last 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Hostel & Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subcategory</th>
                  <th className="py-3 px-4 text-center">Incidents</th>
                  <th className="py-3 px-4">Suggested Preventive Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recurringIssues.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {r.hostelName} • {r.blockName} (Floor {r.floorNumber})
                    </td>
                    <td className="py-3 px-4">{r.categoryName}</td>
                    <td className="py-3 px-4 text-amber-300 font-medium">{r.subcategoryName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                        {r.count} times
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      Conduct floor-level root cause audit on main supply line or wiring trunk.
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
