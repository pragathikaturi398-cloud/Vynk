import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../api/client';
import { NotificationItem, Role } from '../types';
import {
  Bell,
  CheckCircle2,
  LogOut,
  Sparkles,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronDown,
  Building,
  Wrench,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res: any = await api.get('/notifications');
      if (res?.success) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.warn('Failed to load notifications');
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.warn('Mark read failed');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleIcons: Record<Role, React.ReactNode> = {
    STUDENT: <GraduationCap className="w-4 h-4 text-emerald-400" />,
    MAINTENANCE: <Wrench className="w-4 h-4 text-amber-400" />,
    WARDEN: <Building className="w-4 h-4 text-blue-400" />,
    SUPERADMIN: <Shield className="w-4 h-4 text-purple-400" />,
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                Vynk <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Smart Platform</span>
              </span>
            </div>
          </Link>

          {/* Navigation by role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 ml-4 text-sm font-medium">
              {user.role === 'STUDENT' && (
                <>
                  <Link
                    to="/student"
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    My Complaints
                  </Link>
                </>
              )}

              {user.role === 'MAINTENANCE' && (
                <>
                  <Link
                    to="/maintenance"
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Task Queue
                  </Link>
                </>
              )}

              {(user.role === 'WARDEN' || user.role === 'SUPERADMIN') && (
                <>
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/complaints"
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Complaints
                  </Link>
                  <Link
                    to="/admin/analytics"
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Analytics & Reports
                  </Link>
                  <Link
                    to="/admin/audit"
                    className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Audit Trail
                  </Link>

                  {user.role === 'SUPERADMIN' && (
                    <Link
                      to="/super-admin"
                      className="px-3 py-1.5 rounded-lg text-purple-300 font-bold hover:text-white bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/40 transition-all flex items-center gap-1.5 ml-1"
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>Super Admin Portal</span>
                    </Link>
                  )}
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Real-time indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300"
            title={connected ? 'Real-time WebSocket Live' : 'Connecting to real-time engine...'}
          >
            {connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="hidden sm:inline">Connecting</span>
              </>
            )}
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Demo Role: {user?.role || 'Guest'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Switch Demo Account
                </div>
                {(['STUDENT', 'MAINTENANCE', 'WARDEN', 'SUPERADMIN'] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={async () => {
                      setShowRoleMenu(false);
                      await switchDemoRole(r);
                      if (r === 'STUDENT') navigate('/student');
                      else if (r === 'MAINTENANCE') navigate('/maintenance');
                      else if (r === 'SUPERADMIN') navigate('/super-admin');
                      else navigate('/admin');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      user?.role === r ? 'text-emerald-400 font-semibold bg-emerald-500/10' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {roleIcons[r]}
                      <span>{r === 'SUPERADMIN' ? 'Super Admin' : r}</span>
                    </div>
                    {user?.role === r && <span className="text-[10px] text-emerald-400">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (!showNotifMenu) fetchNotifications();
                }}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800">
                    <span className="font-semibold text-xs text-slate-200">Live Alerts ({unreadCount} new)</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${
                            n.read ? 'bg-transparent text-slate-400' : 'bg-slate-800/40 text-slate-200 font-medium'
                          }`}
                        >
                          <p>{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[10px] text-slate-400">
                  {user.room ? `Room ${user.room.roomNo}` : user.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
