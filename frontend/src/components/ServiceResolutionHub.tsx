import React, { useState } from 'react';
import { Complaint, ComplaintStatus } from '../types';
import {
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Info,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

interface ServiceResolutionHubProps {
  complaint: Complaint;
  onReopen?: () => void;
}

export const ServiceResolutionHub: React.FC<ServiceResolutionHubProps> = ({
  complaint,
  onReopen,
}) => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [studentNote, setStudentNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';

  // Category safety guidelines & tips
  const getCategoryAdvisory = (categoryName: string) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('plumb') || lower.includes('water')) {
      return {
        title: 'Plumbing Safety Notice',
        tip: 'If water leakage is near electrical sockets or wires, do not touch wet switches. Turn off room sub-switches immediately and inform the caretaker.',
      };
    }
    if (lower.includes('electr') || lower.includes('power')) {
      return {
        title: 'Electrical Precaution',
        tip: 'Never attempt to insert objects or probe switchboards. Keep hands completely dry and avoid plugging high-load appliances until certified repaired.',
      };
    }
    if (lower.includes('carpenter') || lower.includes('furniture')) {
      return {
        title: 'Furniture & Hardware Care',
        tip: 'Do not force jammed doors or windows to prevent frame damage. Technicians carry proper lubrication and hinge alignment tools.',
      };
    }
    return {
      title: 'Hostel Maintenance Advisory',
      tip: 'Please ensure your room is accessible or coordinate with your roommate during the scheduled maintenance window.',
    };
  };

  const advisory = getCategoryAdvisory(complaint.category.name);

  // Extract latest resolution note from events if any
  const resolutionEvent = complaint.events
    ?.slice()
    .reverse()
    .find((e) => e.action.includes('RESOLV') || e.to_status === 'RESOLVED');

  const handleSaveStudentNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNote.trim()) return;
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Problem Resolved or Not Status Hero Card */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border-2 shadow-2xl relative overflow-hidden transition-all ${
          isResolved
            ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/50'
            : 'bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border-amber-500/40'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-amber-500/20'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <Clock className="w-7 h-7 animate-pulse stroke-[2.5]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-black uppercase px-3 py-0.5 rounded-full border tracking-wide ${
                    isResolved
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isResolved ? 'Problem Status: RESOLVED ✅' : 'Problem Status: NOT RESOLVED ⏳'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  WO-{complaint.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                {isResolved
                  ? 'Problem Verified & Successfully Solved'
                  : complaint.status === 'IN_PROGRESS'
                  ? 'Technician on Site — Repairs In Progress'
                  : complaint.status === 'ASSIGNED'
                  ? 'Technician Assigned — Awaiting Service Window'
                  : complaint.status === 'ON_HOLD'
                  ? 'Work Paused — Sourcing Required Parts'
                  : complaint.status === 'REOPENED'
                  ? 'Issue Reopened for Secondary Inspection'
                  : 'Complaint Queued for Technician Assignment'}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Current Stage
            </span>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg inline-block mt-0.5 ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              {complaint.status}
            </span>
          </div>
        </div>

        {/* Resolution Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] mb-0.5">
              {isResolved ? 'Resolution Technician' : 'Assigned Technician'}
            </span>
            <span className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Wrench className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">
                {complaint.assignedUser?.name || complaint.assignedTeam?.name || 'In Dispatch Queue'}
              </span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] mb-0.5">
              {isResolved ? 'Resolved Date & Time' : 'SLA Target Window'}
            </span>
            <span className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate font-mono">
                {isResolved && complaint.resolved_at
                  ? new Date(complaint.resolved_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : complaint.sla_due_at
                  ? new Date(complaint.sla_due_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Pending Scheduling'}
              </span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] mb-0.5">Quality Sign-Off</span>
            <span
              className={`font-bold flex items-center gap-1.5 text-sm ${
                isResolved ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isResolved ? (
                <>
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Verified Fixed</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Pending Repair</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Resolution proof or note if resolved */}
        {isResolved && resolutionEvent?.note && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
            <span className="font-extrabold text-emerald-300 block mb-1">Technician Resolution Summary:</span>
            <p className="italic">"{resolutionEvent.note}"</p>
          </div>
        )}

        {/* Option to Reopen Complaint After Completion */}
        {isResolved && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Problem Not Solved or Recurred?</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Reopen Available
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  If the issue still persists or wasn't resolved properly, you have the option to reopen it for urgent technician re-dispatch.
                </p>
              </div>
            </div>

            {onReopen && (
              <button
                type="button"
                onClick={onReopen}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reopen Issue</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Assigned Technician & Maintenance Team Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Assigned Service Department</h4>
              <p className="text-xs text-slate-400">
                Authorized hostel maintenance personnel handling this work order
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowContactModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Contact Helpdesk</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Department & Category
            </span>
            <div className="text-base font-extrabold text-white">
              {complaint.assignedTeam?.name || complaint.category.name + ' Service Team'}
            </div>
            <p className="text-xs text-slate-300">
              Responsible for {complaint.category.name} issues, including {complaint.subcategory.name}.
            </p>
          </div>

          {/* Technician Profile & Direct Contact Card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Assigned Specialist & Worker Contact
              </span>
              {complaint.assignedUser && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>On Duty</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{complaint.assignedUser?.name || 'Assigned to Service Pool'}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {complaint.assignedTeam?.name || `${complaint.category.name} Department`}
                </div>
              </div>

              {/* Direct Worker Contact Action */}
              {complaint.assignedUser?.phone && (
                <a
                  href={`tel:${complaint.assignedUser.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {complaint.assignedUser.name.split(' ')[0]}</span>
                </a>
              )}
            </div>

            {/* Worker Contact Number Details Row */}
            {complaint.assignedUser ? (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Worker Contact Number:</span>
                  </span>
                  {complaint.assignedUser.phone ? (
                    <a
                      href={`tel:${complaint.assignedUser.phone}`}
                      className="font-mono font-bold text-emerald-400 hover:underline"
                    >
                      {complaint.assignedUser.phone}
                    </a>
                  ) : (
                    <span className="text-slate-500 italic">Registered on file</span>
                  )}
                </div>

                {complaint.assignedUser.email && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <span>Worker Email:</span>
                    </span>
                    <a
                      href={`mailto:${complaint.assignedUser.email}`}
                      className="text-slate-300 font-mono hover:text-white hover:underline"
                    >
                      {complaint.assignedUser.email}
                    </a>
                  </div>
                )}
              </div>
            ) : !isResolved ? (
              <div className="text-xs text-slate-400 italic">
                A technician from the maintenance department will be assigned shortly with contact info.
              </div>
            ) : null}
          </div>
        </div>

        {/* Location Verification Tag */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              Target Location: <strong>{complaint.room.floor.block.hostel.name}</strong> • Block{' '}
              <strong>{complaint.room.floor.block.name}</strong> • Room{' '}
              <strong>{complaint.room.room_no}</strong> (Floor {complaint.room.floor.number})
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            Room Code #{complaint.room.id.slice(0, 6)}
          </span>
        </div>
      </div>

      {/* 3. Student Room Access & Visiting Instructions */}
      {!isResolved && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2.5 mb-3">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">Student Room Access & Availability Note</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Provide special instructions for the technician (e.g. preferred hours, roommate availability, or key handover):
          </p>

          <form onSubmit={handleSaveStudentNote} className="space-y-3">
            <input
              type="text"
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="e.g. I am attending lectures until 4 PM; please visit between 4:30 PM - 7:00 PM."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-medium">
                {noteSaved && '✓ Note registered for visiting technician'}
              </span>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
              >
                Save Availability Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Safety Advisory & Warden Escalation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">{advisory.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{advisory.tip}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            Need urgent assistance or experiencing delayed response?
          </span>
          <button
            onClick={() => setShowContactModal(true)}
            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>Hostel Warden & Emergency Contacts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contact Helpdesk Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                Hostel Maintenance & Caretaker Contacts
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Hostel Maintenance Helpline</span>
                  <span className="text-slate-400 text-[11px]">24/7 Operations Desk</span>
                </div>
                <a
                  href="tel:+919876543210"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold"
                >
                  +91 98765 43210
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Hostel Warden Office</span>
                  <span className="text-slate-400 text-[11px]">{complaint.room.floor.block.hostel.name}</span>
                </div>
                <a
                  href="tel:+919812345678"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold"
                >
                  +91 98123 45678
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Supervisor Emergency Desk</span>
                  <span className="text-slate-400 text-[11px]">Campus Electrical & Water Supply</span>
                </div>
                <a
                  href="tel:+919898989898"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold"
                >
                  +91 98989 89898
                </a>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
