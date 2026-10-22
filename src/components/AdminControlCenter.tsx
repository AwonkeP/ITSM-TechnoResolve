import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Ticket, UserProfile } from '../types';
import { CATEGORIES, getCategoryLabel, formatStatus } from '../data/seedData';
import {
  ShieldCheck,
  BarChart3,
  Users,
  Inbox,
  Mail,
  Download,
  Search,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  Clock,
  LogOut,
  TrendingUp,
  Ban,
  Layers,
  Settings,
  Key,
  Database,
  Cpu,
  Server,
  Bell,
  Plus,
  UserCheck,
  UserX,
  Menu,
  X,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { RoleSwitcher } from './RoleSwitcher';
import { TicketChatModal } from './TicketChatModal';
import { motion, AnimatePresence } from 'motion/react';

export const AdminControlCenter: React.FC = () => {
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const {
    currentUser,
    tickets,
    users,
    outbox,
    notifications,
    unreadNotificationsCount,
    pendingUsersCount,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    approveUser,
    rejectUser,
    signOut,
    showToast,
    setIsOutboxOpen,
    setIsNotificationCenterOpen,
    purgeAllData,
  } = useApp();

  const [activeNav, setActiveNav] = useState<
    'overview' | 'approvals' | 'users' | 'requests' | 'reports' | 'settings' | 'audit' | 'integrations' | 'api' | 'governance'
  >('overview');

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filters for ticket table
  const [ticketSearch, setTicketSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Modal for ticket view
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Metrics
  const totalTickets = tickets.length;
  const openWorkload = tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length;
  const urgentTickets = tickets.filter((t) => t.priority === 'urgent' || t.status === 'escalated').length;
  const aiClassifiedCount = tickets.filter((t) => !!t.ai_category).length;
  const aiConfidencePct = totalTickets > 0 
    ? Math.round((tickets.reduce((acc, t) => acc + (t.ai_confidence || 0.85), 0) / totalTickets) * 100)
    : 0;

  // Unapproved users list
  const pendingUsers = useMemo(() => {
    return users.filter((u) => !u.is_approved && !u.rejected);
  }, [users]);

  // 7-day volume chart data
  const volumeChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayKey = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString([], { weekday: 'short' });

      const created = tickets.filter((t) => (t.created_at || '').slice(0, 10) === dayKey).length;
      const resolved = tickets.filter(
        (t) => (t.status === 'resolved' || t.status === 'closed') && (t.resolved_at || t.updated_at || '').slice(0, 10) === dayKey
      ).length;

      return {
        day: dayLabel,
        created,
        resolved,
      };
    });
  }, [tickets]);

  // Dynamic category breakdown with priority distributions
  const categoryBreakdownData = useMemo(() => {
    const list = CATEGORIES.map((cat) => {
      const catTickets = tickets.filter((t) => t.category === cat.value);
      const total = catTickets.length;
      const urgent = catTickets.filter((t) => t.priority === 'urgent').length;
      const high = catTickets.filter((t) => t.priority === 'high').length;
      const medium = catTickets.filter((t) => t.priority === 'medium').length;
      const low = catTickets.filter((t) => t.priority === 'low').length;

      return {
        key: cat.value,
        name: cat.label.split(' ')[0],
        fullName: cat.label,
        total,
        urgent,
        high,
        medium,
        low,
      };
    });

    // Sort by count descending, ensure top 4 categories are shown
    const sorted = [...list].sort((a, b) => b.total - a.total);
    return sorted.slice(0, 4);
  }, [tickets]);

  // Status distribution data
  const statusChartData = useMemo(() => {
    const statusDefs = [
      { key: 'new', label: 'New', color: '#38bdf8' },
      { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
      { key: 'pending_user', label: 'Pending User', color: '#a855f7' },
      { key: 'escalated', label: 'Escalated', color: '#ef4444' },
      { key: 'resolved', label: 'Resolved', color: '#10b981' },
      { key: 'closed', label: 'Closed', color: '#64748b' },
    ];

    return statusDefs.map((def) => {
      const count = tickets.filter((t) => t.status === def.key).length;
      return {
        key: def.key,
        name: def.label,
        count,
        color: def.color,
        percentage: totalTickets > 0 ? (count / totalTickets) * 100 : 0,
      };
    });
  }, [tickets, totalTickets]);

  // Filtered tickets table
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (catFilter !== 'all' && t.category !== catFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (ticketSearch.trim()) {
        const q = ticketSearch.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.requester_name.toLowerCase().includes(q) ||
          (t.company && t.company.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tickets, catFilter, statusFilter, priorityFilter, ticketSearch]);

  // Filtered users table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company && u.company.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, userSearch]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID,Title,Category,Priority,Status,Requester,Company,Created_At,AI_Confidence'];
    const rows = tickets.map((t) =>
      [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.priority,
        t.status,
        `"${t.requester_name}"`,
        `"${t.company || ''}"`,
        t.created_at,
        t.ai_confidence || '0.94',
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `technoresolve-requests-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Report CSV exported successfully', 'success');
  };

  const navItems = [
    {
      group: 'OPERATIONS',
      items: [
        { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
        {
          id: 'approvals' as const,
          label: 'User Approvals',
          icon: UserCheck,
          badge: pendingUsers.length > 0 ? pendingUsers.length : undefined,
        },
        { id: 'users' as const, label: 'Users & Roles', icon: Users },
        { id: 'requests' as const, label: 'All Requests', icon: Inbox },
        { id: 'reports' as const, label: 'Reports', icon: TrendingUp },
        { id: 'settings' as const, label: 'System Settings', icon: Settings },
      ],
    },
    {
      group: 'PLATFORM',
      items: [
        { id: 'governance' as const, label: 'AI Governance', icon: ShieldCheck },
        { id: 'audit' as const, label: 'Email Outbox', icon: Mail, badge: outbox.length },
        { id: 'integrations' as const, label: 'Integrations', icon: Layers },
        { id: 'api' as const, label: 'API Keys', icon: Key },
      ],
    },
  ];

  return (
    <div
      id="admin-control-center"
      className="flex min-h-screen bg-[#edf5fd] text-slate-900 font-sans antialiased overflow-hidden"
    >
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Operations Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col bg-[#081224] text-slate-700 border-r border-slate-200 transition-transform duration-200 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#123333] bg-[#123333]">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-slate-100 text-[#0f3b6c] border border-[#0f3b6c]/20 shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight bg-[#123333] text-[#f5e9e9] border border-[#103933] px-1.5 py-0.5 rounded">TechnoResolve Control</p>
              <p className="text-[11px] font-mono font-semibold bg-[#123333] text-[#f7ebeb] border border-[#113737] px-1.5 py-0.5 rounded mt-0.5">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-900"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 bg-[#123333] border-t border-b border-[#123333]">
          {navItems.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-3 mb-2">
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-[#0f3b6c] border border-[#0f3b6c]/20 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`size-4 shrink-0 ${isActive ? 'text-[#0f3b6c]' : 'text-slate-300'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                          item.id === 'approvals' && item.badge > 0
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Quick action buttons */}
        <div className="p-3 border-t border-slate-700/50 space-y-2 bg-[#0f302e]">
          <button
            onClick={() => setIsOutboxOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-teal-500/30 transition-all cursor-pointer"
          >
            <Mail className="size-3.5" />
            <span>Open Email Outbox ({outbox.length})</span>
          </button>
        </div>

        {/* Footer: User profile & Logout */}
        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between bg-[#0f2a2a]">
          <div className="text-xs">
            <p className="font-bold text-[#fffafa] truncate max-w-[140px]">{currentUser?.full_name || 'Admin User'}</p>
            <p className="text-[11px] text-[#fcfdfe] font-mono truncate max-w-[140px]">{currentUser?.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-2 text-slate-300 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Main Workspace View */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 backdrop-blur-md border-b border-[#123333] px-4 sm:px-8 py-3.5 flex items-center justify-between bg-[#123333] text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-white/20 text-white hover:bg-white/10 cursor-pointer"
            >
              <Menu className="size-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#eceff7] tracking-tight">System Control Center</h1>
              <p className="text-xs font-mono hidden sm:block text-[#ffffff]">{currentUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              title="Notifications"
              className="relative p-2 rounded-xl border border-slate-200 bg-[#ffffff] text-[#0f3b6c] hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Bell className="size-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#ffffff] text-[#0f3b6c] border border-[#ffffff] text-[10px] font-extrabold grid place-items-center shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Role Switcher */}
            <RoleSwitcher />

            {/* Export report button */}
            <button
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-1.5 bg-[#ffffff] hover:bg-slate-100 text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Content Views */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Admin Notice if Pending Approvals Exist */}
          {pendingUsers.length > 0 && activeNav !== 'approvals' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="size-10 rounded-xl bg-amber-200 text-amber-900 grid place-items-center shrink-0">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    {pendingUsers.length} User Registration{pendingUsers.length > 1 ? 's' : ''} Awaiting Admin Approval
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    New users must be explicitly approved before accessing customer or technician workspaces.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveNav('approvals')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
              >
                <span>Review Approvals ({pendingUsers.length})</span>
                <ArrowUpRight className="size-3.5" />
              </button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* OVERVIEW TAB */}
            {activeNav === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Metric Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Requests</p>
                      <div className="size-10 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden relative">
                        <div className="absolute size-10 rounded-full border-[3px] border-t-blue-400 border-r-rose-400 border-b-emerald-400 border-l-amber-400 opacity-50"></div>
                        <Inbox className="size-4 text-slate-600 relative z-10" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <h3 className="text-3xl font-bold text-slate-900 leading-none">{totalTickets}</h3>
                        <p className="text-xs text-slate-500 mt-1">all time</p>
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5">
                        <span className="text-blue-500">●</span>Live Queue
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Open Workload</p>
                      <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center">
                        <Clock className="size-4 text-slate-600" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <h3 className="text-3xl font-bold text-slate-900 leading-none">{openWorkload}</h3>
                        <p className="text-xs text-slate-500 mt-1">unresolved</p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                        {totalTickets > 0 ? `${Math.round((openWorkload / totalTickets) * 100)}% of total` : '0%'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Urgent</p>
                      <div className="size-10 rounded-full bg-rose-50 flex items-center justify-center">
                        <AlertOctagon className="size-4 text-rose-500" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <h3 className="text-3xl font-bold text-slate-900 leading-none">{urgentTickets}</h3>
                        <p className="text-xs text-slate-500 mt-1">needs escalation</p>
                      </div>
                      <span className={`text-[11px] font-bold flex items-center gap-0.5 ${urgentTickets > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {urgentTickets > 0 ? `▲ ${urgentTickets} active` : '✓ None active'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AI Confidence</p>
                      <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <Sparkles className="size-4 text-emerald-500" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <h3 className="text-3xl font-bold text-slate-900 leading-none">{aiConfidencePct}%</h3>
                        <p className="text-xs text-slate-500 mt-1">{aiClassifiedCount} auto-triaged</p>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                        {totalTickets > 0 ? `${Math.round((aiClassifiedCount / totalTickets) * 100)}% coverage` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Second Row: Big Chart + Bar Chart */}
                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Line Chart */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">7-Day Ticket Throughput</h3>
                        <p className="text-xs text-slate-500">Created vs resolved volume</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-blue-600"></div>Created</div>
                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-emerald-500"></div>Resolved</div>
                      </div>
                    </div>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={volumeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="created" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCreated)" />
                          <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart for Categories */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Issue Categories</h3>
                        <p className="text-xs text-slate-500">Distribution across domains</p>
                      </div>
                      <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live sync
                      </p>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center space-y-4">
                      {categoryBreakdownData.map((cat) => {
                        const uPct = cat.total > 0 ? (cat.urgent / cat.total) * 100 : 0;
                        const hPct = cat.total > 0 ? (cat.high / cat.total) * 100 : 0;
                        const mPct = cat.total > 0 ? (cat.medium / cat.total) * 100 : 0;
                        const lPct = cat.total > 0 ? (cat.low / cat.total) * 100 : 0;

                        return (
                          <div key={cat.key} className="flex items-center gap-3">
                            <div className="w-20 text-xs text-slate-700 text-right font-medium truncate flex items-center justify-end gap-1">
                              <span>{cat.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({cat.total})</span>
                            </div>
                            <div className="flex-1 h-4 flex rounded-sm overflow-hidden bg-slate-100">
                              {cat.total > 0 ? (
                                <>
                                  {uPct > 0 && <div style={{ width: `${uPct}%` }} className="bg-rose-500" title={`Urgent: ${cat.urgent}`} />}
                                  {hPct > 0 && <div style={{ width: `${hPct}%` }} className="bg-amber-500" title={`High: ${cat.high}`} />}
                                  {mPct > 0 && <div style={{ width: `${mPct}%` }} className="bg-amber-300" title={`Medium: ${cat.medium}`} />}
                                  {lPct > 0 && <div style={{ width: `${lPct}%` }} className="bg-emerald-500" title={`Low: ${cat.low}`} />}
                                </>
                              ) : (
                                <div className="w-full bg-slate-50 text-[9px] text-slate-400 text-center leading-4 font-mono">0 requests</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 mt-4 text-[10px] font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-rose-500"></div>Urgent</div>
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-amber-500"></div>High</div>
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-amber-300"></div>Medium</div>
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-emerald-500"></div>Low</div>
                    </div>
                  </div>
                </div>
                
                {/* Third Row */}
                <div className="grid lg:grid-cols-3 gap-4">
                   {/* Status Donut & Bar */}
                   <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Status Distribution</h3>
                          <p className="text-xs text-slate-500">Active queue breakdown</p>
                        </div>
                        <p className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live sync
                        </p>
                      </div>
                      <div className="flex items-center gap-8 h-[100px]">
                        <div className="relative size-[90px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={statusChartData.filter((s) => s.count > 0).length > 0 ? statusChartData.filter((s) => s.count > 0) : [{ name: 'None', count: 1, color: '#e2e8f0' }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                paddingAngle={2}
                                dataKey="count"
                                stroke="none"
                              >
                                {(statusChartData.filter((s) => s.count > 0).length > 0 ? statusChartData.filter((s) => s.count > 0) : [{ name: 'None', count: 1, color: '#e2e8f0' }]).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                           <div className="w-full h-8 flex rounded overflow-hidden bg-slate-100">
                             {totalTickets > 0 && statusChartData.some((s) => s.count > 0) ? (
                               statusChartData
                                 .filter((s) => s.count > 0)
                                 .map((s) => (
                                   <div
                                     key={s.key}
                                     style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                                     className="flex items-center justify-center text-[10px] font-bold text-white transition-all overflow-hidden px-1"
                                     title={`${s.name}: ${s.count} (${Math.round(s.percentage)}%)`}
                                   >
                                     {s.count}
                                   </div>
                                 ))
                             ) : (
                               <div className="w-full flex items-center justify-center text-xs text-slate-400">No tickets in system</div>
                             )}
                           </div>
                           <div className="flex flex-wrap items-center justify-between mt-1 px-1 gap-y-1 gap-x-2">
                             {statusChartData.map((s) => (
                               <div key={s.key} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                                 <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }}></div>
                                 <span>{s.name} ({s.count})</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                   </div>
                   
                   {/* Platform Health */}
                   <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900">Platform Health</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center gap-1">
                          OPERATIONAL <div className="size-1.5 bg-emerald-500 rounded-full"></div>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                         <div className="flex items-center justify-between text-xs">
                           <div className="flex items-center gap-1.5 text-slate-600"><CheckCircle2 className="size-3 text-emerald-500" /> API</div>
                           <span className="font-mono text-emerald-600">45ms</span>
                         </div>
                         <div className="flex items-center justify-between text-xs">
                           <div className="flex items-center gap-1.5 text-slate-600"><CheckCircle2 className="size-3 text-emerald-500" /> DB</div>
                           <span className="font-mono text-emerald-600">12ms</span>
                         </div>
                         <div className="flex items-center justify-between text-xs">
                           <div className="flex items-center gap-1.5 text-slate-600"><CheckCircle2 className="size-3 text-emerald-500" /> Webhook</div>
                           <span className="font-mono text-emerald-600">23ms</span>
                         </div>
                         <div className="flex items-center justify-between text-xs">
                           <div className="flex items-center gap-1.5 text-slate-600"><CheckCircle2 className="size-3 text-emerald-500" /> Auth</div>
                           <span className="font-mono text-emerald-600">34ms</span>
                         </div>
                      </div>
                      <div className="mt-auto pt-3 border-t border-slate-100 space-y-1">
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Uptime:</span>
                            <span className="font-mono text-slate-900 font-medium">99.98%</span>
                         </div>
                         <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Recent Incidents:</span>
                            <span className="text-slate-900 font-medium">None</span>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
            {/* USER APPROVALS TAB */}
            {activeNav === 'approvals' && (
              <motion.div
                key="approvals"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">User Approvals</h2>
                    <p className="text-xs text-slate-500">
                      Mandatory approval gate: review and authorize newly registered accounts
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 self-start sm:self-auto">
                    {pendingUsers.length} Pending Approval
                  </span>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5">User & Email</th>
                          <th className="px-5 py-3.5">Company</th>
                          <th className="px-5 py-3.5">Requested Role</th>
                          <th className="px-5 py-3.5">Submitted</th>
                          <th className="px-5 py-3.5 text-right">Approve As</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-500 space-y-2">
                              <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                              <p className="font-bold text-slate-800 text-sm">All caught up!</p>
                              <p className="text-slate-400">There are no pending user registration requests at this time.</p>
                            </td>
                          </tr>
                        ) : (
                          pendingUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-slate-900">{u.full_name}</p>
                                <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                              </td>
                              <td className="px-5 py-3.5 text-slate-600">{u.company || 'Enterprise'}</td>
                              <td className="px-5 py-3.5">
                                <span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded uppercase text-[10px]">
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-slate-500">
                                {new Date(u.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-1.5">
                                <button
                                  onClick={() => approveUser(u.id, 'user')}
                                  className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-all"
                                  title="Approve as Standard Customer"
                                >
                                  Customer
                                </button>
                                <button
                                  onClick={() => approveUser(u.id, 'technician')}
                                  className="px-2.5 py-1 text-xs font-bold text-cyan-900 bg-cyan-100 hover:bg-cyan-200 rounded-lg cursor-pointer transition-all"
                                  title="Approve with Technician privileges"
                                >
                                  Technician
                                </button>
                                <button
                                  onClick={() => approveUser(u.id, 'admin')}
                                  className="px-2.5 py-1 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 rounded-lg cursor-pointer transition-all"
                                  title="Approve as Administrator"
                                >
                                  Admin
                                </button>
                                <button
                                  onClick={() => rejectUser(u.id)}
                                  className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-all"
                                  title="Reject registration"
                                >
                                  <UserX className="size-3.5 inline" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* USERS & ROLES TAB */}
            {activeNav === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Users & Roles</h2>
                    <p className="text-xs text-slate-500">Manage permissions, elevated technicians, and admin access</p>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5">Name & Email</th>
                          <th className="px-5 py-3.5">Company</th>
                          <th className="px-5 py-3.5">Role</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Registered</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-500">
                              No users match your search filter.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-slate-900">{u.full_name}</p>
                                <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                              </td>
                              <td className="px-5 py-3.5 text-slate-600">{u.company || 'Enterprise'}</td>
                              <td className="px-5 py-3.5">
                                <select
                                  value={u.role}
                                  onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold capitalize text-slate-800 outline-none cursor-pointer"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="technician">Technician</option>
                                  <option value="user">Customer (User)</option>
                                </select>
                              </td>
                              <td className="px-5 py-3.5">
                                {u.banned ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-[11px] font-semibold">
                                    <Ban className="size-3" /> Suspended
                                  </span>
                                ) : u.rejected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-[11px] font-semibold">
                                    Rejected
                                  </span>
                                ) : u.is_approved ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[11px] font-semibold">
                                    <CheckCircle2 className="size-3" /> Approved
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-[11px] font-semibold">
                                    Pending Admin
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-slate-500">
                                {new Date(u.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-1.5">
                                {!u.is_approved && (
                                  <button
                                    onClick={() => approveUser(u.id, u.role)}
                                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => updateUserStatus(u.id, { banned: !u.banned })}
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg cursor-pointer"
                                >
                                  {u.banned ? 'Restore' : 'Suspend'}
                                </button>
                                {userToDelete === u.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        deleteUser(u.id);
                                        setUserToDelete(null);
                                      }}
                                      className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer shadow-sm animate-pulse"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      onClick={() => setUserToDelete(null)}
                                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setUserToDelete(u.id)}
                                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ALL REQUESTS TAB */}
            {activeNav === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Filter controls */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-2 min-w-[240px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                    <Search className="size-4 text-slate-400 shrink-0" />
                    <input
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="Search requests by title, user or company..."
                      className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={catFilter}
                      onChange={(e) => setCatFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="escalated">Escalated</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-100 bg-slate-50 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5">ID</th>
                          <th className="px-5 py-3.5">Title</th>
                          <th className="px-5 py-3.5">Category</th>
                          <th className="px-5 py-3.5">Priority</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Requester</th>
                          <th className="px-5 py-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-500">
                              <Inbox className="size-8 text-slate-700 mx-auto mb-2" />
                              <p className="font-bold text-slate-700 text-sm">No tickets found</p>
                              <p className="text-slate-400 mt-1">Submitted service requests will appear here in real-time.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.map((t) => (
                            <tr
                              key={t.id}
                              onClick={() => setSelectedTicket(t)}
                              className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                            >
                              <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{t.id}</td>
                              <td className="px-5 py-3.5 font-bold text-slate-900">{t.title}</td>
                              <td className="px-5 py-3.5 text-slate-500">{getCategoryLabel(t.category)}</td>
                              <td className="px-5 py-3.5">
                                <span className="capitalize font-semibold text-slate-700">{t.priority}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="capitalize font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                                  {formatStatus(t.status)}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-slate-700">{t.requester_name}</td>
                              <td className="px-5 py-3.5 text-right">
                                <button className="text-blue-600 font-bold hover:underline cursor-pointer">Inspect</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI GOVERNANCE & COMPLIANCE TAB */}
            {activeNav === 'governance' && (
              <motion.div
                key="governance"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">AI Governance & Compliance</h2>
                  <p className="text-xs text-slate-600 mt-1">Manage AI decision boundaries, automated workflows, and data ethics.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <Cpu className="size-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Automated Workflow Engine</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">High-Priority Escalation</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Auto-escalate tickets assessed as 'Critical' with &gt; 80% confidence</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">ACTIVE</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Draft Response Generation</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Pre-generate contextually aware AI responses for Technician review</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">ACTIVE</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <ShieldCheck className="size-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Responsible AI & Data Privacy</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Human-in-the-loop (HITL)</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">AI drafts require manual technician approval before dispatch</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">ENFORCED</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Data Retention & PII Scrubbing</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Automated redaction of sensitive customer info in training datasets</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">COMPLIANT</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Recent AI Decisions Log</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-500">TICKET ID</th>
                          <th className="px-4 py-3 font-semibold text-slate-500">AI ASSESSMENT</th>
                          <th className="px-4 py-3 font-semibold text-slate-500">CONFIDENCE</th>
                          <th className="px-4 py-3 font-semibold text-slate-500">REASONING AUDIT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tickets.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono font-semibold text-slate-800">{t.id}</td>
                            <td className="px-4 py-3">
                              <span className="capitalize font-medium text-slate-700">{t.ai_suggested_priority || t.priority}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-mono ${(t.ai_confidence || 0) > 0.8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {Math.round((t.ai_confidence || 0) * 100)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 truncate max-w-[300px]">
                              {t.ai_reasoning || 'Standard categorization'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AUDIT LOG / EMAIL OUTBOX TAB */}
            {activeNav === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Email Outbox & Delivery Logs</h2>
                    <p className="text-xs text-slate-500">Live dispatch log of verification codes, ticket alerts, and admin notices</p>
                  </div>
                  <button
                    onClick={() => setIsOutboxOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-slate-900 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Open Full Viewer</span>
                  </button>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
                  {outbox.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">No email records in outbox yet.</div>
                  ) : (
                    outbox.map((mail) => (
                      <div key={mail.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{mail.subject}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            To: {mail.to} · {new Date(mail.created_at).toLocaleString()}
                          </p>
                          {mail.payload && (
                            <p className="text-[11px] text-slate-600 mt-1 font-mono bg-slate-50 p-2 rounded border border-slate-200/70 line-clamp-2">
                              {mail.payload}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 text-[10px] self-start sm:self-auto">
                          SENT
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* REPORTS TAB */}
            {activeNav === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
                  <h2 className="text-xl font-extrabold text-slate-900">Enterprise Reports & SLA Insights</h2>
                  <p className="text-xs text-slate-600">Export audit-ready CSV records of all resolved tickets, SLA compliance, and user roles.</p>
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-slate-900 px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    <Download className="size-4" /> Download Complete Report
                  </button>
                </div>
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeNav === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                  <h2 className="text-xl font-extrabold text-slate-900">System Security & Access Settings</h2>
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Mandatory Administrator Approval</p>
                        <p className="text-slate-500">Require administrator confirmation before new users can log in</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ENFORCED
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Mandatory Email Verification</p>
                        <p className="text-slate-500">Require 6-digit confirmation code on all user registrations</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        ENFORCED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-red-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                  <h2 className="text-xl font-extrabold text-red-600">Danger Zone</h2>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-red-900">Clear Database</p>
                      <p className="text-red-700 text-xs">Permanently delete all users, tickets, and messages.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const code = prompt('Type "DELETE" to confirm clearing the entire database:');
                        if (code === 'DELETE') {
                          purgeAllData();
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Clear Database
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* INTEGRATIONS & API KEYS TABS */}
            {(activeNav === 'integrations' || activeNav === 'api') && (
              <motion.div
                key="other"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs"
              >
                <h2 className="text-xl font-extrabold text-slate-900 capitalize">{activeNav}</h2>
                <p className="text-xs text-slate-500 mt-1">Managed integration endpoints and active webhook secrets.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Ticket Modal */}
      <TicketChatModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
};
