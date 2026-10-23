import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Ticket, SecurityAuditCategory } from '../types';
import { CATEGORIES, getCategoryLabel, formatStatus, evaluateTicketSLA } from '../data/seedData';
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
  Cpu,
  Bell,
  UserCheck,
  UserX,
  Menu,
  X,
  ArrowUpRight,
  ExternalLink,
  RotateCcw,
  Save,
  Sun,
  Moon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { RoleSwitcher } from './RoleSwitcher';
import { TicketChatModal } from './TicketChatModal';
import { useAnimatedCounter, animateCalmFadeSlide, triggerElementPop } from '../utils/jsAnimations';

export const AdminControlCenter: React.FC = () => {
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const {
    currentUser,
    tickets,
    users,
    outbox,
    unreadNotificationsCount,
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
    auditLogs,
    slaConfig,
    updateSLAConfig,
    resetSLAConfig,
    isDarkMode,
    toggleDarkMode,
  } = useApp();

  const [activeNav, setActiveNav] = useState<
    | 'overview'
    | 'approvals'
    | 'users'
    | 'requests'
    | 'reports'
    | 'settings'
    | 'security_audit'
    | 'audit'
    | 'integrations'
    | 'api'
    | 'governance'
  >('overview');

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animateCalmFadeSlide(contentRef.current);
  }, [activeNav]);

  // Filters for ticket table
  const [ticketSearch, setTicketSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Security Audit Log filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'all' | SecurityAuditCategory>('all');

  // Custom SLA form state
  const [slaForm, setSlaForm] = useState({
    urgent: slaConfig.urgent,
    high: slaConfig.high,
    medium: slaConfig.medium,
    low: slaConfig.low,
  });

  useEffect(() => {
    setSlaForm({
      urgent: slaConfig.urgent,
      high: slaConfig.high,
      medium: slaConfig.medium,
      low: slaConfig.low,
    });
  }, [slaConfig]);

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

  // Smooth JS animated counters
  const animTotalTickets = useAnimatedCounter(totalTickets);
  const animOpenWorkload = useAnimatedCounter(openWorkload);
  const animUrgentTickets = useAnimatedCounter(urgentTickets);
  const animAiConfidence = useAnimatedCounter(aiConfidencePct);

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

    const sorted = [...list].sort((a, b) => b.total - a.total);
    return sorted.slice(0, 4);
  }, [tickets]);

  // Calm status distribution data using light brown, stone greys, and light green for resolved
  const statusChartData = useMemo(() => {
    const statusDefs = [
      { key: 'new', label: 'New', color: '#8c6d53' },
      { key: 'in_progress', label: 'In Progress', color: '#a88b73' },
      { key: 'pending_user', label: 'Pending User', color: '#8c8881' },
      { key: 'escalated', label: 'Escalated', color: '#5c5954' },
      { key: 'resolved', label: 'Resolved', color: '#2f6b45' },
      { key: 'closed', label: 'Closed', color: '#c4bfb6' },
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

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (auditCategoryFilter !== 'all' && entry.category !== auditCategoryFilter) {
        return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        return (
          entry.id.toLowerCase().includes(q) ||
          entry.actor_name.toLowerCase().includes(q) ||
          entry.actor_email.toLowerCase().includes(q) ||
          entry.target_name.toLowerCase().includes(q) ||
          entry.target_email.toLowerCase().includes(q) ||
          entry.details.toLowerCase().includes(q) ||
          entry.action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, auditCategoryFilter, auditSearch]);

  // SLA Compliance Metrics
  const slaSummary = useMemo(() => {
    if (tickets.length === 0) {
      return { compliantCount: 0, atRiskCount: 0, breachedCount: 0, complianceRate: 100 };
    }
    let compliantCount = 0;
    let atRiskCount = 0;
    let breachedCount = 0;
    tickets.forEach((t) => {
      const ev = evaluateTicketSLA(t, slaConfig);
      if (ev.status === 'met' || ev.status === 'on_track') {
        compliantCount++;
      } else if (ev.status === 'at_risk') {
        atRiskCount++;
      } else {
        breachedCount++;
      }
    });
    const complianceRate = Math.round(((compliantCount + atRiskCount) / tickets.length) * 100);
    return { compliantCount, atRiskCount, breachedCount, complianceRate };
  }, [tickets, slaConfig]);

  const animAuditTotal = useAnimatedCounter(auditLogs.length);
  const animRoleChanges = useAnimatedCounter(auditLogs.filter((a) => a.category === 'role').length);
  const animApprovalActions = useAnimatedCounter(auditLogs.filter((a) => a.category === 'approval' || a.category === 'status').length);
  const animPolicyChanges = useAnimatedCounter(auditLogs.filter((a) => a.category === 'policy' || a.category === 'profile').length);

  // Strict Component-Level Guard: Only Admins can ever render AdminControlCenter
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  // CSV Export for Requests
  const handleExportCSV = () => {
    const headers = ['ID,Title,Category,Priority,Status,SLA_Target_Hours,SLA_Status,Requester,Company,Created_At,AI_Confidence'];
    const rows = tickets.map((t) => {
      const slaEv = evaluateTicketSLA(t, slaConfig);
      return [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.priority,
        t.status,
        slaEv.targetHours,
        `"${slaEv.label}"`,
        `"${t.requester_name}"`,
        `"${t.company || ''}"`,
        t.created_at,
        t.ai_confidence || '0.94',
      ].join(',');
    });

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

  // CSV Export for Security Audit Log
  const handleExportAuditCSV = (e?: React.MouseEvent<HTMLElement>) => {
    if (e?.currentTarget) triggerElementPop(e.currentTarget);
    const headers = ['Audit_ID,Action,Category,Actor_Name,Actor_Email,Target_Name,Target_Email,Previous_Value,New_Value,Details,Timestamp'];
    const rows = filteredAuditLogs.map((entry) =>
      [
        entry.id,
        entry.action,
        entry.category,
        `"${entry.actor_name.replace(/"/g, '""')}"`,
        entry.actor_email,
        `"${entry.target_name.replace(/"/g, '""')}"`,
        entry.target_email,
        `"${(entry.previous_value || '').replace(/"/g, '""')}"`,
        `"${(entry.new_value || '').replace(/"/g, '""')}"`,
        `"${entry.details.replace(/"/g, '""')}"`,
        entry.created_at,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `technoresolve-security-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Security Audit Log exported to CSV', 'success');
  };

  const handleSaveSLATargets = (e: React.FormEvent) => {
    e.preventDefault();
    updateSLAConfig({
      urgent: Number(slaForm.urgent) || 2,
      high: Number(slaForm.high) || 4,
      medium: Number(slaForm.medium) || 8,
      low: Number(slaForm.low) || 24,
    });
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
        { id: 'reports' as const, label: 'Reports & SLA', icon: TrendingUp },
        { id: 'settings' as const, label: 'System & SLA Settings', icon: Settings },
      ],
    },
    {
      group: 'PLATFORM',
      items: [
        {
          id: 'security_audit' as const,
          label: 'Security Audit Log',
          icon: ShieldCheck,
          badge: auditLogs.length,
        },
        { id: 'governance' as const, label: 'AI Governance', icon: Cpu },
        { id: 'audit' as const, label: 'Email Outbox', icon: Mail, badge: outbox.length },
        { id: 'integrations' as const, label: 'Integrations', icon: Layers },
        { id: 'api' as const, label: 'API Keys', icon: Key },
      ],
    },
  ];

  return (
    <div
      id="admin-control-center"
      className="flex min-h-screen bg-[#f4f4f2] text-[#262523] font-sans antialiased overflow-hidden"
    >
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Left Operations Sidebar — Harmonized Warm Stone */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col bg-[#efede8] text-[#5c5954] border-r border-[#e4dfd7] transition-transform duration-200 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4dfd7] bg-[#efede8]">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#ebe3da] text-[#8c6d53] border border-[#d6c2b0]">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight text-[#262523]">TechnoResolve</p>
              <p className="text-[11px] font-mono text-[#6e533c]">Admin Control</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1 text-[#8c8881] hover:text-[#262523]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 bg-[#efede8]">
          {navItems.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="text-[10px] font-bold tracking-wider uppercase text-[#8c8881] px-3 mb-2">
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
                        ? 'bg-[#ebe3da] text-[#6e533c] border border-[#d6c2b0]'
                        : 'text-[#5c5954] hover:text-[#262523] hover:bg-[#e5e1da] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`size-4 shrink-0 ${isActive ? 'text-[#8c6d53]' : 'text-[#8c8881]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full tabular-nums ${
                          item.id === 'approvals' && item.badge > 0
                            ? 'bg-[#8c6d53] text-white'
                            : 'bg-[#e5e1da] text-[#5c5954]'
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
        <div className="p-3 border-t border-[#e4dfd7] bg-[#e9e6df]">
          <button
            onClick={() => setIsOutboxOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#f4f4f2] hover:bg-[#ebe3da] text-[#5c5954] hover:text-[#6e533c] text-xs font-semibold border border-[#d6d1c7] transition-all cursor-pointer calm-btn"
          >
            <Mail className="size-3.5 text-[#8c6d53]" />
            <span>Email Outbox ({outbox.length})</span>
          </button>
        </div>

        {/* Footer: User profile & Logout */}
        <div className="p-4 border-t border-[#e4dfd7] flex items-center justify-between bg-[#efede8]">
          <div className="text-xs min-w-0">
            <p className="font-bold text-[#262523] truncate max-w-[145px]">{currentUser?.full_name || 'Admin User'}</p>
            <p className="text-[11px] text-[#8c8881] font-mono truncate max-w-[145px]">{currentUser?.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-2 text-[#5c5954] hover:text-[#262523] hover:bg-[#e5e1da] rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Main Workspace View */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Top Header Bar — Harmonized with the warm stone page canvas */}
        <header className="sticky top-0 z-30 border-b border-[#e4dfd7] px-4 sm:px-8 py-3.5 flex items-center justify-between bg-[#f4f4f2]/95 backdrop-blur-md text-[#262523]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#d6d1c7] bg-[#ebe9e4] text-[#5c5954] hover:bg-[#e3dfd8] cursor-pointer"
            >
              <Menu className="size-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#262523] tracking-tight">System Control Center</h1>
              <p className="text-xs font-mono hidden sm:block text-[#8c8881]">{currentUser?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="calm-btn flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-[#d6d1c7] bg-[#ebe9e4] hover:bg-[#e3dfd8] text-xs font-semibold text-[#5c5954] hover:text-[#262523] transition-all cursor-pointer whitespace-nowrap shrink-0"
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

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              title="Notifications"
              className="relative p-2 rounded-xl border border-[#d6d1c7] bg-[#ebe9e4] text-[#5c5954] hover:text-[#262523] hover:bg-[#e3dfd8] transition-all cursor-pointer"
            >
              <Bell className="size-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#8c6d53] text-white text-[10px] font-bold grid place-items-center tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Role Switcher */}
            <RoleSwitcher />

            {/* Export report button */}
            <button
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-1.5 bg-[#8c6d53] hover:bg-[#765a43] text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-[#765a43] transition-all cursor-pointer calm-btn"
            >
              <Download className="size-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Content Views */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Admin Notice if Pending Approvals Exist */}
          {pendingUsers.length > 0 && activeNav !== 'approvals' && (
            <div className="rounded-2xl border border-[#d6c2b0] bg-[#f5efe8] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-10 rounded-xl bg-white text-[#8c6d53] border border-[#d6c2b0] grid place-items-center shrink-0">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#262523]">
                    {pendingUsers.length} User Registration{pendingUsers.length > 1 ? 's' : ''} Awaiting Admin Approval
                  </h4>
                  <p className="text-xs text-[#6e533c] mt-0.5">
                    New users must be approved before accessing customer or technician workspaces.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveNav('approvals')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white font-semibold text-xs cursor-pointer whitespace-nowrap calm-btn"
              >
                <span>Review Approvals ({pendingUsers.length})</span>
                <ArrowUpRight className="size-3.5" />
              </button>
            </div>
          )}

          <div ref={contentRef} className="calm-fade-slide">
            {/* OVERVIEW TAB */}
            {activeNav === 'overview' && (
              <div className="space-y-5">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-5 flex flex-col calm-card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider">Total Requests</p>
                      <div className="size-9 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] flex items-center justify-center">
                        <Inbox className="size-4 text-[#5c5954]" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <h3 className="text-3xl font-bold text-[#262523] leading-none tabular-nums">{animTotalTickets}</h3>
                        <p className="text-xs text-[#8c8881] mt-1">all time</p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#6e533c] bg-[#f5efe8] px-2 py-0.5 rounded-md border border-[#d6c2b0]">
                        Queue Active
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-5 flex flex-col calm-card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider">Open Workload</p>
                      <div className="size-9 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] flex items-center justify-center">
                        <Clock className="size-4 text-[#8c6d53]" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <h3 className="text-3xl font-bold text-[#262523] leading-none tabular-nums">{animOpenWorkload}</h3>
                        <p className="text-xs text-[#8c8881] mt-1">unresolved</p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#5c5954] tabular-nums">
                        {totalTickets > 0 ? `${Math.round((openWorkload / totalTickets) * 100)}% of total` : '0%'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-5 flex flex-col calm-card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider">Priority Queue</p>
                      <div className="size-9 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] flex items-center justify-center">
                        <AlertOctagon className="size-4 text-[#6e533c]" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <h3 className="text-3xl font-bold text-[#262523] leading-none tabular-nums">{animUrgentTickets}</h3>
                        <p className="text-xs text-[#8c8881] mt-1">escalated / high</p>
                      </div>
                      <span className={`text-[11px] font-semibold ${urgentTickets > 0 ? 'text-[#6e533c]' : 'text-[#2f6b45]'}`}>
                        {urgentTickets > 0 ? `${urgentTickets} active` : 'Clear'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-5 flex flex-col calm-card-hover">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider">AI Confidence</p>
                      <div className="size-9 rounded-xl bg-[#e6f4ea] border border-[#c6e6d0] flex items-center justify-center">
                        <Sparkles className="size-4 text-[#2f6b45]" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <h3 className="text-3xl font-bold text-[#2f6b45] leading-none tabular-nums">{animAiConfidence}%</h3>
                        <p className="text-xs text-[#8c8881] mt-1">{aiClassifiedCount} auto-triaged</p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#2f6b45] bg-[#e6f4ea] px-2 py-0.5 rounded-md border border-[#c6e6d0] tabular-nums">
                        {totalTickets > 0 ? `${Math.round((aiClassifiedCount / totalTickets) * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Second Row: Throughput Chart + Category Distribution */}
                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Area Chart */}
                  <div className="lg:col-span-2 bg-white border border-[#e2dfd9] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-bold text-[#262523]">7-Day Ticket Throughput</h3>
                        <p className="text-xs text-[#5c5954]">Created vs resolved volume</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-[#5c5954]">
                        <div className="flex items-center gap-1.5">
                          <div className="size-2.5 rounded-full bg-[#8c6d53]"></div>Created
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="size-2.5 rounded-full bg-[#2f6b45]"></div>Resolved
                        </div>
                      </div>
                    </div>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={volumeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8c6d53" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#8c6d53" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2f6b45" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#2f6b45" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebe9e4" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8c8881' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8c8881' }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '10px',
                              border: '1px solid #e2dfd9',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 4px 12px rgba(38, 37, 35, 0.06)',
                              fontSize: '12px',
                            }}
                          />
                          <Area type="monotone" dataKey="created" stroke="#8c6d53" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCreated)" />
                          <Area type="monotone" dataKey="resolved" stroke="#2f6b45" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart for Categories */}
                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#262523]">Issue Categories</h3>
                        <p className="text-xs text-[#5c5954]">Distribution across domains</p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#2f6b45] bg-[#e6f4ea] px-2 py-0.5 rounded border border-[#c6e6d0]">
                        Synced
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-4">
                      {categoryBreakdownData.map((cat) => {
                        const uPct = cat.total > 0 ? (cat.urgent / cat.total) * 100 : 0;
                        const hPct = cat.total > 0 ? (cat.high / cat.total) * 100 : 0;
                        const mPct = cat.total > 0 ? (cat.medium / cat.total) * 100 : 0;
                        const lPct = cat.total > 0 ? (cat.low / cat.total) * 100 : 0;

                        return (
                          <div key={cat.key} className="flex items-center gap-3">
                            <div className="w-24 text-xs text-[#262523] text-right font-medium truncate flex items-center justify-end gap-1">
                              <span>{cat.name}</span>
                              <span className="text-[10px] text-[#8c8881] font-mono tabular-nums">({cat.total})</span>
                            </div>
                            <div className="flex-1 h-3.5 flex rounded-md overflow-hidden bg-[#f4f4f2] border border-[#e2dfd9]">
                              {cat.total > 0 ? (
                                <>
                                  {uPct > 0 && <div style={{ width: `${uPct}%` }} className="bg-[#6e533c]" title={`Urgent: ${cat.urgent}`} />}
                                  {hPct > 0 && <div style={{ width: `${hPct}%` }} className="bg-[#8c6d53]" title={`High: ${cat.high}`} />}
                                  {mPct > 0 && <div style={{ width: `${mPct}%` }} className="bg-[#bfa893]" title={`Medium: ${cat.medium}`} />}
                                  {lPct > 0 && <div style={{ width: `${lPct}%` }} className="bg-[#2f6b45]" title={`Low: ${cat.low}`} />}
                                </>
                              ) : (
                                <div className="w-full bg-[#f4f4f2] text-[9px] text-[#8c8881] text-center leading-3.5 font-mono">0 requests</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-center gap-3 mt-4 text-[10px] font-semibold text-[#5c5954]">
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-[#6e533c]"></div>Urgent</div>
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-[#8c6d53]"></div>High</div>
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-[#bfa893]"></div>Medium</div>
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-[#2f6b45]"></div>Low</div>
                    </div>
                  </div>
                </div>

                {/* Third Row: Status Distribution & Platform Health */}
                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-white border border-[#e2dfd9] rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#262523]">Status Distribution</h3>
                        <p className="text-xs text-[#5c5954]">Active queue breakdown</p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#5c5954] bg-[#f4f4f2] px-2 py-0.5 rounded border border-[#e2dfd9]">
                        Real-time
                      </span>
                    </div>
                    <div className="flex items-center gap-6 h-[100px]">
                      <div className="relative size-[90px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusChartData.filter((s) => s.count > 0).length > 0 ? statusChartData.filter((s) => s.count > 0) : [{ name: 'None', count: 1, color: '#e2dfd9' }]}
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={40}
                              paddingAngle={2}
                              dataKey="count"
                              stroke="none"
                            >
                              {(statusChartData.filter((s) => s.count > 0).length > 0 ? statusChartData.filter((s) => s.count > 0) : [{ name: 'None', count: 1, color: '#e2dfd9' }]).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="w-full h-7 flex rounded-lg overflow-hidden bg-[#f4f4f2] border border-[#e2dfd9]">
                          {totalTickets > 0 && statusChartData.some((s) => s.count > 0) ? (
                            statusChartData
                              .filter((s) => s.count > 0)
                              .map((s) => (
                                <div
                                  key={s.key}
                                  style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                                  className="flex items-center justify-center text-[10px] font-bold text-white transition-all overflow-hidden px-1 tabular-nums"
                                  title={`${s.name}: ${s.count} (${Math.round(s.percentage)}%)`}
                                >
                                  {s.count}
                                </div>
                              ))
                          ) : (
                            <div className="w-full flex items-center justify-center text-xs text-[#8c8881]">No tickets in system</div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between mt-1 px-1 gap-y-1 gap-x-2">
                          {statusChartData.map((s) => (
                            <div key={s.key} className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5c5954] tabular-nums">
                              <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }}></div>
                              <span>{s.name} ({s.count})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platform Health — Light Green for Nominal Operational status */}
                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-[#262523]">Platform Health</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] text-[10px] font-bold flex items-center gap-1">
                        OPERATIONAL
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#5c5954]"><CheckCircle2 className="size-3.5 text-[#2f6b45]" /> API</div>
                        <span className="font-mono text-[#2f6b45] tabular-nums">45ms</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#5c5954]"><CheckCircle2 className="size-3.5 text-[#2f6b45]" /> DB</div>
                        <span className="font-mono text-[#2f6b45] tabular-nums">12ms</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#5c5954]"><CheckCircle2 className="size-3.5 text-[#2f6b45]" /> Webhook</div>
                        <span className="font-mono text-[#2f6b45] tabular-nums">23ms</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#5c5954]"><CheckCircle2 className="size-3.5 text-[#2f6b45]" /> Auth</div>
                        <span className="font-mono text-[#2f6b45] tabular-nums">34ms</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-[#ebe9e4] space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8c8881]">Uptime:</span>
                        <span className="font-mono text-[#262523] font-medium tabular-nums">99.98%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8c8881]">Recent Incidents:</span>
                        <span className="text-[#2f6b45] font-medium">None</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USER APPROVALS TAB */}
            {activeNav === 'approvals' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-[#262523]">User Approvals</h2>
                    <p className="text-xs text-[#5c5954]">
                      Mandatory approval gate: review and authorize newly registered accounts
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#f5efe8] text-[#6e533c] border border-[#d6c2b0] self-start sm:self-auto tabular-nums">
                    {pendingUsers.length} Pending Approval
                  </span>
                </div>

                <div className="bg-white border border-[#e2dfd9] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#e2dfd9] bg-[#f4f4f2] font-bold uppercase tracking-wider text-[#5c5954] text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5">User & Email</th>
                          <th className="px-5 py-3.5">Company</th>
                          <th className="px-5 py-3.5">Requested Role</th>
                          <th className="px-5 py-3.5">Submitted</th>
                          <th className="px-5 py-3.5 text-right">Approve As</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebe9e4]">
                        {pendingUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-xs text-[#5c5954] space-y-2">
                              <CheckCircle2 className="size-8 text-[#2f6b45] mx-auto" />
                              <p className="font-bold text-[#262523] text-sm">All caught up</p>
                              <p className="text-[#8c8881]">There are no pending user registration requests at this time.</p>
                            </td>
                          </tr>
                        ) : (
                          pendingUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-[#f4f4f2]/60 transition-colors">
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-[#262523]">{u.full_name}</p>
                                <p className="text-xs text-[#8c8881] font-mono">{u.email}</p>
                              </td>
                              <td className="px-5 py-3.5 text-[#5c5954]">{u.company || 'Enterprise'}</td>
                              <td className="px-5 py-3.5">
                                <span className="font-bold text-[#6e533c] bg-[#f5efe8] border border-[#d6c2b0] px-2 py-0.5 rounded uppercase text-[10px]">
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-[#8c8881] tabular-nums">
                                {new Date(u.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-1.5">
                                <button
                                  onClick={() => approveUser(u.id, 'user')}
                                  className="px-2.5 py-1 text-xs font-semibold text-[#262523] bg-[#f4f4f2] hover:bg-[#ebe9e4] border border-[#e2dfd9] rounded-lg cursor-pointer transition-all"
                                  title="Approve as Standard Customer"
                                >
                                  Customer
                                </button>
                                <button
                                  onClick={() => approveUser(u.id, 'technician')}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#8c6d53] hover:bg-[#765a43] rounded-lg cursor-pointer transition-all"
                                  title="Approve with Technician privileges"
                                >
                                  Technician
                                </button>
                                <button
                                  onClick={() => approveUser(u.id, 'admin')}
                                  className="px-2.5 py-1 text-xs font-semibold text-[#6e533c] bg-[#f5efe8] hover:bg-[#ebe0d4] border border-[#d6c2b0] rounded-lg cursor-pointer transition-all"
                                  title="Approve as Administrator"
                                >
                                  Admin
                                </button>
                                <button
                                  onClick={() => rejectUser(u.id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-[#5c5954] bg-[#f4f4f2] hover:bg-[#ebe9e4] border border-[#e2dfd9] rounded-lg cursor-pointer transition-all"
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
              </div>
            )}

            {/* USERS & ROLES TAB */}
            {activeNav === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[#262523]">Users & Roles</h2>
                    <p className="text-xs text-[#5c5954]">Manage permissions, elevated technicians, and admin access</p>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8881]" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full rounded-xl border border-[#e2dfd9] bg-white pl-9 pr-3 py-1.5 text-xs text-[#262523] outline-none focus:border-[#8c6d53]"
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#e2dfd9] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#e2dfd9] bg-[#f4f4f2] font-bold uppercase tracking-wider text-[#5c5954] text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5">Name & Email</th>
                          <th className="px-5 py-3.5">Company</th>
                          <th className="px-5 py-3.5">Role</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Joined</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebe9e4]">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-xs text-[#8c8881]">
                              No users match your search.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-[#f4f4f2]/60 transition-colors">
                              <td className="px-5 py-3.5">
                                <p className="font-bold text-[#262523]">{u.full_name}</p>
                                <p className="text-[11px] text-[#8c8881] font-mono">{u.email}</p>
                              </td>
                              <td className="px-5 py-3.5 text-[#5c5954]">{u.company || 'Enterprise'}</td>
                              <td className="px-5 py-3.5">
                                <select
                                  value={u.role}
                                  onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                                  className="rounded-lg border border-[#e2dfd9] bg-[#f4f4f2] px-2.5 py-1 text-xs font-semibold text-[#262523] outline-none focus:border-[#8c6d53] cursor-pointer"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="technician">Technician</option>
                                  <option value="user">Customer (User)</option>
                                </select>
                              </td>
                              <td className="px-5 py-3.5">
                                {u.banned ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ebe9e4] text-[#5c5954] border border-[#d5d1c8] px-2.5 py-0.5 text-[11px] font-semibold">
                                    <Ban className="size-3" /> Suspended
                                  </span>
                                ) : u.rejected ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ebe9e4] text-[#5c5954] border border-[#d5d1c8] px-2.5 py-0.5 text-[11px] font-semibold">
                                    Rejected
                                  </span>
                                ) : u.is_approved ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] px-2.5 py-0.5 text-[11px] font-semibold">
                                    <CheckCircle2 className="size-3" /> Approved
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f5efe8] text-[#6e533c] border border-[#d6c2b0] px-2.5 py-0.5 text-[11px] font-semibold">
                                    Pending Admin
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-[#8c8881] tabular-nums">
                                {new Date(u.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-1.5">
                                {!u.is_approved && (
                                  <button
                                    onClick={() => approveUser(u.id, u.role)}
                                    className="px-2.5 py-1 text-xs font-bold text-[#2f6b45] bg-[#e6f4ea] hover:bg-[#d7ede0] border border-[#c6e6d0] rounded-lg cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => updateUserStatus(u.id, { banned: !u.banned })}
                                  className="px-2.5 py-1 text-xs font-semibold text-[#5c5954] hover:text-[#262523] border border-[#e2dfd9] bg-white hover:bg-[#f4f4f2] rounded-lg cursor-pointer"
                                >
                                  {u.banned ? 'Restore' : 'Suspend'}
                                </button>
                                {userToDelete === u.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        deleteUser(u.id);
                                        setUserToDelete(null);
                                      }}
                                      className="px-3 py-1 text-xs font-bold text-white bg-[#6e533c] hover:bg-[#59422f] rounded-lg cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setUserToDelete(null)}
                                      className="px-2.5 py-1 text-xs font-semibold text-[#5c5954] border border-[#e2dfd9] hover:bg-[#f4f4f2] rounded-lg cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setUserToDelete(u.id)}
                                    className="px-2.5 py-1 text-xs font-semibold text-[#5c5954] bg-[#f4f4f2] hover:bg-[#ebe9e4] border border-[#e2dfd9] rounded-lg cursor-pointer transition-colors"
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
              </div>
            )}

            {/* ALL REQUESTS TAB */}
            {activeNav === 'requests' && (
              <div className="space-y-4">
                {/* Filter controls */}
                <div className="bg-white border border-[#e2dfd9] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-2 min-w-[240px] rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] px-3.5 py-2">
                    <Search className="size-4 text-[#8c8881] shrink-0" />
                    <input
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="Search requests by title, user or company..."
                      className="w-full bg-transparent text-xs text-[#262523] outline-none placeholder:text-[#8c8881]"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={catFilter}
                      onChange={(e) => setCatFilter(e.target.value)}
                      className="rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] px-3 py-2 font-medium text-[#262523] outline-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] px-3 py-2 font-medium text-[#262523] outline-none cursor-pointer"
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
                <div className="bg-white border border-[#e2dfd9] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#e2dfd9] bg-[#f4f4f2] font-bold uppercase tracking-wider text-[#5c5954] text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5">ID</th>
                          <th className="px-5 py-3.5">Title</th>
                          <th className="px-5 py-3.5">Category</th>
                          <th className="px-5 py-3.5">Priority</th>
                          <th className="px-5 py-3.5">SLA Target</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Requester</th>
                          <th className="px-5 py-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebe9e4]">
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-5 py-12 text-center text-xs text-[#5c5954]">
                              <Inbox className="size-8 text-[#8c8881] mx-auto mb-2" />
                              <p className="font-bold text-[#262523] text-sm">No tickets found</p>
                              <p className="text-[#8c8881] mt-1">Submitted service requests will appear here in real-time.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.map((t) => {
                            const isResolved = t.status === 'resolved' || t.status === 'closed';
                            const slaEv = evaluateTicketSLA(t, slaConfig);
                            return (
                              <tr
                                key={t.id}
                                onClick={() => setSelectedTicket(t)}
                                className="hover:bg-[#f4f4f2]/70 cursor-pointer transition-colors"
                              >
                                <td className="px-5 py-3.5 font-mono font-bold text-[#8c6d53] tabular-nums">{t.id}</td>
                                <td className="px-5 py-3.5 font-bold text-[#262523]">{t.title}</td>
                                <td className="px-5 py-3.5 text-[#5c5954]">{getCategoryLabel(t.category)}</td>
                                <td className="px-5 py-3.5">
                                  <span className="capitalize font-semibold text-[#5c5954]">{t.priority}</span>
                                </td>
                                <td className="px-5 py-3.5 font-mono text-[11px] tabular-nums">
                                  <span
                                    className={
                                      slaEv.status === 'met'
                                        ? 'text-[#2f6b45] font-semibold'
                                        : slaEv.status === 'breached' || slaEv.status === 'resolved_late'
                                        ? 'text-[#6e533c] font-bold'
                                        : slaEv.status === 'at_risk'
                                        ? 'text-[#8c6d53] font-semibold'
                                        : 'text-[#5c5954]'
                                    }
                                  >
                                    {slaEv.shortLabel} ({slaEv.targetHours}h)
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`capitalize font-semibold px-2.5 py-0.5 rounded-full border ${
                                      isResolved
                                        ? 'bg-[#e6f4ea] text-[#2f6b45] border-[#c6e6d0]'
                                        : 'bg-[#f5efe8] text-[#6e533c] border-[#d6c2b0]'
                                    }`}
                                  >
                                    {formatStatus(t.status)}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-[#262523]">{t.requester_name}</td>
                                <td className="px-5 py-3.5 text-right">
                                  <button className="text-[#8c6d53] font-bold hover:underline cursor-pointer">Inspect</button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY AUDIT LOG TAB */}
            {activeNav === 'security_audit' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[#262523]">Security Audit Log</h2>
                    <p className="text-xs text-[#5c5954] mt-0.5">
                      Immutable audit trail of role assignments, account approvals, suspensions, and SLA policy updates
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveNav('settings')}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#f5efe8] text-[#5c5954] hover:text-[#6e533c] border border-[#e2dfd9] text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 calm-btn"
                    >
                      Configure SLA Targets
                    </button>
                    <button
                      onClick={handleExportAuditCSV}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 calm-btn"
                    >
                      <Download className="size-3.5" />
                      <span>Export Audit CSV</span>
                    </button>
                  </div>
                </div>

                {/* Audit KPI Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-4">
                    <p className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider">Total Logged Events</p>
                    <p className="text-2xl font-bold text-[#262523] mt-2 font-mono tabular-nums">{animAuditTotal}</p>
                    <p className="text-[11px] text-[#8c8881] mt-1">All tracked security mutations</p>
                  </div>
                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-4">
                    <p className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider">Role Modifications</p>
                    <p className="text-2xl font-bold text-[#8c6d53] mt-2 font-mono tabular-nums">{animRoleChanges}</p>
                    <p className="text-[11px] text-[#8c8881] mt-1">Privilege & portal assignments</p>
                  </div>
                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-4">
                    <p className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider">Approvals & Access</p>
                    <p className="text-2xl font-bold text-[#2f6b45] mt-2 font-mono tabular-nums">{animApprovalActions}</p>
                    <p className="text-[11px] text-[#8c8881] mt-1">Approvals, suspensions & removals</p>
                  </div>
                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-4">
                    <p className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider">SLA & Profile Changes</p>
                    <p className="text-2xl font-bold text-[#262523] mt-2 font-mono tabular-nums">{animPolicyChanges}</p>
                    <p className="text-[11px] text-[#8c8881] mt-1">Custom SLA & account edits</p>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white border border-[#e2dfd9] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                    {[
                      { id: 'all', label: 'All Events' },
                      { id: 'role', label: 'Role Changes' },
                      { id: 'approval', label: 'Approvals' },
                      { id: 'status', label: 'Suspensions & Removals' },
                      { id: 'policy', label: 'SLA Policy' },
                      { id: 'profile', label: 'Profile Edits' },
                    ].map((tab) => {
                      const active = auditCategoryFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setAuditCategoryFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-[#8c6d53] text-white'
                              : 'bg-[#f4f4f2] text-[#5c5954] hover:text-[#262523] hover:bg-[#ebe9e4]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full lg:w-72">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8881]" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Filter by actor, target, or details..."
                      className="w-full rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] focus:bg-white pl-9 pr-3 py-1.5 text-xs text-[#262523] outline-none focus:border-[#8c6d53]"
                    />
                  </div>
                </div>

                {/* Audit Table */}
                <div className="bg-white border border-[#e2dfd9] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#e2dfd9] bg-[#f4f4f2] font-bold uppercase tracking-wider text-[#5c5954] text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5">Audit ID</th>
                          <th className="px-5 py-3.5">Event</th>
                          <th className="px-5 py-3.5">Actor</th>
                          <th className="px-5 py-3.5">Target Account / Resource</th>
                          <th className="px-5 py-3.5">State Change & Summary</th>
                          <th className="px-5 py-3.5 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebe9e4]">
                        {filteredAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#5c5954]">
                              <ShieldCheck className="size-8 text-[#8c8881] mx-auto mb-2" />
                              <p className="font-bold text-[#262523] text-sm">No matching audit entries</p>
                              <p className="text-[#8c8881] mt-1">Role changes, user approvals, and SLA updates will be recorded here automatically.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredAuditLogs.map((entry) => {
                            const isPositive =
                              entry.action === 'USER_APPROVED' || entry.action === 'USER_RESTORED';
                            return (
                              <tr key={entry.id} className="hover:bg-[#f4f4f2]/60 transition-colors">
                                <td className="px-5 py-3.5 font-mono font-bold text-[#8c6d53] tabular-nums whitespace-nowrap">
                                  {entry.id}
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span
                                    className={`font-semibold text-[11px] ${
                                      isPositive ? 'text-[#2f6b45]' : 'text-[#6e533c]'
                                    }`}
                                  >
                                    {entry.action.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <p className="font-bold text-[#262523]">{entry.actor_name}</p>
                                  <p className="text-[11px] text-[#8c8881] font-mono">{entry.actor_email}</p>
                                </td>
                                <td className="px-5 py-3.5">
                                  <p className="font-bold text-[#262523]">{entry.target_name}</p>
                                  <p className="text-[11px] text-[#8c8881] font-mono">{entry.target_email}</p>
                                </td>
                                <td className="px-5 py-3.5">
                                  {entry.previous_value && entry.new_value && (
                                    <div className="text-[11px] font-mono text-[#6e533c] mb-0.5 tabular-nums">
                                      <span>{entry.previous_value}</span>
                                      <span className="mx-1.5 text-[#8c8881]">→</span>
                                      <span className="font-bold">{entry.new_value}</span>
                                    </div>
                                  )}
                                  <p className="text-xs text-[#5c5954]">{entry.details}</p>
                                </td>
                                <td className="px-5 py-3.5 text-right font-mono text-[11px] text-[#8c8881] tabular-nums whitespace-nowrap">
                                  {new Date(entry.created_at).toLocaleString([], {
                                    month: 'short',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* AI GOVERNANCE & COMPLIANCE TAB */}
            {activeNav === 'governance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#262523]">AI Governance & Compliance</h2>
                  <p className="text-xs text-[#5c5954] mt-1">Manage AI decision boundaries, automated workflows, and data ethics.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-3 border-b border-[#ebe9e4] pb-4">
                      <Cpu className="size-5 text-[#8c6d53]" />
                      <h3 className="font-bold text-[#262523] text-sm">Automated Workflow Engine</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[#f4f4f2] border border-[#e2dfd9] rounded-xl">
                        <div>
                          <p className="font-bold text-[#262523] text-xs">High-Priority Escalation</p>
                          <p className="text-[11px] text-[#5c5954] mt-0.5">Auto-escalate tickets assessed as Critical with &gt; 80% confidence</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] font-bold text-[10px]">ACTIVE</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#f4f4f2] border border-[#e2dfd9] rounded-xl">
                        <div>
                          <p className="font-bold text-[#262523] text-xs">Draft Response Generation</p>
                          <p className="text-[11px] text-[#5c5954] mt-0.5">Pre-generate contextually aware AI responses for Technician review</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] font-bold text-[10px]">ACTIVE</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e2dfd9] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-3 border-b border-[#ebe9e4] pb-4">
                      <ShieldCheck className="size-5 text-[#8c6d53]" />
                      <h3 className="font-bold text-[#262523] text-sm">Responsible AI & Data Privacy</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[#f4f4f2] border border-[#e2dfd9] rounded-xl">
                        <div>
                          <p className="font-bold text-[#262523] text-xs">Human-in-the-loop (HITL)</p>
                          <p className="text-[11px] text-[#5c5954] mt-0.5">AI drafts require manual technician approval before dispatch</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#f5efe8] text-[#6e533c] border border-[#d6c2b0] font-bold text-[10px]">ENFORCED</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#f4f4f2] border border-[#e2dfd9] rounded-xl">
                        <div>
                          <p className="font-bold text-[#262523] text-xs">Data Retention & PII Scrubbing</p>
                          <p className="text-[11px] text-[#5c5954] mt-0.5">Automated redaction of sensitive customer info in training datasets</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] font-bold text-[10px]">COMPLIANT</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#e2dfd9] rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-[#262523] text-sm">Recent AI Decisions Log</h3>
                  <div className="border border-[#e2dfd9] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f4f4f2] border-b border-[#e2dfd9]">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-[#5c5954]">TICKET ID</th>
                          <th className="px-4 py-3 font-semibold text-[#5c5954]">AI ASSESSMENT</th>
                          <th className="px-4 py-3 font-semibold text-[#5c5954]">CONFIDENCE</th>
                          <th className="px-4 py-3 font-semibold text-[#5c5954]">REASONING AUDIT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebe9e4]">
                        {tickets.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-[#f4f4f2]/50">
                            <td className="px-4 py-3 font-mono font-semibold text-[#262523]">{t.id}</td>
                            <td className="px-4 py-3">
                              <span className="capitalize font-medium text-[#5c5954]">{t.ai_suggested_priority || t.priority}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-mono font-semibold tabular-nums ${(t.ai_confidence || 0) > 0.8 ? 'text-[#2f6b45]' : 'text-[#6e533c]'}`}>
                                {Math.round((t.ai_confidence || 0) * 100)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#5c5954] truncate max-w-[300px]">
                              {t.ai_reasoning || 'Standard categorization'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* AUDIT LOG / EMAIL OUTBOX TAB */}
            {activeNav === 'audit' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#262523]">Email Outbox & Delivery Logs</h2>
                    <p className="text-xs text-[#5c5954]">Live dispatch log of verification codes, ticket alerts, and admin notices</p>
                  </div>
                  <button
                    onClick={() => setIsOutboxOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white text-xs font-semibold cursor-pointer calm-btn"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Open Full Viewer</span>
                  </button>
                </div>

                <div className="bg-white border border-[#e2dfd9] rounded-2xl overflow-hidden divide-y divide-[#ebe9e4]">
                  {outbox.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#8c8881]">No email records in outbox yet.</div>
                  ) : (
                    outbox.map((mail) => (
                      <div key={mail.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f4f4f2]/50 transition-colors">
                        <div>
                          <p className="font-bold text-[#262523] text-xs">{mail.subject}</p>
                          <p className="text-[11px] text-[#8c8881] font-mono">
                            To: {mail.to} · {new Date(mail.created_at).toLocaleString()}
                          </p>
                          {mail.payload && (
                            <p className="text-[11px] text-[#5c5954] mt-1 font-mono bg-[#f4f4f2] p-2 rounded border border-[#e2dfd9] line-clamp-2">
                              {mail.payload}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] font-bold px-2.5 py-0.5 text-[10px] self-start sm:self-auto">
                          SENT
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* REPORTS TAB */}
            {activeNav === 'reports' && (
              <div className="space-y-5">
                <div className="bg-white border border-[#e2dfd9] rounded-2xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-[#262523]">Enterprise Reports & SLA Insights</h2>
                      <p className="text-xs text-[#5c5954] mt-0.5">
                        Live SLA compliance metrics evaluated against your custom priority thresholds ({slaConfig.urgent}h / {slaConfig.high}h / {slaConfig.medium}h / {slaConfig.low}h).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveNav('settings')}
                        className="px-3.5 py-2.5 rounded-xl bg-[#f4f4f2] hover:bg-[#ebe9e4] text-[#262523] border border-[#e2dfd9] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 calm-btn"
                      >
                        Edit SLA Thresholds
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white px-4 py-2.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 calm-btn"
                      >
                        <Download className="size-4" /> Download Requests CSV
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#ebe9e4]">
                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9]">
                      <p className="text-[11px] font-bold text-[#5c5954] uppercase">SLA Compliance Rate</p>
                      <p className="text-2xl font-bold text-[#2f6b45] mt-1 font-mono tabular-nums">{slaSummary.complianceRate}%</p>
                      <p className="text-[11px] text-[#8c8881] mt-0.5">Tickets within target window</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9]">
                      <p className="text-[11px] font-bold text-[#5c5954] uppercase">On Track / Met SLA</p>
                      <p className="text-2xl font-bold text-[#2f6b45] mt-1 font-mono tabular-nums">{slaSummary.compliantCount}</p>
                      <p className="text-[11px] text-[#8c8881] mt-0.5">Nominal resolution pace</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9]">
                      <p className="text-[11px] font-bold text-[#5c5954] uppercase">Approaching Threshold</p>
                      <p className="text-2xl font-bold text-[#8c6d53] mt-1 font-mono tabular-nums">{slaSummary.atRiskCount}</p>
                      <p className="text-[11px] text-[#8c8881] mt-0.5">&ge; 75% of target elapsed</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9]">
                      <p className="text-[11px] font-bold text-[#5c5954] uppercase">Overdue / Late</p>
                      <p className="text-2xl font-bold text-[#6e533c] mt-1 font-mono tabular-nums">{slaSummary.breachedCount}</p>
                      <p className="text-[11px] text-[#8c8881] mt-0.5">Exceeded priority target</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeNav === 'settings' && (
              <div className="space-y-5">
                {/* Custom SLA Target Thresholds Configuration */}
                <form
                  onSubmit={handleSaveSLATargets}
                  className="bg-white border border-[#e2dfd9] rounded-2xl p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ebe9e4] pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#262523]">Custom SLA Target Thresholds</h2>
                      <p className="text-xs text-[#5c5954] mt-0.5">
                        Configure target resolution hours for each ticket priority level. Updates apply immediately across Technician and Admin views and are logged in the Security Audit Log.
                      </p>
                    </div>
                    <div className="text-xs font-mono text-[#8c8881] tabular-nums shrink-0">
                      Last updated: {new Date(slaConfig.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#262523]">Urgent Priority (P1)</label>
                        <span className="text-[11px] font-mono text-[#6e533c] tabular-nums">Target Hours</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="168"
                        value={slaForm.urgent}
                        onChange={(e) => setSlaForm((prev) => ({ ...prev, urgent: parseFloat(e.target.value) || 0.5 }))}
                        className="w-full rounded-lg border border-[#d6c2b0] bg-white px-3 py-2 text-sm font-mono font-bold text-[#262523] tabular-nums outline-none focus:border-[#8c6d53]"
                      />
                      <p className="text-[11px] text-[#8c8881]">Critical system outages &amp; escalations</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#262523]">High Priority (P2)</label>
                        <span className="text-[11px] font-mono text-[#6e533c] tabular-nums">Target Hours</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="168"
                        value={slaForm.high}
                        onChange={(e) => setSlaForm((prev) => ({ ...prev, high: parseFloat(e.target.value) || 1 }))}
                        className="w-full rounded-lg border border-[#e2dfd9] bg-white px-3 py-2 text-sm font-mono font-bold text-[#262523] tabular-nums outline-none focus:border-[#8c6d53]"
                      />
                      <p className="text-[11px] text-[#8c8881]">Blocked workflows &amp; security alerts</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#262523]">Medium Priority (P3)</label>
                        <span className="text-[11px] font-mono text-[#5c5954] tabular-nums">Target Hours</span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="336"
                        value={slaForm.medium}
                        onChange={(e) => setSlaForm((prev) => ({ ...prev, medium: parseFloat(e.target.value) || 2 }))}
                        className="w-full rounded-lg border border-[#e2dfd9] bg-white px-3 py-2 text-sm font-mono font-bold text-[#262523] tabular-nums outline-none focus:border-[#8c6d53]"
                      />
                      <p className="text-[11px] text-[#8c8881]">Standard hardware &amp; software requests</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#262523]">Low Priority (P4)</label>
                        <span className="text-[11px] font-mono text-[#5c5954] tabular-nums">Target Hours</span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="720"
                        value={slaForm.low}
                        onChange={(e) => setSlaForm((prev) => ({ ...prev, low: parseFloat(e.target.value) || 4 }))}
                        className="w-full rounded-lg border border-[#e2dfd9] bg-white px-3 py-2 text-sm font-mono font-bold text-[#262523] tabular-nums outline-none focus:border-[#8c6d53]"
                      />
                      <p className="text-[11px] text-[#8c8881]">General inquiries &amp; routine provisioning</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        triggerElementPop(e.currentTarget);
                        resetSLAConfig();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f4f4f2] hover:bg-[#ebe9e4] text-[#5c5954] hover:text-[#262523] border border-[#e2dfd9] text-xs font-semibold cursor-pointer transition-colors calm-btn"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Reset Defaults (2h / 4h / 8h / 24h)</span>
                    </button>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white text-xs font-semibold cursor-pointer transition-colors calm-btn"
                    >
                      <Save className="size-3.5" />
                      <span>Save SLA Targets</span>
                    </button>
                  </div>
                </form>

                <div className="bg-white border border-[#e2dfd9] rounded-2xl p-6 space-y-4">
                  <h2 className="text-lg font-bold text-[#262523]">System Security & Access Settings</h2>
                  <div className="space-y-3 text-xs text-[#5c5954]">
                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#262523]">Mandatory Administrator Approval</p>
                        <p className="text-[#5c5954]">Require administrator confirmation before new users can log in</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] font-bold text-[10px]">
                        ENFORCED
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#262523]">Strict Role-Based Portal Isolation</p>
                        <p className="text-[#5c5954]">Lock Customers and Technicians to their dedicated workspaces while Admin retains full oversight</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] font-bold text-[10px]">
                        ENFORCED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#e2dfd9] rounded-2xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-[#262523]">Database Maintenance</h2>
                  <div className="p-4 rounded-xl bg-[#f4f4f2] border border-[#e2dfd9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#262523] text-xs">Clear Database Records</p>
                      <p className="text-[#5c5954] text-xs mt-0.5">Permanently remove all non-admin users, tickets, and messages.</p>
                    </div>
                    {confirmPurge ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            purgeAllData();
                            setConfirmPurge(false);
                          }}
                          className="px-3.5 py-2 bg-[#6e533c] hover:bg-[#59422f] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Confirm Clear All
                        </button>
                        <button
                          onClick={() => setConfirmPurge(false)}
                          className="px-3.5 py-2 bg-white border border-[#e2dfd9] text-[#5c5954] hover:text-[#262523] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmPurge(true)}
                        className="px-4 py-2 bg-white hover:bg-[#ebe9e4] text-[#5c5954] hover:text-[#262523] border border-[#d5d1c8] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Clear Database
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* INTEGRATIONS & API KEYS TABS */}
            {(activeNav === 'integrations' || activeNav === 'api') && (
              <div className="bg-white border border-[#e2dfd9] rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#262523] capitalize">{activeNav}</h2>
                <p className="text-xs text-[#5c5954] mt-1">Managed integration endpoints and active webhook secrets.</p>
              </div>
            )}
          </div>
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
