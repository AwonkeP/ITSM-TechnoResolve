import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  ShieldCheck,
  LogOut,
  MailCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';

export const PendingApprovalView: React.FC = () => {
  const { currentUser, signOut, users, switchDemoUser, setActivePage } = useApp();

  const isRejected = currentUser?.rejected;

  // Check if an admin exists that can approve them
  const adminUsers = users.filter((u) => u.role === 'admin' && u.is_approved);

  return (
    <div
      id="pending-approval-view"
      className="min-h-screen w-full bg-[#060f1e] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans p-4 sm:p-6"
    >
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            TR
          </div>
          <span className="text-sm font-bold text-white tracking-tight">TechnoResolve Desk</span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-900/50 cursor-pointer"
        >
          <LogOut className="size-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Center card */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#163666] bg-[#09172e]/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div
            className={`size-14 rounded-2xl mx-auto grid place-items-center shadow-inner ${
              isRejected
                ? 'bg-rose-950/80 border border-rose-500/30 text-rose-400'
                : 'bg-amber-950/80 border border-amber-500/30 text-amber-400'
            }`}
          >
            {isRejected ? (
              <AlertTriangle className="size-7" />
            ) : (
              <Clock className="size-7 animate-spin-slow" />
            )}
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isRejected ? 'Registration Rejected' : 'Awaiting Administrator Approval'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isRejected
                ? 'Your registration request was not approved by the system administrator.'
                : 'Your account is registered. An Administrator will review your request, activate your account, and assign your operational workspace role (Customer, Technician, or Admin).'}
            </p>
          </div>

          {/* User profile recap */}
          <div className="rounded-xl border border-[#142e56] bg-[#060f1e] p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Full Name:</span>
              <span className="font-semibold text-white">{currentUser?.full_name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Work Email:</span>
              <span className="font-semibold text-white font-mono">{currentUser?.email}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Requested Role:</span>
              <span className="font-bold text-cyan-400 uppercase tracking-wider">{currentUser?.role}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>Approval Status:</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${isRejected ? 'text-rose-400' : 'text-amber-400'}`}>
                {isRejected ? 'Rejected' : 'Pending Admin Role Assignment'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-950/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300 font-medium">
              <span className="size-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>Live Firestore synchronization active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              This window updates automatically as soon as an Admin approves your access.
            </p>
          </div>

          <div className="text-center pt-1 space-y-2">
            <button
              onClick={() => signOut()}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Sign out and return later
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 py-4 max-w-4xl mx-auto w-full text-center text-xs text-slate-500">
        TechnoResolve Desk · Security Gate & Mandatory Admin Approvals
      </footer>
    </div>
  );
};
