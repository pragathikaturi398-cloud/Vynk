import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { AnalyticsOverview, Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { SeverityBadge } from '../../components/SeverityBadge';
import { Link } from 'react-router-dom';
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
} from 'recharts';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Star,
  RefreshCw,
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [hostelData, setHostelData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ovRes, catRes, hostRes, insRes, compRes]: any[] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/by-category'),
        api.get('/analytics/by-hostel'),
        api.get('/insights'),
        api.get('/complaints'),
      ]);

      if (ovRes?.success) setOverview(ovRes.data);
      if (catRes?.success) setCategoryData(catRes.data);
      if (hostRes?.success) setHostelData(hostRes.data);
      if (insRes?.success) setInsights(insRes.data);
      if (compRes?.success) setRecentComplaints(compRes.data.slice(0, 6));
    } catch (err) {
      console.warn('Failed to load admin overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleGenerateInsight = async () => {
    setGeneratingInsight(true);
    try {
      const res: any = await api.post('/insights/generate');
      if (res?.success) {
        setInsights((prev) => [res.data, ...prev]);
      }
    } catch (e) {
      alert('Failed to generate operational insight');
    } finally {
      setGeneratingInsight(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/reports/export?format=csv', '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/20 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Operations Center
            </span>
            <span className="text-xs text-slate-400">
              {user?.role === 'SUPERADMIN' ? 'Super Admin View' : `Warden (${user?.name})`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hostel Operations & Automated Triage
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor real-time repair requests, SLA compliance, recurring clusters, and automated routing.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <Link
            to="/admin/complaints"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          >
            <span>Manage Complaints</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Insights Highlight Card */}
      <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Smart Operational Insights</h3>
              <p className="text-[11px] text-slate-400">Automated SQL pattern clustering with plain-language recommendations</p>
            </div>
          </div>

          <button
            onClick={handleGenerateInsight}
            disabled={generatingInsight}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generatingInsight ? 'animate-spin' : ''}`} />
            <span>{generatingInsight ? 'Analyzing Clusters...' : 'Refresh Insights'}</span>
          </button>
        </div>

        <div className="mt-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
          {insights.length > 0 ? (
            <p className="whitespace-pre-line font-medium text-slate-200">
              {insights[0].summary_text}
            </p>
          ) : (
            <p className="text-slate-400">
              Analyzing complaint history... Click "Refresh Insights" to scan 30-day recurring complaint clusters across all hostels and rooms.
            </p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 block">Total Issues</span>
          <div className="text-2xl font-black text-white mt-1">{overview?.total || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 block">Active Open</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{overview?.open || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 block">Critical Emergencies</span>
          <div className="text-2xl font-black text-rose-400 mt-1 flex items-center gap-1">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>{overview?.criticalCount || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 block">SLA Breached</span>
          <div className="text-2xl font-black text-red-500 mt-1">{overview?.slaBreachedCount || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 block">Avg Resolution Time</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {overview?.avgResolutionHours || 0} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[11px] font-medium text-slate-400 block">Student Rating</span>
          <div className="text-2xl font-black text-amber-300 mt-1 flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>{overview?.avgRating || 5.0}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white">Complaints by Category</h3>
            <span className="text-xs text-slate-400">Total volume</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hostels Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white mb-4">Hostel Breakdown</h3>
            <div className="space-y-4">
              {hostelData.map((h) => (
                <div key={h.hostelId} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-400" />
                      {h.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {h.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-800/60 text-slate-400">
                    <span>Total: <strong className="text-white">{h.totalComplaints}</strong></span>
                    <span>Open: <strong className="text-amber-400">{h.openComplaints}</strong></span>
                    <span>Critical: <strong className="text-rose-400">{h.criticalComplaints}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/admin/analytics"
            className="mt-4 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <span>View Detailed Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-white">Recent Complaints & Triage</h3>
          <Link
            to="/admin/complaints"
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({recentComplaints.length})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Title & Summary</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">#{c.id.slice(0, 6)}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white truncate max-w-xs">{c.title}</div>
                    {c.ai_summary && (
                      <div className="text-[11px] text-slate-400 truncate max-w-xs italic">
                        {c.ai_summary}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {c.room.floor.block.name} • {c.room.room_no}
                  </td>
                  <td className="py-3 px-4 text-slate-200">{c.category.name}</td>
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
                    <Link
                      to={`/complaints/${c.id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
