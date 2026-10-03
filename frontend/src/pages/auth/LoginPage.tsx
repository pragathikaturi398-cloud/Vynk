import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, GraduationCap, Wrench, Building, Shield } from 'lucide-react';
import { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: Role) => {
    setLoading(true);
    try {
      await switchDemoRole(role);
      if (role === 'STUDENT') navigate('/student');
      else if (role === 'MAINTENANCE') navigate('/maintenance');
      else navigate('/admin');
    } catch (err: any) {
      setError('Failed to switch demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 items-center justify-center shadow-xl shadow-emerald-500/20 mb-4">
            <Sparkles className="w-6 h-6 text-slate-950 font-black" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome to Vynk</h2>
          <p className="text-sm text-slate-400 mt-1">Smart Hostel Complaint Management Platform</p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant Demo Accounts (One-Click)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('STUDENT')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all text-left"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-slate-100">Student</div>
                <div className="text-[10px] text-slate-400">Aarav (Room 204)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('MAINTENANCE')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all text-left"
            >
              <Wrench className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-slate-100">Maintenance</div>
                <div className="text-[10px] text-slate-400">Ramesh (Plumber)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('WARDEN')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-500/20 hover:border-blue-500/40 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all text-left"
            >
              <Building className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-slate-100">Warden</div>
                <div className="text-[10px] text-slate-400">Aryabhata Hostel</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('SUPERADMIN')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-purple-500/20 hover:border-purple-500/40 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all text-left"
            >
              <Shield className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <div className="text-slate-100">Admin</div>
                <div className="text-[10px] text-slate-400">Full System Ops</div>
              </div>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@vynk.local"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
