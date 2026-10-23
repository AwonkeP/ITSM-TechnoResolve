import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  useAnimatedCounter,
  useTypewriterCycle,
  animateCalmFadeSlide,
  triggerElementPop,
  handleCardSpotlightMove,
  handleCardSpotlightLeave,
  TicketTriageEngine,
} from '../utils/jsAnimations';
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
  Zap,
  Clock,
  ShieldCheck,
  Terminal,
  Play,
  Pause,
} from 'lucide-react';

const SAMPLE_SCENARIOS = [
  {
    id: 'vpn',
    label: 'VPN & MFA Lockout',
    prompt: 'Urgent: My VPN authenticator token expired and I am locked out before a client presentation.',
  },
  {
    id: 'hardware',
    label: 'MacBook Display Flicker',
    prompt: 'External monitor connected to my MacBook Pro dock keeps flickering and dropping audio.',
  },
  {
    id: 'software',
    label: 'Figma License Request',
    prompt: 'Need a Figma Enterprise editor license provisioned and added to our product design SSO group.',
  },
  {
    id: 'billing',
    label: 'Cloud Invoice & Billing',
    prompt: 'Please review the Q4 cloud subscription renewal invoice and update our department cost center.',
  },
];

const HERO_TYPEWRITER_PHRASES = [
  '“My VPN token expired before a client call...” → Routed to Identity Ops (2h SLA)',
  '“MacBook dock monitor is flickering...” → Routed to Endpoint Engineering (4h SLA)',
  '“Need Figma Enterprise seat provisioned...” → Routed to Application Support (8h SLA)',
  '“Verify Q4 cloud software renewal invoice...” → Routed to IT Finance & Licensing',
];

