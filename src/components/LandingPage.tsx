import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Bot,
  ArrowRight,
  ShieldCheck,
  LifeBuoy,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
  Zap,
  Clock,
  BarChart3,
  MessageSquare,
  SlidersHorizontal,
  FileText,
  PlusCircle,
  TrendingDown,
  Eye,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC<{
  onOpenAuth: () => void;
  onOpenNewTicket: () => void;
}> = ({ onOpenAuth, onOpenNewTicket }) => {
  const { tickets, currentUser, setActivePage } = useApp();

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;

  return (
    <div id="landing-page" className="min-h-screen bg-[#123333] text-white transition-colors duration-200 overflow-x-hidden font-sans selection:bg-[#00d492]/20">
      
      {/* Abstract Ambient Glow Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[55%] h-[55%] rounded-full bg-[#00d492]/10 blur-[130px]" />
        <div className="absolute top-[35%] -right-[10%] w-[45%] h-[45%] rounded-full bg-[#0f3b6c]/30 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-[#00d492]/5 blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 bg-[#123333] text-white border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            style={{ borderColor: '#000000', color: '#000000', backgroundColor: '#ffffff' }}
            className="grid size-10 place-items-center rounded-xl bg-white border border-black text-black shadow-md font-bold overflow-hidden"
          >
            <Bot style={{ height: '40px', width: '40px' }} className="size-10 text-black p-1" />
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-white">TechnoResolve Desk</span>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <button
            id="landing-signin-btn"
            onClick={() => currentUser ? setActivePage('dashboard') : onOpenAuth()}
            style={{ color: '#000000' }}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-slate-100 shadow-sm cursor-pointer"
          >
            {currentUser ? 'Dashboard' : 'Sign in'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{ borderColor: '#585454' }}
        className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-12 md:pt-16 bg-[#123333]"
      >
        
        {/* ================= 1. HERO SECTION ================= */}
        <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Pill style badge */}
            <span
              style={{ backgroundColor: '#ffffff', color: '#ffffff' }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-white border border-white/20 shadow-sm mb-6"
            >
              <Sparkles style={{ color: '#ffffff' }} className="size-4 text-white" />
              ✦ AI ticket classification built in
            </span>

            {/* Hero Heading */}
            <h1 className="text-5xl md:text-7xl leading-[1.08] font-extrabold tracking-tight text-white font-display">
              Smart IT Service Management
            </h1>

            {/* Hero Subheading */}
            <p className="mt-6 text-lg md:text-xl text-slate-200 leading-relaxed max-w-3xl mx-auto font-medium">
              TechnoResolve automates ticket classification and priority routing in real time. Seamlessly connect users, support technicians, and IT managers in one centralized operational system.
            </p>
          </motion.div>

          {/* Primary Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <button
              id="hero-get-started-btn"
              onClick={onOpenAuth}
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition-all hover:bg-slate-100 shadow-md cursor-pointer"
            >
              <span style={{ color: '#000000' }} className="text-black">Launch Desk</span>
              <ArrowRight className="size-4 text-black" />
            </button>
            <button
              id="hero-submit-request-btn"
              onClick={onOpenNewTicket}
              style={{ backgroundColor: '#fbfafa', color: '#000000' }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 py-4 text-base font-bold transition-all hover:bg-white shadow-md cursor-pointer"
            >
              <span style={{ color: '#000000' }} className="text-black font-extrabold">Submit a request</span>
            </button>
          </motion.div>

          {/* Trust points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 pt-6 text-sm font-semibold text-white/90"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 style={{ color: '#000000' }} className="size-4.5 text-black" />
              Zero setup required
            </span>
            <span className="flex items-center gap-2">
              <Lock style={{ color: '#000000' }} className="size-4.5 text-black" />
              Role-based access control
            </span>
            <span className="flex items-center gap-2">
              <Layers style={{ color: '#000000' }} className="size-4.5 text-black" />
              Gemini AI Triage Engine
            </span>
          </motion.div>
        </div>

        {/* ================= 2. "HOW IT WORKS" PIPELINE (3-Step Pipeline) ================= */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <span
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              className="text-xs font-bold font-mono tracking-widest uppercase bg-white text-black border border-white/20 px-3 py-1 rounded-full shadow-sm"
            >
              Automated Lifecycle
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white font-display mt-3">
              How It Works
            </h2>
            <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mt-2">
              From submission to resolution in three streamlined, automated steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-3xl bg-[#ffffff] text-[#123333] border border-white p-7 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className="size-12 rounded-2xl bg-[#ffffff] border border-slate-200 shadow-sm flex items-center justify-center text-[#123333] font-display text-xl font-bold mb-5">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#123333] font-display mb-2">
                  Smart Request Submission
                </h3>
                <p className="text-[#123333]/85 text-sm leading-relaxed">
                  End users log incidents via the simple self-service portal with zero training needed.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs text-[#123333] font-semibold">
                <FileText className="size-4 text-[#123333]" />
                <span className="text-[#123333]">Zero-friction intake</span>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-3xl bg-[#ffffff] text-[#123333] border border-slate-200 p-7 shadow-xl relative overflow-hidden flex flex-col justify-between ring-1 ring-[#123333]/10"
            >
              <div
                style={{ borderColor: '#ffffff' }}
                className="size-12 rounded-2xl bg-[#ffffff] border border-white text-[#123333] flex items-center justify-center font-display text-xl font-extrabold mb-5 shadow-sm"
              >
                2
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[#123333] text-[11px] font-bold uppercase mb-2 border border-slate-200">
                  <Sparkles className="size-3 text-[#123333]" /> AI Powered
                </div>
                <h3 className="text-xl font-bold text-[#123333] font-display mb-2">
                  Automated AI Triage
                </h3>
                <p className="text-[#123333]/85 text-sm leading-relaxed">
                  The AI engine categorizes requests, assigns priority levels (<span className="text-emerald-600 font-semibold">Low</span>, <span className="text-[#ffb050] font-semibold">Medium</span>, <span className="text-rose-600 font-semibold">Urgent</span>), and directs tickets to dedicated queues.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs text-[#123333] font-semibold">
                <Bot className="size-4 text-[#123333]" />
                <span className="text-[#123333]">Instant classification</span>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-3xl bg-[#ffffff] text-[#123333] border border-white p-7 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className="size-12 rounded-2xl bg-[#ffffff] border border-slate-200 shadow-sm flex items-center justify-center text-[#123333] font-display text-xl font-bold mb-5">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#123333] font-display mb-2">
                  Rapid Resolution & Chat
                </h3>
                <p className="text-[#123333]/85 text-sm leading-relaxed">
                  Technicians take tickets, use quick replies, and resolve issues via real-time integrated chat.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs text-[#123333] font-semibold">
                <MessageSquare className="size-4 text-[#123333]" />
                <span className="text-[#123333]">Live technician collaboration</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ================= 3. CORE ROLE FEATURE BREAKDOWN (3-Card Grid) ================= */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <span
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              className="text-xs font-bold font-mono tracking-widest uppercase bg-white text-black border border-white/20 px-3 py-1 rounded-full shadow-sm"
            >
              Unified Ecosystem
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white font-display mt-3">
              Core Role Feature Breakdown
            </h2>
            <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mt-2">
              Three tailored, purpose-built interfaces connected into a single operational brain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: End-User Self-Service Storefront */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl bg-[#0c2424] border border-white/10 p-8 shadow-xl flex flex-col justify-between group hover:border-[#00d492]/40 transition-all"
            >
              <div>
                <div
                  style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000' }}
                  className="size-14 rounded-2xl bg-white border border-black text-black flex items-center justify-center mb-6 shadow-sm"
                >
                  <LifeBuoy className="size-7 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-white font-display mb-3">
                  End-User Self-Service Storefront
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Frictionless request logging and live status visibility for organization members.
                </p>

                <ul className="space-y-3.5 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      Instant ticket logging button (<strong className="text-white font-mono text-xs">+ Submit a new request</strong>)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      Real-time ticket history with live status badges
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      Transparent issue tracking without support blind spots
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={onOpenNewTicket}
                  style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000' }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-black text-black text-xs font-bold transition-all hover:bg-slate-100 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="size-4 text-black" />
                  <span className="text-black">Submit Sample Request</span>
                </button>
              </div>
            </motion.div>

            {/* Card 2: Technician Workspace */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl bg-[#0c2424] border border-white/10 p-8 shadow-xl flex flex-col justify-between group hover:border-[#00d492]/40 transition-all"
            >
              <div style={{ color: '#000000' }}>
                <div
                  style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000' }}
                  className="size-14 rounded-2xl bg-white border border-black text-black flex items-center justify-center mb-6 shadow-sm"
                >
                  <Zap className="size-7 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-white font-display mb-3">
                  Technician Workspace
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Speed-optimized queue execution with integrated AI resolution assistants.
                </p>

                <ul className="space-y-3.5 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      Filterable dynamic queues: <strong className="text-white font-mono text-xs">New</strong>, <strong className="text-white font-mono text-xs">Working</strong>, <strong className="text-white font-mono text-xs">Escalated</strong> with real-time counters
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      Rapid action buttons: <strong className="text-white font-mono text-xs">Take</strong>, <strong className="text-white font-mono text-xs">Escalate</strong>, and <strong className="text-white font-mono text-xs">Resolve</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      Integrated direct ticket messaging with quick response templates (<strong className="text-white font-mono text-xs">Acknowledge</strong>, <strong className="text-white font-mono text-xs">Need Info</strong>)
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={() => currentUser ? setActivePage('dashboard') : onOpenAuth()}
                  style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000' }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-black text-black text-xs font-bold transition-all hover:bg-slate-100 cursor-pointer shadow-sm"
                >
                  <SlidersHorizontal className="size-4 text-black" />
                  <span className="text-black">Open Tech Workspace</span>
                </button>
              </div>
            </motion.div>

            {/* Card 3: Admin Control Center */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-[#0c2424] border border-white/10 p-8 shadow-xl flex flex-col justify-between group hover:border-[#00d492]/40 transition-all"
            >
              <div>
                <div
                  style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000' }}
                  className="size-14 rounded-2xl bg-white border border-black text-black flex items-center justify-center mb-6 shadow-sm"
                >
                  <ShieldCheck className="size-7 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-white font-display mb-3">
                  Admin Control Center
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  End-to-end operational governance, audit logs, and team workload analytics.
                </p>

                <ul className="space-y-3.5 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      High-level metric cards: <strong className="text-white font-mono text-xs">Total requests ({totalTickets})</strong>, <strong className="text-white font-mono text-xs">Open workload ({openTickets})</strong>, and <strong className="text-white font-mono text-xs">Urgent ({urgentTickets})</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      Operational workload tracking and incident oversight
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div
                      style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                      className="size-5 rounded-md bg-white border border-black text-black grid place-items-center shrink-0 mt-0.5 shadow-sm"
                    >
                      <Check className="size-3.5 text-black" />
                    </div>
                    <span>
                      Role-switching selector to audit user, technician, and admin views seamlessly
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={() => currentUser ? setActivePage('dashboard') : onOpenAuth()}
                  style={{ backgroundColor: '#ffffff', color: '#000000', borderColor: '#000000' }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-black text-black text-xs font-bold transition-all hover:bg-slate-100 cursor-pointer shadow-sm"
                >
                  <BarChart3 className="size-4 text-black" />
                  <span className="text-black">Access Admin Control</span>
                </button>
              </div>
            </motion.div>

          </div>
        </div>

        {/* ================= 4. OPERATIONAL IMPACT SUMMARY BAR ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ color: '#ffffff', borderColor: '#7e7e7e', backgroundColor: '#0c2424' }}
          className="mb-24 rounded-3xl bg-[#0c2424] border border-[#7e7e7e] p-8 md:p-10 shadow-2xl relative overflow-hidden text-white"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00d492]/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {/* Metric 1 */}
            <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4 first:pl-0">
              <div
                style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                className="size-12 rounded-2xl bg-white border border-black text-black grid place-items-center shrink-0 shadow-sm"
              >
                <Bot className="size-6 text-black" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-display">Zero Manual Sorting</h4>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                  Instant AI-driven routing on intake.
                </p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="flex items-start gap-4 pt-6 md:pt-0 md:px-6">
              <div
                style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                className="size-12 rounded-2xl bg-white border border-black text-black grid place-items-center shrink-0 shadow-sm"
              >
                <TrendingDown className="size-6 text-black" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-display">Reduced MTTR</h4>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                  Direct ticket assignment and context-rich queues.
                </p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="flex items-start gap-4 pt-6 md:pt-0 md:px-6 last:pr-0">
              <div
                style={{ backgroundColor: '#ffffff', borderColor: '#000000', color: '#000000' }}
                className="size-12 rounded-2xl bg-white border border-black text-black grid place-items-center shrink-0 shadow-sm"
              >
                <Eye className="size-6 text-black" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-display">Full Operational Visibility</h4>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                  Unified control center across the entire team.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= 5. BOTTOM CALL-TO-ACTION ================= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-[#0c2424] via-[#123333] to-[#0c2424] border border-white/20 p-10 md:p-14 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white font-display tracking-tight">
              Ready to Streamline Your IT Operations?
            </h2>
            <p className="text-slate-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Access the live environment and switch between user, technician, and administrative roles.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                id="cta-launch-desk-btn"
                onClick={() => currentUser ? setActivePage('dashboard') : onOpenAuth()}
                style={{ backgroundColor: '#ffffff', color: '#123333' }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold transition-all hover:bg-slate-100 shadow-md cursor-pointer"
              >
                <span style={{ color: '#000000' }}>{currentUser ? 'Open Dashboard' : 'Launch Desk'}</span>
                <ArrowRight className="size-4 text-[#123333]" />
              </button>
              <button
                id="cta-submit-request-btn"
                onClick={onOpenNewTicket}
                style={{ backgroundColor: '#fbfafa', color: '#123333' }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 py-4 text-base font-bold transition-all hover:bg-white shadow-md cursor-pointer"
              >
                <span style={{ color: '#000000' }} className="text-black font-extrabold">Submit a Request</span>
              </button>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0c2424] py-10 text-center relative z-10 text-slate-400">
        <p className="text-sm font-medium">
          © {new Date().getFullYear()} TechnoResolve Desk. Powered by Gemini AI Triage Engine.
        </p>
      </footer>
    </div>
  );
};

