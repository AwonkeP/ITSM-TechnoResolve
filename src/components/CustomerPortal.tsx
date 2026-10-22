import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TicketCategory, Ticket } from '../types';
import { FAQ_ITEMS, getCategoryLabel } from '../data/seedData';
import {
  Home,
  Ticket as TicketIcon,
  Plus,
  Search,
  MessageSquare,
  HelpCircle,
  User as UserIcon,
  Bot,
  Bell,
  LogOut,
  ChevronRight,
  Laptop,
  Wifi,
  KeyRound,
  CreditCard,
  CheckCircle2,
  FileText,
  Shield,
  Sparkles,
  Pencil,
  Save,
  X,
  Phone,
  Building2,
  Mail,
} from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';
import { NewTicketModal } from './NewTicketModal';
import { TicketChatModal } from './TicketChatModal';
import { HelpdeskAssistant } from './HelpdeskAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimatedCounter, animateCalmFadeSlide, triggerElementPop } from '../utils/jsAnimations';

export const CustomerPortal: React.FC = () => {
  const {
    currentUser,
    tickets,
    signOut,
    unreadNotificationsCount,
    setIsNotificationCenterOpen,
    updateCurrentUserProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'home' | 'tickets' | 'account' | 'help'>('home');
  const [helpSubTab, setHelpSubTab] = useState<'assistant' | 'faq'>('assistant');
  const [searchQuery, setSearchQuery] = useState('');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<TicketCategory | undefined>();
  const [preselectedTitle, setPreselectedTitle] = useState<string | undefined>();
  const [preselectedDescription, setPreselectedDescription] = useState<string | undefined>();
  const [activeChatTicket, setActiveChatTicket] = useState<Ticket | null>(null);

  // Account Profile Editing State
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [editFullName, setEditFullName] = useState(currentUser?.full_name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editCompany, setEditCompany] = useState(currentUser?.company || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const accountCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentUser && !isEditingAccount) {
      setEditFullName(currentUser.full_name || '');
      setEditEmail(currentUser.email || '');
      setEditCompany(currentUser.company || '');
      setEditPhone(currentUser.phone || '');
    }
  }, [currentUser, isEditingAccount]);

  const handleStartEditAccount = () => {
    setEditFullName(currentUser?.full_name || 'Awonke Philibane');
    setEditEmail(currentUser?.email || 'philibaneawonke@gmail.com');
    setEditCompany(currentUser?.company || 'Acme Enterprise');
    setEditPhone(currentUser?.phone || '');
    setIsEditingAccount(true);
    animateCalmFadeSlide(accountCardRef.current);
  };

  const handleCancelEditAccount = () => {
    setEditFullName(currentUser?.full_name || '');
    setEditEmail(currentUser?.email || '');
    setEditCompany(currentUser?.company || '');
    setEditPhone(currentUser?.phone || '');
    setIsEditingAccount(false);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim() || !editEmail.trim()) return;
    setIsSavingAccount(true);
    try {
      const ok = await updateCurrentUserProfile({
        full_name: editFullName,
        email: editEmail,
        company: editCompany,
        phone: editPhone,
      });
      if (ok) {
        setIsEditingAccount(false);
        triggerElementPop(accountCardRef.current);
      }
    } finally {
      setIsSavingAccount(false);
    }
  };

  const tabContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    animateCalmFadeSlide(tabContainerRef.current);
  }, [activeTab, helpSubTab]);

  const handleOpenNewTicket = (prefill?: {
    category?: TicketCategory;
    title?: string;
    description?: string;
  }) => {
    setPreselectedCategory(prefill?.category);
    setPreselectedTitle(prefill?.title);
    setPreselectedDescription(prefill?.description);
    setIsNewTicketOpen(true);
  };

  // Tickets for current user (Admins inspecting Customer Portal have access to all tickets; Customers only see their own)
  const myTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (!currentUser) return false;
      if (currentUser.role === 'admin') return true;
      return t.requester_id === currentUser.id || t.requester_email === currentUser.email;
    });
  }, [tickets, currentUser]);

  // Filtered recent tickets on home when typing in home search bar
  const filteredHomeTickets = useMemo(() => {
    if (!homeSearchQuery.trim()) return myTickets.slice(0, 5);
    const q = homeSearchQuery.toLowerCase();
    return myTickets
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [myTickets, homeSearchQuery]);

  // Quiet JavaScript requestAnimationFrame Counters
  const totalTicketsCount = useAnimatedCounter(myTickets.length, 400);
  const inProgressCount = useAnimatedCounter(
    myTickets.filter((t) => t.status === 'in_progress' || t.status === 'new' || t.status === 'escalated').length,
    400
  );
  const resolvedTicketsCount = useAnimatedCounter(
    myTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
    400
  );

  // Filter FAQ items
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_ITEMS;
    const q = searchQuery.toLowerCase();
    return FAQ_ITEMS.filter(
      (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Light green strictly for resolved/success; calm warm brown/grey for active states
  const getStatusPill = (status: string) => {
    if (status === 'resolved' || status === 'closed') {
      return (
        <span className="rounded-md bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] px-2.5 py-0.5 text-xs font-semibold">
          Resolved
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="rounded-md bg-[#f5efe8] text-[#6e533c] border border-[#e3d5c5] px-2.5 py-0.5 text-xs font-semibold">
          In Progress
        </span>
      );
    }
    if (status === 'escalated') {
      return (
        <span className="rounded-md bg-[#ebe5df] text-[#5c4433] border border-[#d6c7b8] px-2.5 py-0.5 text-xs font-semibold">
          Escalated
        </span>
      );
    }
    return (
      <span className="rounded-md bg-[#ebe9e4] text-stone-700 border border-[#dad7d0] px-2.5 py-0.5 text-xs font-medium">
        Open
      </span>
    );
  };

  const userName = currentUser?.full_name?.split(' ')[0] || 'Awonke';

  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeSearchQuery.trim()) return;
    setSearchQuery(homeSearchQuery);
    setActiveTab('help');
    setHelpSubTab('faq');
  };

  return (
    <div id="customer-portal" className="min-h-screen bg-[#f4f4f2] text-stone-800 flex flex-col font-sans">
      {/* Top Header - Calm White & Stone */}
      <header className="sticky top-0 z-30 border-b border-[#e2dfd9] bg-white text-stone-800">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#f5efe8] text-[#8c6d53] border border-[#e3d5c5]">
              <Bot className="size-5 text-[#8c6d53]" />
            </div>
            <span className="font-bold text-stone-800 text-base tracking-tight whitespace-nowrap shrink-0">
              TechnoResolve Desk
            </span>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f4f4f2] p-1 rounded-full border border-[#e2dfd9]">
            {[
              { id: 'home', label: 'Home', icon: Home },
              {
                id: 'tickets',
                label: `My Tickets${myTickets.length > 0 ? ` (${myTickets.length})` : ''}`,
                icon: TicketIcon,
              },
              { id: 'account', label: 'Account', icon: UserIcon },
              { id: 'help', label: 'Help Centre', icon: HelpCircle },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`calm-btn flex items-center gap-2 px-4 py-1.5 text-xs rounded-full cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#8c6d53] text-white font-semibold shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/70 font-medium'
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? 'text-white' : 'text-[#8c6d53]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              title="Notifications"
              className="calm-btn relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-[#f4f4f2] border border-transparent hover:border-[#e2dfd9] cursor-pointer"
            >
              <Bell className="size-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 size-4 rounded-full bg-[#8c6d53] text-white text-[10px] font-bold grid place-items-center tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Role Switcher (Admin Only) */}
            {currentUser?.role === 'admin' && <RoleSwitcher />}

            {/* Sign Out Button */}
            <button
              onClick={signOut}
              className="calm-btn flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-[#f4f4f2] cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">Sign out</span>
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around border-t border-[#e2dfd9] bg-[#fafaf9] px-3 py-2 text-xs">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'tickets', label: `Tickets (${myTickets.length})`, icon: TicketIcon },
            { id: 'account', label: 'Account', icon: UserIcon },
            { id: 'help', label: 'Help', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`calm-btn flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-full whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#8c6d53] text-white font-semibold'
                    : 'text-stone-600 hover:bg-[#ebe9e4]'
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? 'text-white' : 'text-[#8c6d53]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content View Container */}
      <main ref={tabContainerRef} className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 md:py-10">
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-7"
            >
              {/* Header / Search */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                      Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {userName}
                    </h1>
                    <p className="text-xs text-stone-600 mt-1">
                      Submit a support request or check the status of your open tickets.
                    </p>
                  </div>

                  {/* Calm Counter Summary Strip */}
                  <div className="flex items-center gap-3 bg-white border border-[#e2dfd9] rounded-xl px-4 py-2">
                    <div className="text-center px-1.5">
                      <p className="text-base font-bold text-stone-800 tabular-nums">{totalTicketsCount}</p>
                      <p className="text-[10px] font-medium text-stone-500">Total</p>
                    </div>
                    <div className="h-6 w-px bg-[#e2dfd9]" />
                    <div className="text-center px-1.5">
                      <p className="text-base font-bold text-[#8c6d53] tabular-nums">{inProgressCount}</p>
                      <p className="text-[10px] font-medium text-stone-500">Active</p>
                    </div>
                    <div className="h-6 w-px bg-[#e2dfd9]" />
                    <div className="text-center px-1.5">
                      <p className="text-base font-bold text-[#2f6b45] tabular-nums">{resolvedTicketsCount}</p>
                      <p className="text-[10px] font-medium text-stone-500">Resolved</p>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleHomeSearchSubmit} className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="size-4.5 text-stone-400 group-focus-within:text-[#8c6d53] transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={homeSearchQuery}
                    onChange={(e) => setHomeSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#e2dfd9] rounded-xl py-3 pl-11 pr-24 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8c6d53]/20 focus:border-[#8c6d53] transition-all"
                    placeholder="Filter your tickets or search the knowledge base..."
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    {homeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setHomeSearchQuery('')}
                        className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="submit"
                      className="calm-btn bg-[#f4f4f2] hover:bg-[#ebe9e4] text-stone-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e2dfd9] cursor-pointer"
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>

              {/* Category Shortcuts - Unified Calm White & Light Brown */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Category Shortcuts
                  </h2>
                  <span className="text-xs text-stone-500 hidden sm:inline">
                    Select a category to open a pre-filled request
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      category: 'hardware' as TicketCategory,
                      title: 'Hardware',
                      sub: 'Devices & Peripherals',
                      icon: Laptop,
                    },
                    {
                      category: 'software' as TicketCategory,
                      title: 'Software',
                      sub: 'Apps & Licensing',
                      icon: Wifi,
                    },
                    {
                      category: 'access' as TicketCategory,
                      title: 'Access',
                      sub: 'Passwords & VPN',
                      icon: KeyRound,
                    },
                    {
                      category: 'billing' as TicketCategory,
                      title: 'Billing',
                      sub: 'Invoices & Accounts',
                      icon: CreditCard,
                    },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.category}
                        onClick={() => {
                          setPreselectedCategory(card.category);
                          setIsNewTicketOpen(true);
                        }}
                        className="calm-card-hover bg-white border border-[#e2dfd9] rounded-xl p-4 flex flex-col items-start gap-3 group text-left cursor-pointer"
                      >
                        <div className="p-2.5 rounded-lg bg-[#f5efe8] text-[#8c6d53] group-hover:bg-[#8c6d53] group-hover:text-white transition-colors duration-150">
                          <Icon className="size-4.5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-stone-800 text-sm">{card.title}</h3>
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{card.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Action & Calm AI Triage Card */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <button
                  onClick={() => {
                    setPreselectedCategory(undefined);
                    setIsNewTicketOpen(true);
                  }}
                  className="calm-card-hover sm:col-span-2 bg-[#8c6d53] hover:bg-[#765a43] text-white rounded-xl p-5 flex flex-col justify-center items-center gap-2 border border-[#765a43] cursor-pointer"
                >
                  <Plus className="size-5 stroke-[2.5] text-white" />
                  <span className="font-semibold text-sm text-white">Add New Ticket</span>
                </button>

                <div className="sm:col-span-3 bg-[#f5efe8] border border-[#e3d5c5] rounded-xl p-5 text-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                      <Sparkles className="size-4 text-[#8c6d53]" /> Automated Triage Active
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-[260px]">
                      Requests are quietly categorized and routed to the appropriate support specialist.
                    </p>
                  </div>
                  <div className="shrink-0 text-[#8c6d53]/40">
                    <Bot className="size-10 sm:size-12" />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Recent Activity {homeSearchQuery && `· Filtered (${filteredHomeTickets.length})`}
                  </h2>
                  <button
                    onClick={() => setActiveTab('tickets')}
                    className="text-xs font-semibold text-[#8c6d53] hover:text-[#6e533c] cursor-pointer flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {filteredHomeTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setActiveChatTicket(ticket)}
                      className="calm-card-hover bg-white border border-[#e2dfd9] rounded-xl p-4 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="space-y-1 pr-4">
                        <h3 className="font-semibold text-stone-800 text-sm group-hover:text-[#8c6d53] transition-colors">
                          {ticket.title}
                        </h3>
                        <p className="text-xs text-stone-500 tabular-nums">
                          <span className="font-mono font-medium text-stone-600">{ticket.id}</span> ·{' '}
                          {getCategoryLabel(ticket.category)} ·{' '}
                          {new Date(ticket.created_at).toISOString().slice(0, 10).replace(/-/g, '/')}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        {getStatusPill(ticket.status)}
                        <ChevronRight className="size-4 text-stone-400 group-hover:text-[#8c6d53] transition-colors" />
                      </div>
                    </div>
                  ))}

                  {filteredHomeTickets.length === 0 && (
                    <div className="bg-white border border-[#e2dfd9] rounded-xl p-8 text-center text-stone-500">
                      <FileText className="size-7 mx-auto text-stone-400 mb-2" />
                      <p className="text-sm font-semibold text-stone-800">
                        {homeSearchQuery ? `No tickets matching "${homeSearchQuery}"` : 'No requests yet'}
                      </p>
                      <p className="text-xs mt-1">
                        {homeSearchQuery
                          ? 'Try clearing your filter or press Enter to search the Knowledge Base.'
                          : 'Submit your first request above to get help from our support team.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* MY TICKETS TAB */}
          {activeTab === 'tickets' && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#e2dfd9]">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">My Tickets</h1>
                  <p className="text-xs text-stone-500">
                    Review progress and communicate with your assigned technician
                  </p>
                </div>
                <button
                  onClick={() => setIsNewTicketOpen(true)}
                  className="calm-btn inline-flex items-center gap-1.5 rounded-lg bg-[#8c6d53] px-4 py-2 text-xs font-semibold text-white hover:bg-[#765a43] cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>New Ticket</span>
                </button>
              </div>

              <div className="space-y-3">
                {myTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setActiveChatTicket(ticket)}
                    className="calm-card-hover bg-white border border-[#e2dfd9] rounded-xl p-5 cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-semibold text-stone-500 tabular-nums">
                            {ticket.id}
                          </span>
                          {getStatusPill(ticket.status)}
                          <span className="text-xs text-stone-500">
                            · {getCategoryLabel(ticket.category)}
                          </span>
                        </div>
                        <h2 className="text-base font-semibold text-stone-900">{ticket.title}</h2>
                      </div>
                      <span className="text-xs text-stone-400 tabular-nums">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="pt-3 border-t border-[#f0eee9] flex items-center justify-between text-xs text-stone-500">
                      <span>
                        Priority: <strong className="capitalize text-stone-700">{ticket.priority}</strong>
                        {ticket.assigned_name && (
                          <span className="ml-3">
                            Agent: <strong className="text-stone-700">{ticket.assigned_name}</strong>
                          </span>
                        )}
                      </span>
                      <span className="text-[#8c6d53] font-semibold flex items-center gap-1">
                        <MessageSquare className="size-3.5" />
                        Open Conversation
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-stone-900">Account Profile</h1>
                  <p className="text-xs text-stone-500">
                    View and update your personal details, organization, and contact preferences
                  </p>
                </div>

                {!isEditingAccount && (
                  <button
                    onClick={handleStartEditAccount}
                    className="calm-btn inline-flex items-center gap-2 rounded-lg bg-[#8c6d53] hover:bg-[#765a43] text-white px-4 py-2 text-xs font-semibold cursor-pointer self-start sm:self-auto"
                  >
                    <Pencil className="size-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              <div
                ref={accountCardRef}
                className="bg-white border border-[#e2dfd9] rounded-xl p-6 space-y-5"
              >
                {isEditingAccount ? (
                  <form onSubmit={handleSaveAccount} className="space-y-4 calm-fade-slide">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                          <UserIcon className="size-3.5 text-[#8c6d53]" />
                          <span>Full Name</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={128}
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full rounded-lg border border-[#e2dfd9] bg-[#fafaf9] focus:bg-white px-3.5 py-2 text-sm text-stone-800 outline-none focus:border-[#8c6d53] transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                          <Mail className="size-3.5 text-[#8c6d53]" />
                          <span>Email Address</span>
                        </label>
                        <input
                          type="email"
                          required
                          maxLength={256}
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full rounded-lg border border-[#e2dfd9] bg-[#fafaf9] focus:bg-white px-3.5 py-2 text-sm text-stone-800 outline-none focus:border-[#8c6d53] transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                          <Building2 className="size-3.5 text-[#8c6d53]" />
                          <span>Company / Organization</span>
                        </label>
                        <input
                          type="text"
                          maxLength={128}
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          placeholder="Company or department"
                          className="w-full rounded-lg border border-[#e2dfd9] bg-[#fafaf9] focus:bg-white px-3.5 py-2 text-sm text-stone-800 outline-none focus:border-[#8c6d53] transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                          <Phone className="size-3.5 text-[#8c6d53]" />
                          <span>Phone Number</span>
                        </label>
                        <input
                          type="tel"
                          maxLength={32}
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+27 (0) 00 000 0000"
                          className="w-full rounded-lg border border-[#e2dfd9] bg-[#fafaf9] focus:bg-white px-3.5 py-2 text-sm text-stone-800 outline-none focus:border-[#8c6d53] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f0eee9]">
                      <button
                        type="button"
                        onClick={handleCancelEditAccount}
                        disabled={isSavingAccount}
                        className="calm-btn inline-flex items-center gap-1.5 rounded-lg border border-[#e2dfd9] bg-white hover:bg-[#f4f4f2] text-stone-700 px-4 py-2 text-xs font-semibold cursor-pointer"
                      >
                        <X className="size-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingAccount}
                        className="calm-btn inline-flex items-center gap-1.5 rounded-lg bg-[#8c6d53] hover:bg-[#765a43] text-white px-4 py-2 text-xs font-semibold cursor-pointer disabled:opacity-60"
                      >
                        <Save className="size-3.5" />
                        <span>{isSavingAccount ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#f0eee9] pb-3.5">
                      <span className="text-xs font-medium text-stone-500">Full Name</span>
                      <span className="text-sm font-semibold text-stone-800">
                        {currentUser?.full_name || 'Awonke Philibane'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#f0eee9] pb-3.5">
                      <span className="text-xs font-medium text-stone-500">Email Address</span>
                      <span className="text-sm font-medium text-stone-800">
                        {currentUser?.email || 'philibaneawonke@gmail.com'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#f0eee9] pb-3.5">
                      <span className="text-xs font-medium text-stone-500">Company / Organization</span>
                      <span className="text-sm font-medium text-stone-800">
                        {currentUser?.company || 'Acme Enterprise'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#f0eee9] pb-3.5">
                      <span className="text-xs font-medium text-stone-500">Phone Number</span>
                      <span className="text-sm font-medium text-stone-800">
                        {currentUser?.phone || 'Not provided'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#f0eee9] pb-3.5">
                      <span className="text-xs font-medium text-stone-500">Account Role</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#f5efe8] text-[#6e533c] border border-[#e3d5c5] px-2.5 py-0.5 text-xs font-semibold">
                          {currentUser?.role === 'admin' && <Shield className="size-3 text-[#8c6d53]" />}
                          <span className="capitalize">
                            {currentUser?.role === 'user' || !currentUser?.role ? 'Customer' : currentUser.role}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#f0eee9] pb-3.5">
                      <span className="text-xs font-medium text-stone-500">Membership Tier</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] px-2.5 py-0.5 text-xs font-semibold">
                        <CheckCircle2 className="size-3" /> Enterprise SLA (24/7)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-500">Account Created</span>
                      <span className="text-xs text-stone-600 tabular-nums">
                        {new Date(currentUser?.created_at || '2025-04-12').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* HELP CENTRE TAB */}
          {activeTab === 'help' && (
            <motion.div
              key="help"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Header with Sub-tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Help Centre</h1>
                  <p className="text-xs text-stone-500">
                    Guided troubleshooting, verified IT procedures & ticket creation
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-[#ebe9e4] p-1 rounded-lg flex items-center border border-[#e2dfd9]">
                    <button
                      onClick={() => setHelpSubTab('assistant')}
                      className={`calm-btn flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                        helpSubTab === 'assistant'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Bot className="size-3.5 text-[#8c6d53]" />
                      <span>AI Assistant</span>
                    </button>
                    <button
                      onClick={() => setHelpSubTab('faq')}
                      className={`calm-btn flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                        helpSubTab === 'faq'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <FileText className="size-3.5 text-[#8c6d53]" />
                      <span>Knowledge Base ({FAQ_ITEMS.length})</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenNewTicket()}
                    className="calm-btn hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#8c6d53] hover:bg-[#765a43] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="size-3.5" />
                    <span>Create Ticket</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: AI HELPDESK ASSISTANT */}
              {helpSubTab === 'assistant' && (
                <div className="space-y-4">
                  <HelpdeskAssistant onOpenNewTicket={handleOpenNewTicket} />

                  {/* Knowledge Base Fast Strip */}
                  <div className="bg-white border border-[#e2dfd9] rounded-xl p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-[#8c6d53]" />
                        <h3 className="font-semibold text-xs sm:text-sm text-stone-800">
                          Verified Knowledge Base Highlights
                        </h3>
                      </div>
                      <button
                        onClick={() => setHelpSubTab('faq')}
                        className="text-xs font-semibold text-[#8c6d53] hover:text-[#6e533c] flex items-center gap-1 cursor-pointer"
                      >
                        <span>View all articles</span>
                        <ChevronRight className="size-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {FAQ_ITEMS.slice(0, 3).map((item) => (
                        <div
                          key={item.q}
                          onClick={() => {
                            setHelpSubTab('faq');
                            setSearchQuery(item.q.slice(0, 20));
                          }}
                          className="calm-card-hover p-3 rounded-lg border border-[#e2dfd9] bg-[#fafaf9] hover:bg-[#f5efe8]/50 cursor-pointer group"
                        >
                          <p className="font-semibold text-xs text-stone-800 group-hover:text-[#6e533c] line-clamp-2 mb-1">
                            {item.q}
                          </p>
                          <p className="text-[11px] text-stone-500 line-clamp-2">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KNOWLEDGE BASE ARTICLES */}
              {helpSubTab === 'faq' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="bg-white border border-[#e2dfd9] rounded-xl px-4 py-3 flex items-center gap-2.5">
                    <Search className="size-4 text-stone-400 shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles (e.g. Wi-Fi, VPN, password reset)..."
                      className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Ask Assistant Banner */}
                  <div className="bg-[#f5efe8] border border-[#e3d5c5] rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-[#8c6d53] text-white grid place-items-center shrink-0">
                        <Bot className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-800">
                          Need interactive step-by-step troubleshooting?
                        </p>
                        <p className="text-[11px] text-stone-600">
                          Chat directly with ResolveBot, our 24/7 Helpdesk Assistant.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHelpSubTab('assistant')}
                      className="calm-btn px-3 py-1.5 rounded-lg bg-[#8c6d53] hover:bg-[#765a43] text-white text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      Chat with Assistant
                    </button>
                  </div>

                  {/* FAQ List */}
                  <div className="space-y-2.5">
                    {filteredFaqs.map((faq) => (
                      <details
                        key={faq.q}
                        className="bg-white border border-[#e2dfd9] rounded-xl p-4 group open:border-[#c7b6a6] transition-all"
                      >
                        <summary className="cursor-pointer font-semibold text-sm text-stone-800 flex items-center justify-between list-none">
                          <span className="flex items-center gap-2">
                            <HelpCircle className="size-4 text-[#8c6d53]" />
                            {faq.q}
                          </span>
                          <span className="text-xs text-stone-400 group-open:rotate-90 transition-transform">
                            ▸
                          </span>
                        </summary>
                        <div className="mt-3 pt-3 border-t border-[#f0eee9] space-y-3">
                          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{faq.a}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                handleOpenNewTicket({
                                  title: faq.q,
                                  description: `Assistance needed regarding: ${faq.q}\nReference: ${faq.a}`,
                                  category: faq.category as TicketCategory,
                                });
                              }}
                              className="text-xs font-semibold text-[#8c6d53] hover:text-[#6e533c] flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="size-3" />
                              <span>Create support ticket for this</span>
                            </button>
                          </div>
                        </div>
                      </details>
                    ))}

                    {filteredFaqs.length === 0 && (
                      <div className="text-center py-10 bg-white rounded-xl border border-[#e2dfd9] p-6 space-y-2">
                        <p className="text-sm font-semibold text-stone-700">
                          No articles matched "{searchQuery}"
                        </p>
                        <p className="text-xs text-stone-500">
                          Try searching for keywords like "VPN", "Wi-Fi", "password", or ask our AI
                          Assistant.
                        </p>
                        <button
                          onClick={() => setHelpSubTab('assistant')}
                          className="calm-btn mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#8c6d53] text-white text-xs font-semibold cursor-pointer hover:bg-[#765a43]"
                        >
                          <Bot className="size-3.5" />
                          <span>Ask AI Assistant instead</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => {
          setIsNewTicketOpen(false);
          setPreselectedCategory(undefined);
          setPreselectedTitle(undefined);
          setPreselectedDescription(undefined);
        }}
        initialCategory={preselectedCategory}
        initialTitle={preselectedTitle}
        initialDescription={preselectedDescription}
      />

      <TicketChatModal ticket={activeChatTicket} onClose={() => setActiveChatTicket(null)} />
    </div>
  );
};
