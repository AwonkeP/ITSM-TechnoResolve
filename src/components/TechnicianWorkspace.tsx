import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { CATEGORIES, getCategoryLabel, formatStatus, MACROS } from '../data/seedData';
import {
  Home, Ticket as TicketIcon, List, BarChart2, Settings,
  Bell, LogOut, Search, SlidersHorizontal, Copy, UserPlus,
  UserCheck, ArrowUpRight, CheckCircle, Lock, Send, Cpu, User,
  RefreshCw, CheckCircle2, Paperclip, Trash2, Download, FileText as FileIcon,
  Mic, Loader2, AlertCircle, Flame, AlertTriangle, Zap, Sun, Moon
} from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';
import { AssignAgentModal } from './AssignAgentModal';
import { motion, AnimatePresence } from 'motion/react';
import { useVoiceInput } from '../hooks/useVoiceInput';

export const TechnicianWorkspace: React.FC = () => {
  const {
    currentUser,
    tickets,
    messages,
    unreadCounts,
    markTicketRead,
    updateTicket,
    sendMessage,
    draftAIReply,
    signOut,
    unreadNotificationsCount,
    setIsNotificationCenterOpen,
    showToast,
  } = useApp();

  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'new' | 'in_progress' | 'escalated' | 'resolved' | 'dashboard' | 'reports'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [inspectorTab, setInspectorTab] = useState<'discussion' | 'ai_intel' | 'requester'>('discussion');
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [composerAttachments, setComposerAttachments] = useState<{ id: string; file: File; previewUrl: string; size: number }[]>([]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('tech_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('tech_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleTechFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray: File[] = Array.from(e.target.files);
      const newAtts = filesArray.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
        size: file.size,
      }));
      setComposerAttachments((prev) => [...prev, ...newAtts]);
    }
  };

  const removeTechAttachment = (id: string) => {
    setComposerAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const {
    isListening,
    isTranscribing,
    interimText,
    audioLevel,
    recordingSeconds,
    error: speechError,
    clearError: clearSpeechError,
    toggleVoiceInput,
    stopVoiceInput,
  } = useVoiceInput({
    onTranscript: (spokenText) => {
      setReplyText((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${spokenText}` : spokenText;
      });
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inspectorTab === 'discussion') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, selectedTicketId, inspectorTab]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const isResolved = t.status === 'resolved' || t.status === 'closed';

      if (filterMode === 'mine') {
        if (isResolved) return false;
        const isMine = t.assigned_to === currentUser?.id || t.assigned_name?.toLowerCase().includes('marcus') || (currentUser?.full_name && t.assigned_name === currentUser.full_name);
        if (!isMine) return false;
      } else if (filterMode === 'all') {
        if (isResolved) return false;
      } else if (filterMode === 'new') {
        if (t.status !== 'new') return false;
      } else if (filterMode === 'in_progress') {
        if (t.status !== 'in_progress' && t.status !== 'pending_user') return false;
      } else if (filterMode === 'escalated') {
        if (isResolved) return false;
        if (t.status !== 'escalated' && t.priority !== 'urgent') return false;
      } else if (filterMode === 'resolved') {
        if (!isResolved) return false;
      }

      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.requester_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, filterMode, categoryFilter, priorityFilter, statusFilter, searchQuery, currentUser]);

  useEffect(() => {
    if (!selectedTicketId || !filteredTickets.some((t) => t.id === selectedTicketId)) {
      if (filteredTickets.length > 0) {
        setSelectedTicketId(filteredTickets[0].id);
      } else {
        setSelectedTicketId(null);
      }
    }
  }, [filteredTickets, selectedTicketId]);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;
  const activeTicketId = activeTicket?.id;

  useEffect(() => {
    if (activeTicketId) {
      markTicketRead(activeTicketId);
    }
  }, [activeTicketId, markTicketRead]);

  const activeMessages = messages.filter((m) => m.ticket_id === selectedTicketId);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || (!replyText.trim() && composerAttachments.length === 0)) return;

    try {
      const processedAttachments = await Promise.all(
        composerAttachments.map(async (att) => {
          let url = att.previewUrl;
          if (att.size < 500000) {
            url = await fileToBase64(att.file);
          }
          return {
            id: att.id,
            name: att.file.name,
            size: att.size,
            type: att.file.type,
            url: url,
          };
        })
      );

      await sendMessage(activeTicket.id, replyText.trim(), isInternal, processedAttachments);
      setReplyText('');
      setComposerAttachments([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIDraft = async () => {
    if (!activeTicket) return;
    setIsDrafting(true);
    try {
      const draft = await draftAIReply(activeTicket.id);
      if (draft) {
        setReplyText(draft);
        setIsInternal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!activeTicket) return;
    setIsUpdatingStatus(true);
    try {
      const isMarkingResolved = newStatus === 'resolved' || newStatus === 'closed';
      await updateTicket(activeTicket.id, { 
        status: newStatus,
        ...(isMarkingResolved ? { resolved_at: new Date().toISOString() } : {})
      });
      if (isMarkingResolved) {
        showToast(`Ticket ${activeTicket.id} marked as resolved and moved to Resolved section.`, 'success');
      } else {
        showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'info');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!activeTicket) return;
    await updateTicket(activeTicket.id, {
      status: activeTicket.status === 'new' ? 'in_progress' : activeTicket.status,
      assigned_to: currentUser?.id,
      assigned_name: currentUser?.full_name || 'Support Technician',
    });
    showToast(`Ticket ${activeTicket.id} assigned to you`, 'success');
  };

  const handleEscalate = async () => {
    if (!activeTicket) return;
    await updateTicket(activeTicket.id, { status: 'escalated', priority: 'urgent' });
    showToast(`Ticket ${activeTicket.id} escalated with Urgent priority`, 'warning');
  };

  const handleResolve = async () => {
    if (!activeTicket) return;
    const ticketId = activeTicket.id;
    await updateTicket(ticketId, { 
      status: 'resolved', 
      resolved_at: new Date().toISOString() 
    });
    showToast(`Ticket ${ticketId} resolved and moved to Resolved section`, 'success');
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <motion.span
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs relative overflow-hidden"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <Flame className="size-3 text-red-600 shrink-0 animate-pulse" />
            <span className="tracking-wide uppercase text-[9px] font-black">Urgent</span>
          </motion.span>
        );
      case 'high':
        return (
          <motion.span
            animate={{
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-2xs"
          >
            <span className="size-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            <AlertTriangle className="size-3 text-amber-600 shrink-0" />
            <span className="capitalize font-bold">High</span>
          </motion.span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            <span className="size-1.5 rounded-full bg-yellow-400 shrink-0" />
            <span className="capitalize">Medium</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-medium">
            <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
            <span className="capitalize">Low</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    if (status === 'resolved' || status === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
          <span>Resolved</span>
        </span>
      );
    } else if (status === 'escalated') {
      return (
        <motion.span
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              '0 0 0 0 rgba(225, 29, 72, 0)',
              '0 0 0 4px rgba(225, 29, 72, 0.25)',
              '0 0 0 0 rgba(225, 29, 72, 0)',
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider relative"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          <ArrowUpRight className="size-3 text-rose-600 stroke-[2.5] shrink-0" />
          <span>Escalated</span>
        </motion.span>
      );
    } else if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <span className="size-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span>In Progress</span>
        </span>
      );
    } else if (status === 'pending_user') {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <span className="size-1.5 rounded-full bg-purple-400 shrink-0" />
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
        <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
        <span>New</span>
      </span>
    );
  };

  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
  const myTicketsCount = openTickets.filter(t => t.assigned_to === currentUser?.id || t.assigned_name?.toLowerCase().includes('marcus') || (currentUser?.full_name && t.assigned_name === currentUser.full_name)).length;
  const teamQueueCount = openTickets.length;
  const escalatedCount = openTickets.filter(t => t.status === 'escalated' || t.priority === 'urgent').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-200 ${isDarkMode ? 'bg-[#0b1120] text-slate-100' : 'bg-white text-slate-900'}`}>
      
      {/* 1. LEFT SIDEBAR */}
      <aside className={`w-[200px] border-r flex flex-col shrink-0 transition-colors duration-200 ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        {/* Logo */}
        <div className="h-12 flex items-center px-4 gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
             <span className="text-lg font-black text-blue-500">T</span>
             <div className="leading-tight">
               <h1 className={`font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Technician</h1>
               <h1 className={`font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Cockpit</h1>
             </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">

          <button onClick={() => setFilterMode('mine')} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMode === 'mine' ? (isDarkMode ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-800/60' : 'bg-blue-100/50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}>
            <div className="flex items-center gap-3"><TicketIcon className="size-3.5" /> My Tickets</div>
            {myTicketsCount > 0 && <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">{myTicketsCount}</span>}
          </button>
          
          <button onClick={() => setFilterMode('all')} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMode === 'all' ? (isDarkMode ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-blue-100 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}>
            <div className="flex items-center gap-3"><List className="size-3.5" /> Team Queue</div>
            {teamQueueCount > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{teamQueueCount}</span>}
          </button>

          <button onClick={() => setFilterMode('escalated')} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMode === 'escalated' ? (isDarkMode ? 'bg-rose-950/80 text-rose-200 font-bold border border-rose-800' : 'bg-rose-100 text-rose-800 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}>
            <div className="flex items-center gap-3"><ArrowUpRight className="size-3.5 text-rose-500" /> Escalated</div>
            {escalatedCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1"
              >
                <Flame className="size-2.5" />
                {escalatedCount}
              </motion.span>
            )}
          </button>

          <button onClick={() => setFilterMode('resolved')} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMode === 'resolved' ? (isDarkMode ? 'bg-emerald-950/80 text-emerald-200 font-bold border border-emerald-800' : 'bg-emerald-100 text-emerald-800 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}>
            <div className="flex items-center gap-3"><CheckCircle2 className="size-3.5 text-emerald-500" /> Resolved</div>
            {resolvedCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                {resolvedCount}
              </span>
            )}
          </button>

        </nav>

        {/* Sidebar Dark Mode Quick Toggle */}
        <div className={`p-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? <Sun className="size-3.5 text-amber-400" /> : <Moon className="size-3.5 text-slate-600" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className={`h-12 border-b flex items-center justify-end px-4 gap-3 shrink-0 transition-colors duration-200 ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
          <RoleSwitcher />

          {/* Theme Toggle in Header */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDarkMode ? <Sun className="size-3.5 text-amber-400" /> : <Moon className="size-3.5 text-slate-600" />}
            <span className="text-[11px] font-bold">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
          
          <div className={`flex items-center gap-3 border rounded-full py-1.5 px-3 ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
             <div className={`size-6 rounded-full text-[10px] flex items-center justify-center text-xs font-bold uppercase ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-300 text-slate-700'}`}>
                {currentUser?.full_name?.charAt(0) || 'A'}
             </div>
             <div className="leading-tight pr-2 text-left">
               <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{currentUser?.full_name || 'Avumile Tati'}</p>
               <div className="flex items-center gap-1">
                 <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live Cloud Sync</p>
                 <span className="size-1.5 rounded-full bg-emerald-500"></span>
               </div>
             </div>
             <Settings className={`size-3.5 cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`} />
          </div>
          
          <button onClick={() => setIsNotificationCenterOpen(true)} className={`relative p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Bell className="size-5" />
            <span className="absolute top-1.5 right-1.5 size-3.5 bg-blue-600 border-2 border-white rounded-full text-[8px] font-bold text-white flex items-center justify-center">1</span>
          </button>

          <button onClick={signOut} className={`flex items-center gap-2 text-sm font-semibold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'}`}>
            <LogOut className="size-3.5" /> Sign Out
          </button>
        </header>

        {/* 3. WORKSPACE AREA (Middle & Right Columns) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Middle Column: Ticket List */}
          <div className={`w-[280px] border-r flex flex-col shrink-0 transition-colors duration-200 ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
            {/* Search/Filter Header */}
            <div className={`p-3 border-b space-y-2.5 shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Tickets Queue</h2>
                <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {filteredTickets.length} of {tickets.length}
                </span>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className={`size-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, title, user..."
                    className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500' 
                        : 'border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  title="Advanced Filters"
                  className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                    showFilters 
                      ? isDarkMode ? 'border-blue-500 bg-blue-950/60 text-blue-300' : 'border-blue-500 bg-blue-50 text-blue-600'
                      : isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                   <SlidersHorizontal className="size-3.5" />
                </button>
              </div>

              {/* Quick Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded-md font-semibold shrink-0 transition-colors cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({teamQueueCount})
                </button>
                <button
                  onClick={() => setFilterMode('mine')}
                  className={`px-2 py-0.5 rounded-md font-semibold shrink-0 transition-colors cursor-pointer ${
                    filterMode === 'mine'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Mine ({myTicketsCount})
                </button>
                <button
                  onClick={() => setFilterMode('escalated')}
                  className={`px-2 py-0.5 rounded-md font-semibold shrink-0 flex items-center gap-1 transition-colors cursor-pointer ${
                    filterMode === 'escalated'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : isDarkMode ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/60' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                  }`}
                >
                  <Flame className="size-2.5" />
                  Escalated ({escalatedCount})
                </button>
                <button
                  onClick={() => setFilterMode('resolved')}
                  className={`px-2 py-0.5 rounded-md font-semibold shrink-0 flex items-center gap-1 transition-colors cursor-pointer ${
                    filterMode === 'resolved'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : isDarkMode ? 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  <CheckCircle2 className="size-2.5" />
                  Resolved ({resolvedCount})
                </button>
              </div>
              
              {showFilters && (
                <div className={`pt-2 space-y-3 border-t mt-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className={`w-full p-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                      >
                        <option value="all">All</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-100' : 'bg-white border-slate-200'}`}
                      >
                        <option value="all">All</option>
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending_user">Pending</option>
                        <option value="escalated">Escalated</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  
                  {(categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
                    <button 
                      onClick={() => {
                        setCategoryFilter('all');
                        setPriorityFilter('all');
                        setStatusFilter('all');
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-200 w-full text-right cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* List */}
            <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${isDarkMode ? 'bg-[#0b1120]' : 'bg-slate-50/50'}`}>
              {filteredTickets.map(ticket => {
                const isSelected = ticket.id === selectedTicketId;
                const isUrgent = ticket.priority === 'urgent';
                const isEscalated = ticket.status === 'escalated';
                const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

                return (
                  <motion.div
                    key={ticket.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? isUrgent || isEscalated
                          ? isDarkMode ? 'border-red-500 bg-red-950/40 shadow-sm border-l-4 border-l-red-500 ring-1 ring-red-500/30' : 'border-red-400 bg-red-50/40 shadow-sm border-l-4 border-l-red-500'
                          : isResolved
                          ? isDarkMode ? 'border-emerald-500 bg-emerald-950/40 shadow-sm border-l-4 border-l-emerald-500 ring-1 ring-emerald-500/30' : 'border-emerald-400 bg-emerald-50/40 shadow-sm border-l-4 border-l-emerald-500'
                          : isDarkMode ? 'border-blue-500 bg-[#1e293b] shadow-md ring-1 ring-blue-500/40 text-slate-100' : 'border-blue-300 bg-blue-50 shadow-sm'
                        : isUrgent || isEscalated
                        ? isDarkMode ? 'border-red-900/60 bg-red-950/20 border-l-4 border-l-red-500 hover:border-red-800' : 'border-red-200/90 bg-red-50/20 border-l-4 border-l-red-500 hover:border-red-300'
                        : isResolved
                        ? isDarkMode ? 'border-emerald-900/60 bg-emerald-950/20 border-l-4 border-l-emerald-500 hover:border-emerald-800' : 'border-emerald-200/80 bg-emerald-50/15 border-l-4 border-l-emerald-500 hover:border-emerald-300'
                        : isDarkMode ? 'border-slate-800 bg-[#1e293b]/70 hover:border-slate-700 text-slate-200' : 'border-slate-200 bg-white hover:border-blue-200'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`size-6 rounded-full text-[10px] shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs ${
                        isUrgent || isEscalated 
                          ? 'bg-red-500/20 text-red-400' 
                          : isResolved
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-500'
                      }`}>
                         {isResolved ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : ticket.requester_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                           <span className={`font-bold text-sm line-clamp-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{ticket.id}</span>
                           {isResolved && (
                             <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isDarkMode ? 'bg-emerald-900/60 text-emerald-300' : 'text-emerald-700 bg-emerald-100'}`}>
                               Resolved
                             </span>
                           )}
                        </div>
                        <p className={`text-sm font-semibold line-clamp-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{ticket.title}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{getCategoryLabel(ticket.category)}</p>
                        <div className="flex items-center justify-between pt-2">
                           {getPriorityBadge(ticket.priority)}
                           {getStatusBadge(ticket.status)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filteredTickets.length === 0 && (
                <div className={`text-center p-8 text-sm space-y-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`size-8 mx-auto ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>No tickets found</p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {filterMode === 'resolved'
                      ? 'No tickets currently marked as resolved.'
                      : 'Try adjusting your filters or search query.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Ticket Details */}
          <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-200 ${isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-white text-slate-900'}`}>
            {activeTicket ? (
              <>
                {/* Details Header */}
                <div className={`p-3 border-b shrink-0 space-y-4 ${isDarkMode ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-white'}`}>
                  {/* Title */}
                  <div className="flex items-center flex-wrap gap-3">
                    <h2 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activeTicket.title}</h2>
                    {getPriorityBadge(activeTicket.priority)}
                    {getStatusBadge(activeTicket.status)}
                  </div>

                  {/* 3 Data Columns */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                         <User className="size-3.5" /> Requester
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`size-6 rounded-full text-[10px] flex items-center justify-center font-bold uppercase ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                          {activeTicket.requester_name.charAt(0)}
                        </div>
                        <div className="leading-tight">
                          <p className={`font-bold text-xs ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activeTicket.requester_name}</p>
                          <div className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {activeTicket.requester_email} <Copy className="size-3 cursor-pointer hover:text-blue-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                         <UserCheck className="size-3.5" /> Assignee
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`size-6 rounded-full text-[10px] flex items-center justify-center font-bold uppercase ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                           {activeTicket.assigned_name ? activeTicket.assigned_name.charAt(0) : '?'}
                        </div>
                        <div className="leading-tight">
                          <p className={`font-bold text-xs ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activeTicket.assigned_name || 'Unassigned'}</p>
                          <button onClick={() => setIsAssignModalOpen(true)} className="text-xs text-blue-400 font-bold hover:underline cursor-pointer">Assign Agent</button>
                        </div>
                      </div>
                    </div>

                    <div className={`space-y-1 text-xs border-l pl-6 ${isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                       <div className={`flex items-center gap-1.5 font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                         <TicketIcon className="size-3.5" /> Ticket Info
                       </div>
                       <p className="flex justify-between"><span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Category:</span> <span className={`font-medium capitalize ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{activeTicket.category}</span></p>
                       <p className="flex justify-between"><span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Created Date:</span> <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{new Date(activeTicket.created_at).toLocaleDateString()}</span></p>
                       <p className="flex justify-between items-center"><span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>SLA Status:</span> <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold text-[10px]">Green</span></p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className={`flex items-center justify-between px-4 border-b shrink-0 ${isDarkMode ? 'border-slate-800 bg-[#0f172a]' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setInspectorTab('discussion')} className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${inspectorTab === 'discussion' ? 'border-blue-500 text-blue-400' : isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                      Activity Feed
                    </button>
                    <button onClick={() => setInspectorTab('ai_intel')} className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${inspectorTab === 'ai_intel' ? 'border-blue-500 text-blue-400' : isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                      AI Insights (91%)
                    </button>
                    <button onClick={() => setInspectorTab('requester')} className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${inspectorTab === 'requester' ? 'border-blue-500 text-blue-400' : isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                      Requester Profile
                    </button>
                  </div>
                  
                  <select 
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className={`border rounded-lg px-2 py-1 text-xs font-medium outline-none cursor-pointer ${
                      isDarkMode 
                        ? 'bg-[#1e293b] border-slate-700 text-slate-200' 
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <option value="new">Status: New</option>
                    <option value="in_progress">Status: In Progress</option>
                    <option value="escalated">Status: Escalated</option>
                    <option value="resolved">Status: Resolved</option>
                  </select>
                </div>

                {/* Main Content Area based on Tab */}
                {inspectorTab === 'discussion' && (
                  <div className={`flex-1 flex flex-col min-h-0 ${isDarkMode ? 'bg-[#070b14]' : 'bg-[#f8fafc]'}`}>
                    
                    {/* Resolution Banner */}
                    {(activeTicket.status === 'resolved' || activeTicket.status === 'closed') && (
                      <div className={`mx-4 mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-2xs ${
                        isDarkMode 
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <div>
                            <p className="font-bold">Ticket Marked as Resolved</p>
                            <p className={`text-[11px] ${isDarkMode ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
                              {activeTicket.resolved_at 
                                ? `Resolved on ${new Date(activeTicket.resolved_at).toLocaleString()}` 
                                : 'This request is successfully resolved.'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleStatusChange('in_progress')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                        >
                          Reopen Ticket
                        </button>
                      </div>
                    )}

                    {/* Chat Area & Floating Actions */}
                    <div className="flex-1 flex overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                         
                         {/* Customer Original Ticket Request - White bubble on the Left, filling full width */}
                         <div className="flex gap-3 justify-start items-start w-full">
                           <div className={`size-7 rounded-full text-xs shrink-0 flex items-center justify-center font-bold shadow-2xs ${
                             isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700 border border-slate-300'
                           }`}>
                             {activeTicket.requester_name.charAt(0)}
                           </div>
                           <div className="flex-1 min-w-0 space-y-1 text-left">
                             <div className="flex items-center gap-2">
                               <span className={`font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{activeTicket.requester_name}</span>
                               <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                 Customer
                               </span>
                               <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>· {new Date(activeTicket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <div className={`w-full p-3.5 rounded-2xl rounded-tl-xs text-xs whitespace-pre-wrap leading-relaxed shadow-xs border ${
                               isDarkMode 
                                 ? 'bg-[#1e293b] text-slate-100 border-slate-700' 
                                 : 'bg-white text-slate-900 border-slate-200/90'
                             }`}>
                               <div className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                                 <span className="inline-block size-1.5 rounded-full bg-slate-400"></span>
                                 <span>Original Ticket Request</span>
                               </div>
                               {activeTicket.description}

                               {/* Initial Attachments */}
                               {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                                 <div className={`mt-2.5 pt-2 border-t space-y-1.5 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                   <p className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Attachments ({activeTicket.attachments.length})</p>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                     {activeTicket.attachments.map(att => (
                                       <a 
                                         key={att.id || att.name} 
                                         href={att.url} 
                                         download={att.name}
                                         target="_blank" 
                                         rel="noreferrer"
                                         className={`flex items-center gap-2 p-2 rounded-lg border transition-colors group ${
                                           isDarkMode 
                                             ? 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-blue-500' 
                                             : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                                         }`}
                                       >
                                         <div className={`size-7 rounded flex items-center justify-center shrink-0 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                                           {att.type?.startsWith('image/') ? (
                                             <img src={att.url} alt={att.name} className="size-full object-cover" />
                                           ) : (
                                             <FileIcon className="size-3.5 text-slate-400" />
                                           )}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                           <span className={`text-[11px] font-medium truncate block ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{att.name}</span>
                                           <span className="text-[10px] text-slate-400">{formatBytes(att.size)}</span>
                                         </div>
                                         <Download className="size-3 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                       </a>
                                     ))}
                                   </div>
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>

                         {/* Messages List */}
                         {activeMessages.map(msg => {
                           const isNote = msg.internal;

                           if (isNote) {
                             return (
                               <div key={msg.id} className="flex justify-center my-4 w-full">
                                  <div className={`flex items-start gap-2 max-w-2xl p-3 rounded-xl text-sm shadow-xs w-full border ${
                                    isDarkMode 
                                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' 
                                      : 'bg-amber-50 border-amber-200 text-amber-900'
                                  }`}>
                                     <Lock className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
                                     <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <p className={`font-bold text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>{msg.author_name} (Internal Note)</p>
                                          <span className={`text-[10px] ${isDarkMode ? 'text-amber-400/80' : 'text-amber-600/70'}`}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        {msg.body && <p className="text-xs whitespace-pre-wrap">{msg.body}</p>}

                                        {msg.attachments && msg.attachments.length > 0 && (
                                          <div className={`mt-2 pt-2 border-t space-y-1 ${isDarkMode ? 'border-amber-800/60' : 'border-amber-200/60'}`}>
                                            {msg.attachments.map(att => (
                                              <a 
                                                key={att.id || att.name} 
                                                href={att.url} 
                                                download={att.name}
                                                target="_blank" 
                                                rel="noreferrer"
                                                className={`flex items-center gap-2 p-1.5 rounded border transition-colors group ${
                                                  isDarkMode 
                                                    ? 'bg-slate-900/60 border-amber-800/60 hover:bg-slate-900 text-amber-200' 
                                                    : 'bg-white/70 border-amber-200 hover:bg-white text-amber-900'
                                                }`}
                                              >
                                                <FileIcon className="size-3 text-amber-500 shrink-0" />
                                                <span className="text-[11px] font-medium truncate flex-1">{att.name}</span>
                                                <Download className="size-3 opacity-60 group-hover:opacity-100 shrink-0" />
                                              </a>
                                            ))}
                                          </div>
                                        )}
                                     </div>
                                  </div>
                               </div>
                             );
                           }

                           // Differentiate Technician vs Customer:
                           // Technician is Blue on the Right. Customer is White on the Left.
                           const isTechnician = 
                             msg.author_role === 'technician' || 
                             msg.author_role === 'admin' || 
                             (activeTicket && msg.author_id !== activeTicket.requester_id && msg.author_role !== 'user');

                           if (isTechnician) {
                             return (
                               <div key={msg.id} className="flex w-full gap-3 items-start justify-end">
                                 <div className="max-w-[85%] sm:max-w-[88%] space-y-1 text-right">
                                   <div className="flex items-center gap-2 justify-end">
                                     <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                                       {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                     </span>
                                     <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                       Technician
                                     </span>
                                     <span className={`font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                                       {msg.author_name}
                                     </span>
                                   </div>

                                   {/* Message Bubble: BLUE for Technician */}
                                   <div className="p-3.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-xs text-left border bg-blue-600 text-white border-blue-600 rounded-tr-xs">
                                     {msg.body && <p>{msg.body}</p>}

                                     {/* Attachments rendering */}
                                     {msg.attachments && msg.attachments.length > 0 && (
                                       <div className="mt-2.5 pt-2 border-t border-blue-400/40 space-y-1.5">
                                         {msg.attachments.map(att => (
                                           <a 
                                             key={att.id || att.name} 
                                             href={att.url} 
                                             download={att.name}
                                             target="_blank" 
                                             rel="noreferrer"
                                             className="flex items-center gap-2 p-2 rounded-lg border bg-blue-700/70 border-blue-400/50 text-white hover:bg-blue-700 transition-colors group"
                                           >
                                             <div className="size-7 rounded flex items-center justify-center shrink-0 overflow-hidden bg-blue-800">
                                               {att.type?.startsWith('image/') ? (
                                                 <img src={att.url} alt={att.name} className="size-full object-cover" />
                                               ) : (
                                                 <FileIcon className="size-3.5 text-blue-200" />
                                               )}
                                             </div>
                                             <div className="flex-1 min-w-0 text-left">
                                               <p className="text-[11px] font-medium truncate">{att.name}</p>
                                               <p className="text-[9px] text-blue-200">{formatBytes(att.size)}</p>
                                             </div>
                                             <Download className="size-3 transition-colors shrink-0 text-blue-200 group-hover:text-white" />
                                           </a>
                                         ))}
                                       </div>
                                     )}
                                   </div>
                                 </div>

                                 {/* Technician Avatar on the far right */}
                                 <div className="size-7 rounded-full text-xs shrink-0 flex items-center justify-center font-bold shadow-2xs bg-blue-600 text-white">
                                   {msg.author_name.charAt(0)}
                                 </div>
                               </div>
                             );
                           }

                           // Customer message aligned to the Left
                           return (
                             <div key={msg.id} className="flex w-full gap-3 items-start justify-start">
                               {/* Customer Avatar */}
                               <div className={`size-7 rounded-full text-xs shrink-0 flex items-center justify-center font-bold shadow-2xs ${
                                 isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700 border border-slate-300'
                               }`}>
                                 {msg.author_name.charAt(0)}
                               </div>

                               <div className="max-w-[85%] sm:max-w-[88%] space-y-1 text-left">
                                 <div className="flex items-center gap-2 justify-start">
                                   <span className={`font-bold text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                                     {msg.author_name}
                                   </span>
                                   <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                     Customer
                                   </span>
                                   <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                     · {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   </span>
                                 </div>

                                 {/* Message Bubble: WHITE for Customer */}
                                 <div className={`p-3.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-xs text-left border ${
                                   isDarkMode 
                                     ? 'bg-[#1e293b] text-slate-100 border-slate-700 rounded-tl-xs' 
                                     : 'bg-white text-slate-900 border-slate-200/90 rounded-tl-xs'
                                 }`}>
                                   {msg.body && <p>{msg.body}</p>}

                                   {/* Attachments rendering */}
                                   {msg.attachments && msg.attachments.length > 0 && (
                                     <div className={`mt-2.5 pt-2 border-t space-y-1.5 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                       {msg.attachments.map(att => (
                                         <a 
                                           key={att.id || att.name} 
                                           href={att.url} 
                                           download={att.name}
                                           target="_blank" 
                                           rel="noreferrer"
                                           className={`flex items-center gap-2 p-2 rounded-lg border transition-colors group ${
                                             isDarkMode 
                                               ? 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-blue-500' 
                                               : 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-800'
                                           }`}
                                         >
                                           <div className={`size-7 rounded flex items-center justify-center shrink-0 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                                             {att.type?.startsWith('image/') ? (
                                               <img src={att.url} alt={att.name} className="size-full object-cover" />
                                             ) : (
                                               <FileIcon className="size-3.5 text-slate-400" />
                                             )}
                                           </div>
                                           <div className="flex-1 min-w-0 text-left">
                                             <p className="text-[11px] font-medium truncate">{att.name}</p>
                                             <p className="text-[9px] text-slate-400">{formatBytes(att.size)}</p>
                                           </div>
                                           <Download className="size-3 transition-colors shrink-0 text-slate-400 group-hover:text-blue-500" />
                                         </a>
                                       ))}
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                         <div ref={messagesEndRef} />
                      </div>

                      {/* Right Action Column */}
                      <div className={`w-16 border-l p-2 flex flex-col gap-2 shrink-0 items-center overflow-y-auto ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
                        <button onClick={() => setIsAssignModalOpen(true)} className={`w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors cursor-pointer ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}>
                           <UserPlus className="size-3.5 text-blue-400" />
                           <span className="text-[9px] font-bold text-center leading-tight">Assign<br/>Agent</span>
                        </button>
                        <button onClick={handleAssignToMe} className={`w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors cursor-pointer ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}>
                           <UserCheck className="size-3.5 text-indigo-400" />
                           <span className="text-[9px] font-bold text-center leading-tight">Take<br/>Ticket</span>
                        </button>
                        <button onClick={handleEscalate} className={`w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors cursor-pointer ${isDarkMode ? 'border-slate-700 text-rose-300 hover:bg-rose-950/40 hover:border-rose-700' : 'border-slate-200 text-rose-600 hover:bg-rose-50'}`}>
                           <ArrowUpRight className="size-3.5 text-rose-500" />
                           <span className="text-[9px] font-bold text-center leading-tight">Escalate</span>
                        </button>
                        <button onClick={handleResolve} className={`w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors cursor-pointer ${isDarkMode ? 'border-slate-700 text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-700' : 'border-slate-200 text-emerald-600 hover:bg-emerald-50'}`}>
                           <CheckCircle className="size-3.5 text-emerald-500" />
                           <span className="text-[9px] font-bold text-center leading-tight">Resolve</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Composer */}
                    <div className={`border-t p-4 shrink-0 space-y-3 ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
                       <div className={`flex items-center gap-3 border-b pb-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                         <button onClick={() => setIsInternal(false)} className={`text-sm font-bold pb-2 -mb-[9px] border-b-2 transition-colors cursor-pointer ${!isInternal ? 'border-blue-500 text-blue-400' : isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500'}`}>
                           Customer Reply
                         </button>
                         <button onClick={() => setIsInternal(true)} className={`flex items-center gap-1 text-sm font-bold pb-2 -mb-[9px] border-b-2 transition-colors cursor-pointer ${isInternal ? 'border-amber-500 text-amber-400' : isDarkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500'}`}>
                           Internal Note <Lock className="size-3.5" />
                         </button>
                         
                         {/* Quick Pills */}
                         <div className="flex-1 flex justify-end gap-2 overflow-x-auto">
                            <button onClick={handleAIDraft} disabled={isDrafting} className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer ${
                              isDarkMode 
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}>
                               {isDrafting ? <Loader2 className="size-3 animate-spin" /> : null}
                               AI Suggested
                            </button>
                            {MACROS.map(m => (
                              <button key={m.label} onClick={() => setReplyText(m.body)} className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer ${
                                isDarkMode 
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}>
                                {m.label}
                              </button>
                            ))}
                         </div>
                       </div>

                       {/* Attached Files List */}
                       {composerAttachments.length > 0 && (
                         <div className="flex flex-wrap gap-2 pt-1">
                           {composerAttachments.map(att => (
                             <div key={att.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                               isDarkMode 
                                 ? 'bg-slate-800 border-slate-700 text-slate-200' 
                                 : 'bg-slate-100 border-slate-200 text-slate-700'
                             }`}>
                               <FileIcon className="size-3 text-slate-400" />
                               <span className="truncate max-w-[120px] font-medium">{att.file.name}</span>
                               <button type="button" onClick={() => removeTechAttachment(att.id)} className="text-slate-400 hover:text-red-400 p-0.5 cursor-pointer">
                                 <Trash2 className="size-3" />
                               </button>
                             </div>
                           ))}
                         </div>
                       )}

                       {/* Voice Error Notice */}
                       {speechError && (
                         <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border ${
                           isDarkMode 
                             ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' 
                             : 'bg-amber-50 border-amber-200 text-amber-800'
                         }`}>
                           <div className="flex items-center gap-1.5">
                             <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
                             <span>{speechError}</span>
                           </div>
                           <button onClick={clearSpeechError} className="text-amber-400 hover:text-amber-300 font-bold ml-2 cursor-pointer">Dismiss</button>
                         </div>
                       )}
                       
                       <form onSubmit={handleSendReply} className="relative">
                         <textarea
                           value={replyText}
                           onChange={e => setReplyText(e.target.value)}
                           placeholder={isInternal ? "Write internal note (only visible to support agents)..." : "Type your reply to customer..."}
                           rows={3}
                           className={`w-full resize-none p-2 pb-11 pr-24 rounded-xl border text-xs outline-none transition-colors ${
                             isDarkMode 
                               ? 'bg-[#1e293b] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500' 
                               : 'bg-slate-50 border-slate-200 focus:bg-white text-slate-900 focus:border-blue-500'
                           }`}
                           onKeyDown={e => {
                             if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                               handleSendReply(e);
                             }
                           }}
                         />

                         <div className="absolute bottom-2.5 left-2 flex items-center gap-1.5">
                           <label className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                             isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                           }`} title="Attach file">
                             <Paperclip className="size-4" />
                             <input type="file" multiple onChange={handleTechFileSelect} className="hidden" />
                           </label>

                           <button
                             type="button"
                             onClick={toggleVoiceInput}
                             className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                               isListening
                                 ? 'bg-red-500 text-white animate-pulse'
                                 : isTranscribing
                                 ? 'bg-blue-600 text-white'
                                 : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                             }`}
                             title={isListening ? 'Stop recording' : 'Voice dictation'}
                           >
                             {isTranscribing ? (
                               <Loader2 className="size-4 animate-spin" />
                             ) : (
                               <Mic className="size-4" />
                             )}
                             {isListening && <span className="font-bold text-[10px]">{recordingSeconds}s</span>}
                           </button>
                         </div>

                         <button
                           type="submit"
                           disabled={!replyText.trim() && composerAttachments.length === 0}
                           className="absolute bottom-2.5 right-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                         >
                           <Send className="size-3.5" />
                           Send
                         </button>
                       </form>
                    </div>

                  </div>
                )}
                
                {inspectorTab === 'ai_intel' && (
                  <div className={`flex-1 p-6 flex flex-col items-center justify-center ${isDarkMode ? 'text-slate-400 bg-[#070b14]' : 'text-slate-500 bg-[#f8fafc]'}`}>
                    <Cpu className="size-12 mb-4 text-blue-500" />
                    <p className={`font-bold text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>AI Triage Data</p>
                    <p className="text-sm mt-1">Confidence Score: {activeTicket.ai_confidence ? Math.round(activeTicket.ai_confidence * 100) : 91}%</p>
                    <div className={`mt-4 p-4 rounded-xl border max-w-md w-full text-xs space-y-2 ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Assigned Category:</span>
                        <span className="font-bold capitalize">{activeTicket.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Assessed Priority:</span>
                        <span className="font-bold capitalize">{activeTicket.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Model Model:</span>
                        <span className="font-bold">Gemini 2.5 Flash</span>
                      </div>
                    </div>
                  </div>
                )}
                {inspectorTab === 'requester' && (
                  <div className={`flex-1 p-6 flex flex-col items-center justify-center ${isDarkMode ? 'text-slate-400 bg-[#070b14]' : 'text-slate-500 bg-[#f8fafc]'}`}>
                    <User className="size-12 mb-4 text-blue-500" />
                    <p className={`font-bold text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{activeTicket.requester_name}</p>
                    <p className="text-sm mt-1">{activeTicket.requester_email}</p>
                    <div className={`mt-4 p-4 rounded-xl border max-w-md w-full text-xs space-y-2 ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">User Role:</span>
                        <span className="font-bold uppercase text-blue-400">Customer</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-400">Ticket Origin:</span>
                        <span className="font-bold">Web Portal</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center p-6 ${isDarkMode ? 'text-slate-500 bg-[#070b14]' : 'text-slate-400 bg-[#f8fafc]'}`}>
                 <TicketIcon className="size-16 mb-4 opacity-40" />
                 <p className={`font-bold text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>No Ticket Selected</p>
                 <p className="text-sm">Select a ticket from the queue to view details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {activeTicket && (
        <AssignAgentModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          ticket={activeTicket}
        />
      )}
    </div>
  );
};
