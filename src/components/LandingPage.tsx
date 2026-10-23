import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Bot,
  ArrowRight,
  LifeBuoy,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
  MessageSquare,
  FileText,
  PlusCircle,
  TrendingDown,
  Eye,
  Check,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';

export const LandingPage: React.FC<{
  onOpenAuth: () => void;
  onOpenNewTicket: () => void;
}> = ({ onOpenAuth, onOpenNewTicket }) => {
  const { currentUser, setActivePage, isDarkMode, toggleDarkMode } = useApp();

  return (
    <div id="landing-page" className="min-h-screen bg-[#f4f4f2] text-[#262523] overflow-x-hidden font-sans">
      {/* Top Header — Harmonized with the warm stone page canvas */}
      <header className="sticky top-0 z-20 border-b border-[#e4dfd7] bg-[#f4f4f2]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#ebe3da] border border-[#d6c2b0] text-[#8c6d53]">
              <Bot className="size-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#262523]">TechnoResolve Desk</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="calm-btn flex items-center gap-1.5 rounded-xl bg-[#ebe9e4] hover:bg-[#e3dfd8] border border-[#d6d1c7] px-3 py-2 text-xs font-semibold text-[#5c5954] hover:text-[#262523] transition-all cursor-pointer"
            >
              {isDarkMode ? (
                <>
                  <Sun className="size-3.5 text-[#8c6d53]" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="size-3.5 text-[#8c6d53]" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
            <button
              id="landing-signin-btn"
              onClick={() => (currentUser ? setActivePage('dashboard') : onOpenAuth())}
              className="rounded-xl bg-[#8c6d53] hover:bg-[#765a43] px-5 py-2 text-xs font-semibold text-white transition-all cursor-pointer calm-btn"
            >
              {currentUser ? 'Open Support Portal' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-16">
        {/* 1. HERO SECTION */}
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-16 calm-fade-slide">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#ebe3da] px-3.5 py-1 text-xs font-semibold text-[#6e533c] border border-[#d6c2b0]">
            <Sparkles className="size-3.5 text-[#8c6d53]" />
            AI Ticket Classification & Support Desk
          </span>

          <h1 className="text-4xl md:text-6xl leading-[1.1] font-bold tracking-tight text-[#262523]">
            Calm, Streamlined IT Service & Support
          </h1>

          <p className="text-base md:text-lg text-[#5c5954] leading-relaxed max-w-2xl mx-auto">
            Submit requests in seconds, get instant step-by-step guidance from the AI Helpdesk Assistant, and track your ticket resolution in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="hero-get-started-btn"
              onClick={() => (currentUser ? setActivePage('dashboard') : onOpenAuth())}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] px-7 py-3.5 text-sm font-semibold text-white transition-all cursor-pointer calm-btn"
            >
              <span>{currentUser ? 'Go to My Portal' : 'Access Support Portal'}</span>
              <ArrowRight className="size-4" />
            </button>
            <button
              id="hero-submit-request-btn"
              onClick={onOpenNewTicket}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6c2b0] bg-[#ebe3da]/70 hover:bg-[#ebe3da] px-7 py-3.5 text-sm font-semibold text-[#6e533c] transition-all cursor-pointer calm-btn"
            >
              <span>Submit a Request</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-[#5c5954]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-[#2f6b45]" />
              Zero setup required
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="size-4 text-[#8c6d53]" />
              Private ticket conversations
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="size-4 text-[#8c6d53]" />
              Automated AI Triage
            </span>
          </div>
        </div>

        {/* 2. HOW IT WORKS PIPELINE */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold font-mono tracking-widest uppercase bg-[#ebe9e4] text-[#5c5954] border border-[#e2dfd9] px-3 py-1 rounded-full">
              Automated Lifecycle
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#262523] mt-3">
              How It Works
            </h2>
            <p className="text-[#5c5954] text-sm max-w-xl mx-auto mt-1.5">
              From submission to resolution in three clear, automated steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover">
              <div className="size-10 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] flex items-center justify-center text-[#8c6d53] text-base font-bold mb-4">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-[#262523] mb-1.5">
                  Simple Request Submission
                </h3>
                <p className="text-[#5c5954] text-xs leading-relaxed">
                  Describe your issue using text or voice input, or attach screenshots directly from your support portal.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-[#ebe9e4] flex items-center gap-2 text-xs text-[#6e533c] font-semibold">
                <FileText className="size-3.5 text-[#8c6d53]" />
                <span>Fast, distraction-free intake</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover">
              <div className="size-10 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] flex items-center justify-center text-[#8c6d53] text-base font-bold mb-4">
                2
              </div>
              <div>
                <h3 className="text-base font-bold text-[#262523] mb-1.5">
                  Automated AI Triage
                </h3>
                <p className="text-[#5c5954] text-xs leading-relaxed">
                  Your request is automatically categorized and routed to the right specialist team without manual sorting delays.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-[#ebe9e4] flex items-center gap-2 text-xs text-[#6e533c] font-semibold">
                <Bot className="size-3.5 text-[#8c6d53]" />
                <span>Instant smart routing</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover">
              <div className="size-10 rounded-xl bg-[#e6f4ea] border border-[#c6e6d0] flex items-center justify-center text-[#2f6b45] text-base font-bold mb-4">
                3
              </div>
              <div>
                <h3 className="text-base font-bold text-[#262523] mb-1.5">
                  Real-Time Resolution & Chat
                </h3>
                <p className="text-[#5c5954] text-xs leading-relaxed">
                  Communicate directly on your ticket thread and receive live updates until your issue is resolved.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-[#ebe9e4] flex items-center gap-2 text-xs text-[#2f6b45] font-semibold">
                <MessageSquare className="size-3.5 text-[#2f6b45]" />
                <span>Verified resolution tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CUSTOMER PORTAL CAPABILITIES */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold font-mono tracking-widest uppercase bg-[#ebe9e4] text-[#5c5954] border border-[#e2dfd9] px-3 py-1 rounded-full">
              Self-Service Experience
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#262523] mt-3">
              Everything You Need in One Support Portal
            </h2>
            <p className="text-[#5c5954] text-sm max-w-xl mx-auto mt-1.5">
              Designed for clarity and speed so you can resolve technical issues without clutter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover">
              <div>
                <div className="size-11 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#8c6d53] flex items-center justify-center mb-5">
                  <LifeBuoy className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#262523] mb-2">
                  Self-Service Ticket Portal
                </h3>
                <p className="text-[#5c5954] text-xs leading-relaxed mb-5">
                  Log hardware, software, access, or billing requests and monitor live progress in one clean view.
                </p>

                <ul className="space-y-2.5 text-xs text-[#262523]">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>One-click category shortcuts for common issues</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>Voice-to-text dictation and file attachments</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>Live status updates from Open to Resolved</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#ebe9e4]">
                <button
                  onClick={onOpenNewTicket}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white text-xs font-semibold transition-all cursor-pointer calm-btn"
                >
                  <PlusCircle className="size-4" />
                  <span>Submit a Request</span>
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover">
              <div>
                <div className="size-11 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#8c6d53] flex items-center justify-center mb-5">
                  <Bot className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#262523] mb-2">
                  24/7 AI Helpdesk Assistant
                </h3>
                <p className="text-[#5c5954] text-xs leading-relaxed mb-5">
                  Troubleshoot Wi-Fi, VPN, MFA, and software questions immediately with guided interactive steps.
                </p>

                <ul className="space-y-2.5 text-xs text-[#262523]">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>Instant answers from verified IT policies</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>Step-by-step self-service troubleshooting</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>Seamless escalation to a support ticket if needed</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#ebe9e4]">
                <button
                  onClick={() => (currentUser ? setActivePage('dashboard') : onOpenAuth())}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f4f4f2] hover:bg-[#f5efe8] border border-[#e2dfd9] text-[#6e533c] text-xs font-semibold transition-all cursor-pointer calm-btn"
                >
                  <HelpCircle className="size-4 text-[#8c6d53]" />
                  <span>Ask Helpdesk Assistant</span>
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover">
              <div>
                <div className="size-11 rounded-xl bg-[#e6f4ea] border border-[#c6e6d0] text-[#2f6b45] flex items-center justify-center mb-5">
                  <MessageSquare className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#262523] mb-2">
                  Direct Support Messaging
                </h3>
                <p className="text-[#5c5954] text-xs leading-relaxed mb-5">
                  Keep all replies, diagnostic logs, and resolution notes organized inside each ticket conversation.
                </p>

                <ul className="space-y-2.5 text-xs text-[#262523]">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>Real-time chat thread for every support ticket</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>Share screenshots and diagnostic documents</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#2f6b45] shrink-0 mt-0.5" />
                    <span>Clear SLA and resolution notifications</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-[#ebe9e4]">
                <button
                  onClick={() => (currentUser ? setActivePage('dashboard') : onOpenAuth())}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f4f4f2] hover:bg-[#f5efe8] border border-[#e2dfd9] text-[#6e533c] text-xs font-semibold transition-all cursor-pointer calm-btn"
                >
                  <ArrowRight className="size-4 text-[#8c6d53]" />
                  <span>Sign In to View Tickets</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OPERATIONAL IMPACT SUMMARY BAR */}
        <div className="mb-16 rounded-2xl bg-white border border-[#e2dfd9] p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#ebe9e4]">
            <div className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-4 first:pl-0">
              <div className="size-10 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#8c6d53] grid place-items-center shrink-0">
                <Bot className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#262523]">Automated Triage</h4>
                <p className="text-[#5c5954] text-xs mt-0.5 leading-relaxed">
                  Instant AI-driven categorization on every submitted ticket.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-6">
              <div className="size-10 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#8c6d53] grid place-items-center shrink-0">
                <TrendingDown className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#262523]">Faster Resolution</h4>
                <p className="text-[#5c5954] text-xs mt-0.5 leading-relaxed">
                  Guided self-service and direct specialist routing reduce wait times.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 pt-4 md:pt-0 md:px-6 last:pr-0">
              <div className="size-10 rounded-xl bg-[#e6f4ea] border border-[#c6e6d0] text-[#2f6b45] grid place-items-center shrink-0">
                <Eye className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#262523]">Clear Status Tracking</h4>
                <p className="text-[#5c5954] text-xs mt-0.5 leading-relaxed">
                  Transparent updates from ticket creation through final resolution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM CALL-TO-ACTION */}
        <div className="rounded-2xl bg-[#f5efe8] border border-[#d6c2b0] p-8 md:p-12 text-center max-w-4xl mx-auto">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-4xl font-bold text-[#262523] tracking-tight">
              Need Assistance With an IT Issue?
            </h2>
            <p className="text-[#5c5954] text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Sign in to your support portal to track your requests or submit a new ticket in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="cta-launch-desk-btn"
                onClick={() => (currentUser ? setActivePage('dashboard') : onOpenAuth())}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] px-7 py-3.5 text-sm font-semibold text-white transition-all cursor-pointer calm-btn"
              >
                <span>{currentUser ? 'Open Support Portal' : 'Sign In to Portal'}</span>
                <ArrowRight className="size-4" />
              </button>
              <button
                id="cta-submit-request-btn"
                onClick={onOpenNewTicket}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6c2b0] bg-white hover:bg-[#f4f4f2] px-7 py-3.5 text-sm font-semibold text-[#6e533c] transition-all cursor-pointer calm-btn"
              >
                <span>Submit a Request</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e4dfd7] bg-[#efede8] py-8 text-center text-[#8c8881]">
        <p className="text-xs font-medium">
          © {new Date().getFullYear()} TechnoResolve Desk. Customer Support & Helpdesk Portal.
        </p>
      </footer>
    </div>
  );
};
