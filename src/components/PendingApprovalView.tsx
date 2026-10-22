import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

export const PendingApprovalView: React.FC = () => {
  const { currentUser, signOut } = useApp();

  const isRejected = currentUser?.rejected;

  return (
    <div
      id="pending-approval-view"
      className="min-h-screen w-full bg-[#f4f4f2] text-[#262523] flex flex-col justify-between relative overflow-hidden font-sans p-4 sm:p-6"
    >
      {/* Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-[#f5efe8] text-[#8c6d53] border border-[#d6c2b0] flex items-center justify-center font-bold text-xs">
            TR
          </div>
          <span className="text-sm font-bold text-[#262523] tracking-tight">TechnoResolve Desk</span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-xs text-[#5c5954] hover:text-[#262523] transition-colors px-3 py-1.5 rounded-lg border border-[#e2dfd9] bg-white hover:bg-[#ebe9e4] cursor-pointer"
        >
          <LogOut className="size-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Center card */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto">
        <div className="calm-fade-slide rounded-2xl border border-[#e2dfd9] bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div
            className={`size-14 rounded-2xl mx-auto grid place-items-center border ${
              isRejected
                ? 'bg-[#f4f4f2] border-[#d5d1c8] text-[#5c5954]'
                : 'bg-[#f5efe8] border-[#d6c2b0] text-[#8c6d53]'
            }`}
          >
            {isRejected ? (
              <AlertTriangle className="size-7" />
            ) : (
              <Clock className="size-7" />
            )}
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-bold text-[#262523] tracking-tight">
              {isRejected ? 'Registration Declined' : 'Account Verification Pending'}
            </h2>
            <p className="text-xs text-[#5c5954] leading-relaxed">
              {isRejected
                ? 'Your registration request could not be activated at this time.'
                : 'Your customer support account has been registered and is awaiting activation. You will gain access to your support portal as soon as your account is approved.'}
            </p>
          </div>

          {/* User profile recap */}
          <div className="rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[#5c5954]">
              <span>Full Name:</span>
              <span className="font-semibold text-[#262523]">{currentUser?.full_name}</span>
            </div>
            <div className="flex items-center justify-between text-[#5c5954]">
              <span>Email Address:</span>
              <span className="font-semibold text-[#262523] font-mono">{currentUser?.email}</span>
            </div>
            <div className="flex items-center justify-between text-[#5c5954] pt-2 border-t border-[#e2dfd9]">
              <span>Account Status:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#6e533c]">
                {isRejected ? 'Declined' : 'Pending Activation'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#c6e6d0] bg-[#e6f4ea] p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#2f6b45] font-semibold">
              <span className="size-2 rounded-full bg-[#2f6b45]"></span>
              <span>Live status sync active</span>
            </div>
            <p className="text-[11px] text-[#2f6b45]/80 mt-0.5">
              This page will open your support portal automatically once approved.
            </p>
          </div>

          <div className="text-center pt-1">
            <button
              onClick={() => signOut()}
              className="text-xs text-[#5c5954] hover:text-[#262523] underline cursor-pointer"
            >
              Sign out and return later
            </button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 max-w-4xl mx-auto w-full text-center text-xs text-[#8c8881]">
        TechnoResolve Desk · Customer Support Portal
      </footer>
    </div>
  );
};
