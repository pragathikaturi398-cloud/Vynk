import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  Sparkles,
  Building,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3 group">
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 z-10">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Hostel Facility & Maintenance
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Select your role to access your dedicated management portal.
          </p>
        </div>

        {/* The Three Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
          {/* Card 1: Student */}
          <div
            onClick={() => navigate('/login?portal=student')}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-7 sm:p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            {/* Top Accent Light */}
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
                  <span>One-click complaint filing with photos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Real-time resolution timeline tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Assigned technician details & updates</span>
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
            onClick={() => navigate('/login?portal=maintenance')}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-7 sm:p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            {/* Top Accent Light */}
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
                Access assigned repair work orders, update task status, and manage facility repairs in real time.
              </p>

              <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Dedicated technician task queue</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>In-progress & completion updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Hostel room & student contact info</span>
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
            onClick={() => navigate('/login?portal=admin')}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-7 sm:p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            {/* Top Accent Light */}
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
                Campus oversight, infrastructure configuration, user permissions, and immutable audit logs.
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
              className="w-full py-3 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 group-hover:shadow-purple-500/40 transition-all"
            >
              <span>Administrative Sign In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 border-t border-slate-800/60 z-10">
        Vynk Campus Management Platform • Secure Role-Based Authentication
      </footer>
    </div>
  );
};

export default LandingPage;
