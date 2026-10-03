import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  Wrench,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building,
  Home,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Key,
  DoorOpen,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../api/client';
import { HostelItem, User as UserType } from '../../types';

type AuthStage = 'ROLE_SELECTION' | 'STUDENT_PORTAL' | 'MAINTENANCE_PORTAL' | 'ADMIN_PORTAL';

export const LoginPage: React.FC = () => {
  const { user, login, studentSignUp, completeStudentOnboarding, setPermanentPassword, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine stage from query params or default to ROLE_SELECTION
  const initialPortal = searchParams.get('portal');
  const [stage, setStage] = useState<AuthStage>(() => {
    if (initialPortal === 'student') return 'STUDENT_PORTAL';
    if (initialPortal === 'maintenance') return 'MAINTENANCE_PORTAL';
    if (initialPortal === 'admin') return 'ADMIN_PORTAL';
    return 'ROLE_SELECTION';
  });

  // Student auth tab: 'LOGIN' or 'SIGNUP'
  const [studentAuthMode, setStudentAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Student Onboarding State (for first login)
  const [showStudentOnboarding, setShowStudentOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    studentId: '',
    hostelName: '',
    roomNumber: '',
  });
  const [availableHostels, setAvailableHostels] = useState<HostelItem[]>([]);

  // Super Admin First-time Password Setup State
  const [showAdminPasswordSetup, setShowAdminPasswordSetup] = useState(false);
  const [adminPasswordData, setAdminPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Keep search params synced with stage
  const selectRole = (targetStage: AuthStage) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStage(targetStage);

    if (targetStage === 'STUDENT_PORTAL') {
      setSearchParams({ portal: 'student' });
    } else if (targetStage === 'MAINTENANCE_PORTAL') {
      setSearchParams({ portal: 'maintenance' });
    } else if (targetStage === 'ADMIN_PORTAL') {
      setSearchParams({ portal: 'admin' });
    } else {
      setSearchParams({});
    }
  };

  // Fetch available hostels for student room selection
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const res: any = await api.get('/hostels');
        if (res?.success && Array.isArray(res.data)) {
          setAvailableHostels(res.data);
          if (res.data.length > 0 && !onboardingData.hostelName) {
            setOnboardingData((prev) => ({ ...prev, hostelName: res.data[0].name }));
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    };
    fetchHostels();
  }, []);

  // Handle post-login redirection based on role
  const handleRoleRedirect = (targetUser: UserType) => {
    if (targetUser.role === 'STUDENT') {
      navigate('/student');
    } else if (targetUser.role === 'MAINTENANCE') {
      navigate('/maintenance');
    } else if (targetUser.role === 'SUPERADMIN') {
      navigate('/super-admin');
    } else if (targetUser.role === 'WARDEN') {
      navigate('/admin');
    } else {
      navigate('/student');
    }
  };

  // Student Sign Up
  const handleStudentSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await studentSignUp(email, password);
      // Student signed up -> open first-login profile onboarding modal
      setShowStudentOnboarding(true);
      setSuccessMsg('Account registered! Please complete your profile details below.');
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.message || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  // Student or Staff / Admin Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    setLoading(true);
    try {
      const loggedUser = await login(email, password);

      // Check if student first login onboarding is required
      if (loggedUser.role === 'STUDENT' && loggedUser.is_first_login) {
        setShowStudentOnboarding(true);
        setLoading(false);
        return;
      }

      // Check if Super Admin or Maintenance first-time password setup is required
      if ((loggedUser.role === 'SUPERADMIN' || loggedUser.role === 'MAINTENANCE') && loggedUser.is_first_login) {
        setAdminPasswordData((prev) => ({ ...prev, currentPassword: password }));
        setShowAdminPasswordSetup(true);
        setLoading(false);
        return;
      }

      // Regular flow -> redirect to role dashboard
      handleRoleRedirect(loggedUser);
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Student Onboarding Submission
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await completeStudentOnboarding(onboardingData);
      setShowStudentOnboarding(false);
      navigate('/student');
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.message || 'Failed to save student profile.');
    } finally {
      setLoading(false);
    }
  };

  // Complete First-Time Password Setup Submission
  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (adminPasswordData.newPassword !== adminPasswordData.confirmNewPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (adminPasswordData.newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await setPermanentPassword(
        adminPasswordData.currentPassword,
        adminPasswordData.newPassword
      );
      setShowAdminPasswordSetup(false);
      // Route to appropriate role dashboard
      if (user) {
        handleRoleRedirect(user);
      } else {
        navigate(stage === 'MAINTENANCE_PORTAL' ? '/maintenance' : '/super-admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.message || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambience Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <div
          onClick={() => selectRole('ROLE_SELECTION')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
              Vynk{' '}
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Smart Platform
              </span>
            </span>
          </div>
        </div>

        {/* Active Session Indicator (if already logged in) */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 py-1.5 px-3 rounded-xl text-xs">
            <span className="text-slate-400 hidden sm:inline">Signed in as</span>
            <span className="font-bold text-white">{user.name}</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold text-[10px]">
              {user.role}
            </span>
            <button
              onClick={() => handleRoleRedirect(user)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 ml-1"
            >
              <span>Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-400 ml-1 p-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* VIEW 1: THREE ROLE CARDS (STUDENT, MAINTENANCE, SUPER ADMIN) */}
      {/* ========================================================================= */}
      {stage === 'ROLE_SELECTION' && (
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 z-10">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Hostel Facility & Maintenance
            </h1>
            <p className="text-sm sm:text-base text-slate-400">
              Select your role to access your dedicated management portal.
            </p>
          </div>

          {/* Three Cards: Student, Maintenance, Super Admin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
            {/* Card 1: Student */}
            <div
              onClick={() => selectRole('STUDENT_PORTAL')}
              className="group relative bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-7 sm:p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300 shadow-lg shadow-emerald-500/10">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Residents
                  </span>
                </div>

                <h2 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors mb-2">
                  Student
                </h2>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Report room and hostel issues, track live status, receive real-time updates, and confirm resolutions.
                </p>

                <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Self-registration with email and password</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>One-time room allocation onboarding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Real-time resolution timeline tracking</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 group-hover:shadow-emerald-500/40 transition-all"
              >
                <span>Continue as Student</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Card 2: Maintenance Staff */}
            <div
              onClick={() => selectRole('MAINTENANCE_PORTAL')}
              className="group relative bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-7 sm:p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 shadow-lg shadow-amber-500/10">
                    <Wrench className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Technicians
                  </span>
                </div>

                <h2 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors mb-2">
                  Maintenance
                </h2>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Access assigned repair work orders, update resolution progress, and manage facility fixes in real time.
                </p>

                <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Dedicated technician task queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>In-progress & completion status updates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Hostel room & student contact access</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="w-full py-3 px-5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 group-hover:shadow-amber-500/40 transition-all"
              >
                <span>Staff Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Card 3: Super Admin */}
            <div
              onClick={() => selectRole('ADMIN_PORTAL')}
              className="group relative bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-7 sm:p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-purple-500/10">
                    <Shield className="w-7 h-7" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Administration
                  </span>
                </div>

                <h2 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors mb-2">
                  Super Admin
                </h2>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Campus governance, facility infrastructure, user permissions, category routing, and audit logs.
                </p>

                <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>Executive analytics & KPI metrics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>Hostel, block, floor, and room management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>User roles & maintenance team setup</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="w-full py-3 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 group-hover:shadow-purple-500/40 transition-all"
              >
                <span>Administrative Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ROLE LOGIN / SIGN UP VIEW */}
      {/* ========================================================================= */}
      {stage !== 'ROLE_SELECTION' && (
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 z-10">
          <div className="max-w-md w-full mx-auto">
            {/* Back Button */}
            <div className="mb-4">
              <button
                onClick={() => selectRole('ROLE_SELECTION')}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Role Selection</span>
              </button>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  stage === 'STUDENT_PORTAL'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : stage === 'MAINTENANCE_PORTAL'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-500'
                }`}
              />

              {/* Portal Header */}
              <div className="text-center mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg ${
                    stage === 'STUDENT_PORTAL'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-emerald-500/10'
                      : stage === 'MAINTENANCE_PORTAL'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-amber-500/10'
                      : 'bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-purple-500/10'
                  }`}
                >
                  {stage === 'STUDENT_PORTAL' && <GraduationCap className="w-7 h-7" />}
                  {stage === 'MAINTENANCE_PORTAL' && <Wrench className="w-7 h-7" />}
                  {stage === 'ADMIN_PORTAL' && <Shield className="w-7 h-7" />}
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight">
                  {stage === 'STUDENT_PORTAL' && 'Student Portal'}
                  {stage === 'MAINTENANCE_PORTAL' && 'Maintenance Staff Portal'}
                  {stage === 'ADMIN_PORTAL' && 'Super Admin Portal'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {stage === 'STUDENT_PORTAL' && 'Hostel resident complaint tracking and resolution'}
                  {stage === 'MAINTENANCE_PORTAL' && 'Technician work orders, task updates, and facility repairs'}
                  {stage === 'ADMIN_PORTAL' && 'Campus governance, facility configuration, and audit logs'}
                </p>
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* STUDENT FORM */}
              {stage === 'STUDENT_PORTAL' && (
                <div>
                  <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setStudentAuthMode('LOGIN');
                        setErrorMsg(null);
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        studentAuthMode === 'LOGIN'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentAuthMode('SIGNUP');
                        setErrorMsg(null);
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        studentAuthMode === 'SIGNUP'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {studentAuthMode === 'LOGIN' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="email"
                            required
                            placeholder="student@campus.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                      >
                        <span>{loading ? 'Authenticating...' : 'Sign In as Student'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}

                  {studentAuthMode === 'SIGNUP' && (
                    <form onSubmit={handleStudentSignUp} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="email"
                            required
                            placeholder="student@campus.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">Confirm Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                      >
                        <span>{loading ? 'Creating Account...' : 'Register as Student'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* MAINTENANCE STAFF FORM */}
              {stage === 'MAINTENANCE_PORTAL' && (
                <div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-5">
                    Maintenance staff sign in with the email and temporary password provided by your Super Administrator.
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Staff Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="technician@vynk.local"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      <span>{loading ? 'Authenticating...' : 'Sign In to Task Queue'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
                    Accounts are provisioned by the Super Administrator.
                  </div>
                </div>
              )}

              {/* SUPER ADMIN FORM */}
              {stage === 'ADMIN_PORTAL' && (
                <div>
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs mb-5">
                    Super Admin sign in with your official administrator credentials. Public account creation is disabled.
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Official Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="admin@vynk.local"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      <span>{loading ? 'Authenticating...' : 'Sign In as Super Admin'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
                    Pre-configured administrator account credentials.
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STUDENT FIRST LOGIN PROFILE ONBOARDING */}
      {/* ========================================================================= */}
      {showStudentOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md">
                <DoorOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Complete Your Profile</h3>
              <p className="text-xs text-slate-400 mt-1">
                Please provide your details once to configure your room and hostel records.
              </p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={onboardingData.name}
                    onChange={(e) => setOnboardingData({ ...onboardingData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Student ID / Roll No</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-CS-084"
                    value={onboardingData.studentId}
                    onChange={(e) => setOnboardingData({ ...onboardingData, studentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hostel Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {availableHostels.length > 0 ? (
                    <select
                      value={onboardingData.hostelName}
                      onChange={(e) => setOnboardingData({ ...onboardingData, hostelName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {availableHostels.map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name} ({h.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aryabhata Boys Hostel"
                      value={onboardingData.hostelName}
                      onChange={(e) => setOnboardingData({ ...onboardingData, hostelName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Room Number</label>
                <div className="relative">
                  <Home className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 204 or B-102"
                    value={onboardingData.roomNumber}
                    onChange={(e) => setOnboardingData({ ...onboardingData, roomNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                <span>{loading ? 'Saving Profile...' : 'Save & Enter Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SUPER ADMIN FIRST LOGIN PASSWORD CONFIGURATION */}
      {/* ========================================================================= */}
      {showAdminPasswordSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div
                className={`w-12 h-12 rounded-2xl mx-auto mb-3 shadow-md flex items-center justify-center ${
                  stage === 'MAINTENANCE_PORTAL'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                }`}
              >
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">Set Permanent Password</h3>
              <p className="text-xs text-slate-400 mt-1">
                {stage === 'MAINTENANCE_PORTAL'
                  ? 'Welcome, Maintenance Staff. Please set a new permanent password to secure your account.'
                  : 'Welcome, Super Admin. Please establish your permanent secure password to complete activation.'}
              </p>
            </div>

            <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Current Temporary Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={adminPasswordData.currentPassword}
                    onChange={(e) =>
                      setAdminPasswordData({ ...adminPasswordData, currentPassword: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">New Secure Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={adminPasswordData.newPassword}
                    onChange={(e) =>
                      setAdminPasswordData({ ...adminPasswordData, newPassword: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-enter new password"
                    value={adminPasswordData.confirmNewPassword}
                    onChange={(e) =>
                      setAdminPasswordData({ ...adminPasswordData, confirmNewPassword: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                <span>{loading ? 'Updating Password...' : 'Save & Enter Command Center'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 border-t border-slate-800/60 z-10">
        Vynk Campus Management Platform • Role-Based Authentication
      </footer>
    </div>
  );
};

export default LoginPage;