export const LandingPage: React.FC<{
  onOpenAuth: () => void;
  onOpenNewTicket: () => void;
}> = ({ onOpenAuth, onOpenNewTicket }) => {
  const { currentUser, setActivePage, isDarkMode, toggleDarkMode } = useApp();

  // 1. Live Typewriter in Hero
  const typewriterText = useTypewriterCycle(HERO_TYPEWRITER_PHRASES, 36, 18, 2400);

  // 2. Interactive AI Triage Simulator state (powered by TicketTriageEngine)
  const [simulatorInput, setSimulatorInput] = useState<string>(SAMPLE_SCENARIOS[0].prompt);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(SAMPLE_SCENARIOS[0].id);
  const [pipelineStage, setPipelineStage] = useState<number>(3);
  const triageCardRef = useRef<HTMLDivElement>(null);

  const triageResult = useMemo(() => {
    return TicketTriageEngine.evaluate(simulatorInput);
  }, [simulatorInput]);

  const animatedConfidence = useAnimatedCounter(triageResult.confidence, 380);
  const animatedSlaHours = useAnimatedCounter(triageResult.slaTargetHours, 380);

  // Animate pipeline stages whenever simulator input changes
  useEffect(() => {
    setPipelineStage(1);
    const t1 = setTimeout(() => setPipelineStage(2), 140);
    const t2 = setTimeout(() => setPipelineStage(3), 290);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [simulatorInput]);

  const handleSelectScenario = (scenario: (typeof SAMPLE_SCENARIOS)[0], btnEl: HTMLElement | null) => {
    triggerElementPop(btnEl);
    setActiveScenarioId(scenario.id);
    setSimulatorInput(scenario.prompt);
    animateCalmFadeSlide(triageCardRef.current);
  };

  // 3. Interactive Auto-Advancing "How It Works" Stepper
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAutoPlayingSteps, setIsAutoPlayingSteps] = useState<boolean>(true);
  const stepDetailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoPlayingSteps) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4200);
    return () => clearInterval(interval);
  }, [isAutoPlayingSteps]);

  useEffect(() => {
    animateCalmFadeSlide(stepDetailRef.current);
  }, [activeStep]);

  // 4. Live Hero Telemetry Counters
  const accuracyCounter = useAnimatedCounter(98, 700);
  const routingSpeedCounter = useAnimatedCounter(12, 700);
  const slaComplianceCounter = useAnimatedCounter(99, 700);

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
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-14">
        {/* 1. HERO SECTION */}
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-12 calm-fade-slide">
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

          {/* Live JavaScript Typewriter Stream Pill */}
          <div className="max-w-2xl mx-auto rounded-xl bg-[#efede8] border border-[#d6d1c7] px-4 py-2.5 flex items-center gap-2.5 text-left">
            <span className="size-2 rounded-full bg-[#2f6b45] shrink-0 animate-pulse" />
            <Terminal className="size-3.5 text-[#8c6d53] shrink-0" />
            <p className="text-xs font-mono text-[#5c5954] truncate flex-1">
              {typewriterText}
              <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-[#8c6d53] animate-pulse" />
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              id="hero-get-started-btn"
              onClick={(e) => {
                triggerElementPop(e.currentTarget);
                if (currentUser) setActivePage('dashboard');
                else onOpenAuth();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] px-7 py-3.5 text-sm font-semibold text-white transition-all cursor-pointer calm-btn"
            >
              <span>{currentUser ? 'Go to My Portal' : 'Access Support Portal'}</span>
              <ArrowRight className="size-4" />
            </button>
            <button
              id="hero-submit-request-btn"
              onClick={(e) => {
                triggerElementPop(e.currentTarget);
                onOpenNewTicket();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6c2b0] bg-[#ebe3da]/70 hover:bg-[#ebe3da] px-7 py-3.5 text-sm font-semibold text-[#6e533c] transition-all cursor-pointer calm-btn"
            >
              <span>Submit a Request</span>
            </button>
          </div>

          {/* Animated Live Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-3">
            <div className="rounded-xl bg-white border border-[#e2dfd9] px-3 py-2.5 text-center">
              <p className="text-lg md:text-xl font-bold text-[#262523] tabular-nums">{accuracyCounter}%</p>
              <p className="text-[11px] font-medium text-[#5c5954]">AI Triage Accuracy</p>
            </div>
            <div className="rounded-xl bg-white border border-[#e2dfd9] px-3 py-2.5 text-center">
              <p className="text-lg md:text-xl font-bold text-[#8c6d53] tabular-nums">&lt; {routingSpeedCounter}s</p>
              <p className="text-[11px] font-medium text-[#5c5954]">Specialist Routing</p>
            </div>
            <div className="rounded-xl bg-white border border-[#e2dfd9] px-3 py-2.5 text-center">
              <p className="text-lg md:text-xl font-bold text-[#2f6b45] tabular-nums">{slaComplianceCounter}%</p>
              <p className="text-[11px] font-medium text-[#5c5954]">SLA Target Met</p>
            </div>
          </div>
        </div>

        {/* 2. INTERACTIVE LIVE AI TRIAGE SIMULATOR (Powered by TicketTriageEngine) */}
        <section className="mb-16">
          <div className="rounded-2xl bg-[#efede8] border border-[#d6d1c7] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-bold font-mono uppercase tracking-wider text-[#6e533c] bg-[#ebe3da] border border-[#d6c2b0] px-3 py-1 rounded-full mb-2">
                  <Zap className="size-3 text-[#8c6d53]" />
                  Interactive Live Triage Engine
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#262523]">
                  Test Live Ticket Classification in Real Time
                </h2>
                <p className="text-xs md:text-sm text-[#5c5954] mt-0.5">
                  Select a sample IT scenario or type any support issue below to watch the triage engine classify and route it live.
                </p>
              </div>

              {/* Live 3-Stage Pipeline Indicator */}
              <div className="flex items-center gap-2 bg-white border border-[#e2dfd9] rounded-xl px-3.5 py-2 self-start">
                {[
                  { step: 1, label: '1. Parse' },
                  { step: 2, label: '2. Classify' },
                  { step: 3, label: '3. Route' },
                ].map((stage, idx) => {
                  const isDone = pipelineStage >= stage.step;
                  return (
                    <React.Fragment key={stage.step}>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                          isDone
                            ? stage.step === 3
                              ? 'bg-[#e6f4ea] text-[#2f6b45]'
                              : 'bg-[#f5efe8] text-[#6e533c]'
                            : 'text-[#8c8881]'
                        }`}
                      >
                        {stage.label}
                      </span>
                      {idx < 2 && <span className="text-[#8c8881] text-xs">→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Scenario Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-[#5c5954] mr-1">Try scenario:</span>
              {SAMPLE_SCENARIOS.map((sc) => {
                const isSelected = activeScenarioId === sc.id && simulatorInput === sc.prompt;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={(e) => handleSelectScenario(sc, e.currentTarget)}
                    className={`calm-btn rounded-xl px-3 py-1.5 text-xs font-semibold border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#8c6d53] text-white border-[#8c6d53]'
                        : 'bg-white text-[#5c5954] border-[#e2dfd9] hover:bg-[#f5efe8] hover:text-[#6e533c]'
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Input Area */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-white border border-[#e2dfd9] p-5">
                <div>
                  <label
                    htmlFor="live-triage-input"
                    className="block text-xs font-bold uppercase tracking-wider text-[#5c5954] mb-2"
                  >
                    Describe an IT Issue (Live Input)
                  </label>
                  <textarea
                    id="live-triage-input"
                    rows={4}
                    value={simulatorInput}
                    onChange={(e) => {
                      setActiveScenarioId('custom');
                      setSimulatorInput(e.target.value);
                    }}
                    placeholder="Type any hardware, software, access, or billing issue..."
                    className="w-full rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] p-3 text-sm text-[#262523] placeholder:text-[#8c8881] focus:outline-none focus:border-[#8c6d53] resize-none"
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-[#ebe9e4] flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#8c8881]">Signals:</span>
                    {triageResult.matchedSignals.map((sig) => (
                      <span
                        key={sig}
                        className="rounded-md bg-[#f5efe8] border border-[#d6c2b0] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#6e533c]"
                      >
                        #{sig}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={onOpenNewTicket}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#8c6d53] hover:bg-[#765a43] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer calm-btn"
                  >
                    <span>Open Ticket</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Live Triage Output Card */}
              <div
                ref={triageCardRef}
                className="lg:col-span-7 rounded-xl bg-white border border-[#e2dfd9] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#ebe9e4]">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-lg bg-[#f5efe8] border border-[#d6c2b0] text-[#8c6d53] grid place-items-center">
                        <Bot className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#262523]">Real-Time Triage Classification</p>
                        <p className="text-[11px] text-[#8c8881] font-mono">Engine: TicketTriageEngine.evaluate()</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] border border-[#c6e6d0] px-3 py-1 text-xs font-semibold text-[#2f6b45]">
                      <CheckCircle2 className="size-3.5 text-[#2f6b45]" />
                      <span className="tabular-nums">{animatedConfidence}% Match Confidence</span>
                    </span>
                  </div>

                  {/* Classification Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    <div className="rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] p-3">
                      <p className="text-[10px] font-mono uppercase text-[#8c8881]">Category</p>
                      <p className="text-xs font-bold text-[#262523] mt-1 capitalize">{triageResult.categoryLabel}</p>
                    </div>

                    <div className="rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] p-3">
                      <p className="text-[10px] font-mono uppercase text-[#8c8881]">Priority Level</p>
                      <p className="text-xs font-bold text-[#6e533c] mt-1 uppercase">{triageResult.priority}</p>
                    </div>

                    <div className="rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] p-3">
                      <p className="text-[10px] font-mono uppercase text-[#8c8881]">SLA Target</p>
                      <p className="text-xs font-bold text-[#2f6b45] mt-1 tabular-nums flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {animatedSlaHours} Hours
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] p-3">
                      <p className="text-[10px] font-mono uppercase text-[#8c8881]">Assigned Queue</p>
                      <p className="text-xs font-bold text-[#262523] mt-1 truncate">{triageResult.assignedTeam}</p>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#5c5954]">Automated Routing Confidence</span>
                      <span className="font-mono font-bold text-[#2f6b45] tabular-nums">{animatedConfidence}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#ebe9e4] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2f6b45] transition-all duration-300"
                        style={{ width: `${animatedConfidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#f5efe8] border border-[#d6c2b0] p-3 flex items-start gap-2.5">
                  <ShieldCheck className="size-4 text-[#8c6d53] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-[#6e533c]">Recommended Playbook: </span>
                    <span className="text-[#5c5954]">{triageResult.recommendedAction}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. INTERACTIVE HOW IT WORKS PIPELINE */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold font-mono tracking-widest uppercase bg-[#ebe9e4] text-[#5c5954] border border-[#d6d1c7] px-3 py-1 rounded-full">
                Automated Lifecycle
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#262523] mt-3">
                How It Works
              </h2>
              <p className="text-[#5c5954] text-sm max-w-xl mt-1">
                Click any stage below or watch the automated support lifecycle progress step by step.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAutoPlayingSteps((prev) => !prev)}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-[#ebe9e4] hover:bg-[#e3dfd8] border border-[#d6d1c7] px-3 py-1.5 text-xs font-semibold text-[#5c5954] cursor-pointer calm-btn"
            >
              {isAutoPlayingSteps ? (
                <>
                  <Pause className="size-3.5 text-[#8c6d53]" />
                  <span>Auto-Cycling Steps</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5 text-[#8c6d53]" />
                  <span>Resume Cycle</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                num: 1,
                title: 'Simple Request Submission',
                desc: 'Describe your issue using text or voice input, or attach screenshots directly from your support portal.',
                footer: 'Fast, distraction-free intake',
                icon: FileText,
                isResolvedStep: false,
              },
              {
                num: 2,
                title: 'Automated AI Triage',
                desc: 'Your request is automatically categorized and routed to the right specialist team without manual sorting delays.',
                footer: 'Instant smart routing',
                icon: Bot,
                isResolvedStep: false,
              },
              {
                num: 3,
                title: 'Real-Time Resolution & Chat',
                desc: 'Communicate directly on your ticket thread and receive live updates until your issue is resolved.',
                footer: 'Verified resolution tracking',
                icon: MessageSquare,
                isResolvedStep: true,
              },
            ].map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    setActiveStep(index);
                    setIsAutoPlayingSteps(false);
                  }}
                  onMouseMove={handleCardSpotlightMove}
                  onMouseLeave={handleCardSpotlightLeave}
                  className={`rounded-2xl bg-white p-6 flex flex-col justify-between cursor-pointer transition-all ${
                    isActive
                      ? step.isResolvedStep
                        ? 'border-2 border-[#2f6b45] shadow-sm'
                        : 'border-2 border-[#8c6d53] shadow-sm'
                      : 'border border-[#e2dfd9] opacity-90 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center text-base font-bold border ${
                          step.isResolvedStep
                            ? 'bg-[#e6f4ea] border-[#c6e6d0] text-[#2f6b45]'
                            : isActive
                            ? 'bg-[#8c6d53] border-[#8c6d53] text-white'
                            : 'bg-[#f5efe8] border-[#d6c2b0] text-[#8c6d53]'
                        }`}
                      >
                        {step.num}
                      </div>
                      {isActive && (
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            step.isResolvedStep
                              ? 'bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0]'
                              : 'bg-[#f5efe8] text-[#6e533c] border border-[#d6c2b0]'
                          }`}
                        >
                          Active Stage
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#262523] mb-1.5">{step.title}</h3>
                    <p className="text-[#5c5954] text-xs leading-relaxed">{step.desc}</p>
                  </div>

                  <div
                    className={`mt-5 pt-3.5 border-t border-[#ebe9e4] flex items-center gap-2 text-xs font-semibold ${
                      step.isResolvedStep ? 'text-[#2f6b45]' : 'text-[#6e533c]'
                    }`}
                  >
                    <Icon className={`size-3.5 ${step.isResolvedStep ? 'text-[#2f6b45]' : 'text-[#8c6d53]'}`} />
                    <span>{step.footer}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. CUSTOMER PORTAL CAPABILITIES (With 3D JavaScript Pointer Tilt) */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold font-mono tracking-widest uppercase bg-[#ebe9e4] text-[#5c5954] border border-[#d6d1c7] px-3 py-1 rounded-full">
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
            <div
              onMouseMove={handleCardSpotlightMove}
              onMouseLeave={handleCardSpotlightLeave}
              className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover"
            >
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
            <div
              onMouseMove={handleCardSpotlightMove}
              onMouseLeave={handleCardSpotlightLeave}
              className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover"
            >
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
            <div
              onMouseMove={handleCardSpotlightMove}
              onMouseLeave={handleCardSpotlightLeave}
              className="rounded-2xl bg-white border border-[#e2dfd9] p-6 flex flex-col justify-between calm-card-hover"
            >
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

        {/* 5. OPERATIONAL IMPACT SUMMARY BAR */}
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

        {/* 6. BOTTOM CALL-TO-ACTION */}
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
