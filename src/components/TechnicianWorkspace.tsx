import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TicketPriority, TicketStatus } from '../types';
import { CATEGORIES, getCategoryLabel, MACROS } from '../data/seedData';
import {
  Ticket as TicketIcon, List, Settings,
  Bell, LogOut, Search, SlidersHorizontal, Copy, UserPlus,
  UserCheck, ArrowUpRight, CheckCircle, Lock, Send, Cpu, User,
  CheckCircle2, Paperclip, Trash2, Download, FileText as FileIcon,
  Mic, Loader2, AlertCircle, AlertTriangle
} from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';
import { AssignAgentModal } from './AssignAgentModal';
import { motion, AnimatePresence } from 'motion/react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import {
  useAnimatedCounter,
  animateCalmFadeSlide,
  triggerElementPop,
} from '../utils/jsAnimations';

export const TechnicianWorkspace: React.FC = () => {
  const {
    currentUser,
    tickets,
    messages,
    markTicketRead,
    updateTicket,
    sendMessage,
    draftAIReply,
    signOut,
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

  const detailsHeaderRef = useRef<HTMLDivElement | null>(null);
  const queueListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    animateCalmFadeSlide(queueListRef.current);
  }, [filterMode]);

  useEffect(() => {
    animateCalmFadeSlide(detailsHeaderRef.current);
  }, [selectedTicketId]);

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
    recordingSeconds,
    error: speechError,
    clearError: clearSpeechError,
    toggleVoiceInput,
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
    triggerElementPop(detailsHeaderRef.current);
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

  const handleAssignToMe = async (e: React.MouseEvent<HTMLElement>) => {
    triggerElementPop(e.currentTarget);
    if (!activeTicket) return;
    await updateTicket(activeTicket.id, {
      status: activeTicket.status === 'new' ? 'in_progress' : activeTicket.status,
      assigned_to: currentUser?.id,
      assigned_name: currentUser?.full_name || 'Support Technician',
    });
    showToast(`Ticket ${activeTicket.id} assigned to you`, 'success');
  };

  const handleEscalate = async (e: React.MouseEvent<HTMLElement>) => {
    triggerElementPop(e.currentTarget);
    if (!activeTicket) return;
    await updateTicket(activeTicket.id, { status: 'escalated', priority: 'urgent' });
    showToast(`Ticket ${activeTicket.id} escalated with Urgent priority`, 'warning');
  };

  const handleResolve = async (e: React.MouseEvent<HTMLElement>) => {
    triggerElementPop(e.currentTarget);
    if (!activeTicket) return;
    const ticketId = activeTicket.id;
    await updateTicket(ticketId, { 
      status: 'resolved', 
      resolved_at: new Date().toISOString() 
    });
    showToast(`Ticket ${ticketId} resolved and moved to Resolved section`, 'success');
  };

  // Calm priority indicators using warm light-brown and stone neutrals
  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 bg-[#ebe3da] text-[#5c4433] border border-[#d4c3b2] px-2 py-0.5 rounded text-[10px] font-bold">
            <AlertTriangle className="size-3 text-[#8c6d53] shrink-0" />
            <span className="uppercase text-[9px] font-bold">Urgent</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 bg-[#f5efe8] text-[#6e533c] border border-[#e3d5c5] px-2 py-0.5 rounded text-[10px] font-semibold">
            <span className="capitalize">High</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 bg-[#f4f4f2] text-stone-700 border border-[#e2dfd9] px-2 py-0.5 rounded text-[10px] font-medium">
            <span className="capitalize">Medium</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-[#fafaf9] text-stone-500 border border-[#e7e5e4] px-2 py-0.5 rounded text-[10px] font-medium">
            <span className="capitalize">Low</span>
          </span>
        );
    }
  };

  // Light green strictly for resolved; warm brown/stone for active states
  const getStatusBadge = (status: TicketStatus) => {
    if (status === 'resolved' || status === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] px-2 py-0.5 rounded text-[10px] font-semibold">
          <CheckCircle2 className="size-3 text-[#2f6b45] shrink-0" />
          <span>Resolved</span>
        </span>
      );
    } else if (status === 'escalated') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#ebe3da] text-[#5c4433] border border-[#d4c3b2] px-2 py-0.5 rounded text-[10px] font-semibold">
          <ArrowUpRight className="size-3 text-[#8c6d53] shrink-0" />
          <span>Escalated</span>
        </span>
      );
    } else if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#f5efe8] text-[#6e533c] border border-[#e3d5c5] px-2 py-0.5 rounded text-[10px] font-semibold">
          <span>In Progress</span>
        </span>
      );
    } else if (status === 'pending_user') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#ebe9e4] text-stone-700 border border-[#dad7d0] px-2 py-0.5 rounded text-[10px] font-medium">
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-[#f4f4f2] text-stone-700 border border-[#e2dfd9] px-2 py-0.5 rounded text-[10px] font-medium">
        <span>New</span>
      </span>
    );
  };

  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
  const myTicketsRaw = openTickets.filter(t => t.assigned_to === currentUser?.id || t.assigned_name?.toLowerCase().includes('marcus') || (currentUser?.full_name && t.assigned_name === currentUser.full_name)).length;
  const teamQueueRaw = openTickets.length;
  const escalatedRaw = openTickets.filter(t => t.status === 'escalated' || t.priority === 'urgent').length;
  const resolvedRaw = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  // Smooth requestAnimationFrame counters
  const myTicketsCount = useAnimatedCounter(myTicketsRaw, 400);
  const teamQueueCount = useAnimatedCounter(teamQueueRaw, 400);
  const escalatedCount = useAnimatedCounter(escalatedRaw, 400);
  const resolvedCount = useAnimatedCounter(resolvedRaw, 400);
  const aiConfidenceAnimated = useAnimatedCounter(
    activeTicket?.ai_confidence ? Math.round(activeTicket.ai_confidence * 100) : 91,
    500
  );

  // Strict Component-Level Guard: Customers ('user') can never render TechnicianWorkspace
  if (!currentUser || (currentUser.role !== 'technician' && currentUser.role !== 'admin')) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-[#f4f4f2] text-stone-800">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-[210px] border-r border-[#e2dfd9] bg-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-12 flex items-center px-4 gap-3 border-b border-[#f0eee9] shrink-0">
          <div className="flex items-center gap-2">
             <span className="size-7 rounded-md bg-[#f5efe8] text-[#8c6d53] border border-[#e3d5c5] font-bold text-sm grid place-items-center">
               T
             </span>
             <div className="leading-tight">
               <h1 className="font-bold text-xs text-stone-800">Technician</h1>
               <h1 className="font-medium text-[11px] text-stone-500">Workspace</h1>
             </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => setFilterMode('mine')}
            className={`calm-btn w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer ${
              filterMode === 'mine'
                ? 'bg-[#8c6d53] text-white font-semibold'
                : 'text-stone-600 hover:bg-[#f4f4f2] hover:text-stone-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5"><TicketIcon className="size-3.5" /> My Tickets</div>
            {myTicketsRaw > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                filterMode === 'mine' ? 'bg-white/20 text-white' : 'bg-[#f5efe8] text-[#6e533c]'
              }`}>
                {myTicketsCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setFilterMode('all')}
            className={`calm-btn w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#8c6d53] text-white font-semibold'
                : 'text-stone-600 hover:bg-[#f4f4f2] hover:text-stone-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5"><List className="size-3.5" /> Team Queue</div>
            {teamQueueRaw > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                filterMode === 'all' ? 'bg-white/20 text-white' : 'bg-[#ebe9e4] text-stone-700'
              }`}>
                {teamQueueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterMode('escalated')}
            className={`calm-btn w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer ${
              filterMode === 'escalated'
                ? 'bg-[#8c6d53] text-white font-semibold'
                : 'text-stone-600 hover:bg-[#f4f4f2] hover:text-stone-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ArrowUpRight className={`size-3.5 ${filterMode === 'escalated' ? 'text-white' : 'text-[#8c6d53]'}`} />
              <span>Escalated</span>
            </div>
            {escalatedRaw > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                filterMode === 'escalated' ? 'bg-white/20 text-white' : 'bg-[#f5efe8] text-[#6e533c]'
              }`}>
                {escalatedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterMode('resolved')}
            className={`calm-btn w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer ${
              filterMode === 'resolved'
                ? 'bg-[#2f6b45] text-white font-semibold'
                : 'text-stone-600 hover:bg-[#f4f4f2] hover:text-stone-900 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className={`size-3.5 ${filterMode === 'resolved' ? 'text-white' : 'text-[#2f6b45]'}`} />
              <span>Resolved</span>
            </div>
            {resolvedRaw > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
                filterMode === 'resolved' ? 'bg-white/20 text-white' : 'bg-[#e6f4ea] text-[#2f6b45]'
              }`}>
                {resolvedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Quiet Footer Summary */}
        <div className="p-3 border-t border-[#e2dfd9] bg-[#fafaf9] text-[11px] text-stone-500">
          <div className="flex items-center justify-between">
            <span>SLA Status</span>
            <span className="font-semibold text-[#2f6b45]">Nominal</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-12 border-b border-[#e2dfd9] bg-white flex items-center justify-end px-4 gap-3 shrink-0 text-stone-800">
          {currentUser?.role === 'admin' && <RoleSwitcher />}
          
          <div className="flex items-center gap-2.5 border border-[#e2dfd9] bg-[#fafaf9] rounded-full py-1 px-3">
             <div className="size-6 rounded-full bg-[#f5efe8] text-[#6e533c] border border-[#e3d5c5] flex items-center justify-center text-xs font-bold uppercase">
                {currentUser?.full_name?.charAt(0) || 'A'}
             </div>
             <div className="leading-tight pr-1 text-left">
               <p className="text-xs font-semibold text-stone-800">{currentUser?.full_name || 'Avumile Tati'}</p>
               <p className="text-[10px] text-stone-500">Support Specialist</p>
             </div>
             <Settings className="size-3.5 text-stone-400 hover:text-stone-700 cursor-pointer" />
          </div>
          
          <button
            onClick={() => setIsNotificationCenterOpen(true)}
            className="calm-btn relative p-2 rounded-full text-stone-500 hover:bg-[#f4f4f2] hover:text-stone-800 cursor-pointer"
          >
            <Bell className="size-4.5" />
            <span className="absolute top-1.5 right-1.5 size-3.5 bg-[#8c6d53] border-2 border-white rounded-full text-[8px] font-bold text-white flex items-center justify-center tabular-nums">1</span>
          </button>

          <button onClick={signOut} className="calm-btn flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer">
            <LogOut className="size-3.5" /> Sign Out
          </button>
        </header>

        {/* 3. WORKSPACE AREA (Middle & Right Columns) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Middle Column: Ticket List */}
          <div className="w-[290px] border-r border-[#e2dfd9] bg-white flex flex-col shrink-0">
            {/* Search/Filter Header */}
            <div className="p-3 border-b border-[#e2dfd9] space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-stone-800">Tickets Queue</h2>
                <span className="text-[11px] font-medium text-stone-500 tabular-nums">
                  {filteredTickets.length} of {tickets.length}
                </span>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, title, user..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#e2dfd9] bg-[#fafaf9] focus:bg-white text-xs text-stone-800 placeholder-stone-400 outline-none focus:border-[#8c6d53] transition-colors"
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  title="Advanced Filters"
                  className={`calm-btn p-1.5 border rounded-lg cursor-pointer ${
                    showFilters 
                      ? 'border-[#8c6d53] bg-[#f5efe8] text-[#6e533c]'
                      : 'border-[#e2dfd9] text-stone-500 hover:bg-[#f4f4f2]'
                  }`}
                >
                   <SlidersHorizontal className="size-3.5" />
                </button>
              </div>

              {/* Quick Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`calm-btn px-2 py-0.5 rounded font-medium shrink-0 cursor-pointer tabular-nums ${
                    filterMode === 'all'
                      ? 'bg-[#8c6d53] text-white font-semibold'
                      : 'bg-[#f4f4f2] text-stone-600 hover:bg-[#ebe9e4]'
                  }`}
                >
                  All ({teamQueueCount})
                </button>
                <button
                  onClick={() => setFilterMode('mine')}
                  className={`calm-btn px-2 py-0.5 rounded font-medium shrink-0 cursor-pointer tabular-nums ${
                    filterMode === 'mine'
                      ? 'bg-[#8c6d53] text-white font-semibold'
                      : 'bg-[#f4f4f2] text-stone-600 hover:bg-[#ebe9e4]'
                  }`}
                >
                  Mine ({myTicketsCount})
                </button>
                <button
                  onClick={() => setFilterMode('escalated')}
                  className={`calm-btn px-2 py-0.5 rounded font-medium shrink-0 flex items-center gap-1 cursor-pointer tabular-nums ${
                    filterMode === 'escalated'
                      ? 'bg-[#8c6d53] text-white font-semibold'
                      : 'bg-[#f5efe8] text-[#6e533c] hover:bg-[#ebe3da]'
                  }`}
                >
                  Escalated ({escalatedCount})
                </button>
                <button
                  onClick={() => setFilterMode('resolved')}
                  className={`calm-btn px-2 py-0.5 rounded font-medium shrink-0 flex items-center gap-1 cursor-pointer tabular-nums ${
                    filterMode === 'resolved'
                      ? 'bg-[#2f6b45] text-white font-semibold'
                      : 'bg-[#e6f4ea] text-[#2f6b45] hover:bg-[#d5ebd9]'
                  }`}
                >
                  <CheckCircle2 className="size-2.5" />
                  Resolved ({resolvedCount})
                </button>
              </div>
              
              {showFilters && (
                <div className="calm-fade-slide pt-2 space-y-3 border-t border-[#f0eee9] mt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-stone-500">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-[#e2dfd9] bg-white text-xs text-stone-800 outline-none"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase text-stone-500">Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-[#e2dfd9] bg-white text-xs text-stone-800 outline-none"
                      >
                        <option value="all">All</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase text-stone-500">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-[#e2dfd9] bg-white text-xs text-stone-800 outline-none"
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
                      className="text-[10px] font-semibold text-[#8c6d53] hover:underline w-full text-right cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Ticket Queue List */}
            <div ref={queueListRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#f4f4f2]/70">
              {filteredTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId;
                const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`calm-card-hover p-3 rounded-xl border cursor-pointer ${
                      isSelected
                        ? isResolved
                          ? 'border-[#2f6b45] bg-[#e6f4ea]/60'
                          : 'border-[#8c6d53] bg-[#f5efe8]'
                        : 'border-[#e2dfd9] bg-white hover:border-[#c7b6a6]'
                    }`}
                  >
                    <div className="flex gap-2.5">
                      <div className={`size-6 rounded-full text-[10px] shrink-0 flex items-center justify-center font-bold ${
                        isResolved
                          ? 'bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0]'
                          : isSelected
                          ? 'bg-[#8c6d53] text-white'
                          : 'bg-[#ebe9e4] text-stone-600'
                      }`}>
                         {isResolved ? <CheckCircle2 className="size-3.5 text-[#2f6b45]" /> : ticket.requester_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                           <span className="font-mono font-semibold text-xs text-stone-600 line-clamp-1 tabular-nums">{ticket.id}</span>
                        </div>
                        <p className="text-xs font-semibold line-clamp-1 text-stone-900">{ticket.title}</p>
                        <p className="text-[11px] text-stone-500">{getCategoryLabel(ticket.category)}</p>
                        <div className="flex items-center justify-between pt-1.5">
                           {getPriorityBadge(ticket.priority)}
                           {getStatusBadge(ticket.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTickets.length === 0 && (
                <div className="text-center p-8 text-sm space-y-2 text-stone-500">
                  <CheckCircle2 className="size-7 mx-auto text-stone-400" />
                  <p className="font-semibold text-stone-700 text-xs">No tickets found</p>
                  <p className="text-[11px] text-stone-400">
                    {filterMode === 'resolved'
                      ? 'No tickets currently marked as resolved.'
                      : 'Try adjusting your filters or search query.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Ticket Details */}
          <div className="flex-1 flex flex-col min-w-0 bg-white text-stone-800">
            {activeTicket ? (
              <>
                {/* Details Header */}
                <div
                  ref={detailsHeaderRef}
                  className="p-4 border-b border-[#e2dfd9] bg-white shrink-0 space-y-3.5"
                >
                  {/* Title */}
                  <div className="flex items-center flex-wrap gap-2.5">
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">{activeTicket.title}</h2>
                    {getPriorityBadge(activeTicket.priority)}
                    {getStatusBadge(activeTicket.status)}
                  </div>

                  {/* 3 Data Columns */}
                  <div className="grid grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                         <User className="size-3.5" /> Requester
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="size-6 rounded-full bg-[#ebe9e4] text-stone-700 text-[10px] flex items-center justify-center font-bold uppercase">
                          {activeTicket.requester_name.charAt(0)}
                        </div>
                        <div className="leading-tight">
                          <p className="font-semibold text-xs text-stone-900">{activeTicket.requester_name}</p>
                          <div className="flex items-center gap-1 text-[11px] text-stone-500">
                            {activeTicket.requester_email}{' '}
                            <Copy
                              onClick={() => {
                                navigator.clipboard?.writeText(activeTicket.requester_email);
                                showToast('Email copied to clipboard', 'info');
                              }}
                              className="size-3 cursor-pointer hover:text-[#8c6d53] transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                         <UserCheck className="size-3.5" /> Assignee
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="size-6 rounded-full bg-[#f5efe8] text-[#6e533c] border border-[#e3d5c5] text-[10px] flex items-center justify-center font-bold uppercase">
                           {activeTicket.assigned_name ? activeTicket.assigned_name.charAt(0) : '?'}
                        </div>
                        <div className="leading-tight">
                          <p className="font-semibold text-xs text-stone-900">{activeTicket.assigned_name || 'Unassigned'}</p>
                          <button onClick={() => setIsAssignModalOpen(true)} className="text-[11px] text-[#8c6d53] font-semibold hover:underline cursor-pointer">Assign Agent</button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs border-l border-[#e2dfd9] pl-5 text-stone-600">
                       <div className="flex items-center gap-1.5 font-medium mb-1.5 text-stone-500">
                         <TicketIcon className="size-3.5" /> Ticket Info
                       </div>
                       <p className="flex justify-between"><span className="text-stone-500">Category:</span> <span className="font-medium capitalize text-stone-800">{activeTicket.category}</span></p>
                       <p className="flex justify-between"><span className="text-stone-500">Created:</span> <span className="font-medium tabular-nums text-stone-800">{new Date(activeTicket.created_at).toLocaleDateString()}</span></p>
                       <p className="flex justify-between items-center"><span className="text-stone-500">SLA Status:</span> <span className="bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] px-2 py-0.2 rounded font-semibold text-[10px]">Nominal</span></p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between px-4 border-b border-[#e2dfd9] bg-[#fafaf9] shrink-0">
                  <div className="flex items-center gap-5">
                    {[
                      { id: 'discussion', label: 'Activity Feed' },
                      { id: 'ai_intel', label: `AI Insights (${aiConfidenceAnimated}%)` },
                      { id: 'requester', label: 'Requester Profile' },
                    ].map((tab) => {
                      const active = inspectorTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setInspectorTab(tab.id as any)}
                          className={`py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            active
                              ? 'border-[#8c6d53] text-[#8c6d53]'
                              : 'border-transparent text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  <select 
                    value={activeTicket.status}
                    disabled={isUpdatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="border border-[#e2dfd9] bg-white text-stone-700 rounded-lg px-2.5 py-1 text-xs font-medium outline-none focus:border-[#8c6d53] cursor-pointer"
                  >
                    <option value="new">Status: New</option>
                    <option value="in_progress">Status: In Progress</option>
                    <option value="escalated">Status: Escalated</option>
                    <option value="resolved">Status: Resolved</option>
                  </select>
                </div>

                {/* Main Content Area based on Tab */}
                <AnimatePresence mode="wait">
                  {inspectorTab === 'discussion' && (
                    <motion.div
                      key={`discussion-${activeTicket.id}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="flex-1 flex flex-col min-h-0 bg-[#f4f4f2]"
                    >
                      {/* Resolution Banner - Light Green */}
                      {(activeTicket.status === 'resolved' || activeTicket.status === 'closed') && (
                        <div className="mx-4 mt-3 p-3 rounded-xl border border-[#c6e6d0] bg-[#e6f4ea] text-[#1e462d] flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="size-4 text-[#2f6b45] shrink-0" />
                            <div>
                              <p className="font-semibold">Ticket Marked as Resolved</p>
                              <p className="text-[11px] text-[#2f6b45]">
                                {activeTicket.resolved_at 
                                  ? `Resolved on ${new Date(activeTicket.resolved_at).toLocaleString()}` 
                                  : 'This request is resolved.'}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleStatusChange('in_progress')}
                            className="calm-btn px-3 py-1.5 rounded-lg bg-[#2f6b45] hover:bg-[#255737] text-white font-semibold text-xs shrink-0 cursor-pointer"
                          >
                            Reopen Ticket
                          </button>
                        </div>
                      )}

                      {/* Chat Area & Action Bar */}
                      <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                           
                           {/* Customer Original Ticket Request */}
                           <div className="flex gap-3 justify-start items-start w-full">
                             <div className="size-7 rounded-full text-xs shrink-0 flex items-center justify-center font-bold bg-[#ebe9e4] text-stone-700 border border-[#dad7d0]">
                               {activeTicket.requester_name.charAt(0)}
                             </div>
                             <div className="flex-1 min-w-0 space-y-1 text-left">
                               <div className="flex items-center gap-2">
                                 <span className="font-semibold text-xs text-stone-800">{activeTicket.requester_name}</span>
                                 <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#ebe9e4] text-stone-600">
                                   Customer
                                 </span>
                                 <span className="text-xs text-stone-400 tabular-nums">· {new Date(activeTicket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                               </div>
                               <div className="w-full p-3.5 rounded-xl rounded-tl-xs text-xs whitespace-pre-wrap leading-relaxed bg-white text-stone-800 border border-[#e2dfd9]">
                                 <div className="font-medium text-[11px] text-stone-400 mb-1">
                                   Original Ticket Request
                                 </div>
                                 {activeTicket.description}

                                 {/* Initial Attachments */}
                                 {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                                   <div className="mt-2.5 pt-2 border-t border-[#f0eee9] space-y-1.5">
                                     <p className="text-[10px] font-semibold uppercase text-stone-500">Attachments ({activeTicket.attachments.length})</p>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                       {activeTicket.attachments.map(att => (
                                         <a 
                                           key={att.id || att.name} 
                                           href={att.url} 
                                           download={att.name}
                                           target="_blank" 
                                           rel="noreferrer"
                                           className="flex items-center gap-2 p-2 rounded-lg border border-[#e2dfd9] bg-[#fafaf9] hover:border-[#8c6d53] transition-colors group"
                                         >
                                           <div className="size-7 rounded flex items-center justify-center shrink-0 overflow-hidden bg-white border border-[#e2dfd9]">
                                             {att.type?.startsWith('image/') ? (
                                               <img src={att.url} alt={att.name} className="size-full object-cover" />
                                             ) : (
                                               <FileIcon className="size-3.5 text-stone-400" />
                                             )}
                                           </div>
                                           <div className="flex-1 min-w-0">
                                             <span className="text-[11px] font-medium truncate block text-stone-800">{att.name}</span>
                                             <span className="text-[10px] text-stone-400">{formatBytes(att.size)}</span>
                                           </div>
                                           <Download className="size-3 text-stone-400 group-hover:text-[#8c6d53] transition-colors shrink-0" />
                                         </a>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>

                           {/* Messages List */}
                           {activeMessages.map((msg) => {
                             const isNote = msg.internal;

                             if (isNote) {
                               return (
                                 <div key={msg.id} className="calm-fade-slide flex justify-center my-3 w-full">
                                    <div className="flex items-start gap-2 max-w-2xl p-3 rounded-xl text-xs w-full border border-[#e3d5c5] bg-[#f5efe8] text-[#5c4433]">
                                       <Lock className="size-3.5 shrink-0 text-[#8c6d53] mt-0.5" />
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="font-semibold text-xs text-[#6e533c]">{msg.author_name} · Internal Note</p>
                                            <span className="text-[10px] text-[#8c6d53] tabular-nums">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          {msg.body && <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.body}</p>}

                                          {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-[#e3d5c5] space-y-1">
                                              {msg.attachments.map(att => (
                                                <a 
                                                  key={att.id || att.name} 
                                                  href={att.url} 
                                                  download={att.name}
                                                  target="_blank" 
                                                  rel="noreferrer"
                                                  className="flex items-center gap-2 p-1.5 rounded border border-[#e3d5c5] bg-white/70 hover:bg-white text-[#5c4433] transition-colors group"
                                                >
                                                  <FileIcon className="size-3 text-[#8c6d53] shrink-0" />
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

                             const isTechnician = 
                               msg.author_role === 'technician' || 
                               msg.author_role === 'admin' || 
                               (activeTicket && msg.author_id !== activeTicket.requester_id && msg.author_role !== 'user');

                             if (isTechnician) {
                               return (
                                 <div key={msg.id} className="calm-fade-slide flex w-full gap-3 items-start justify-end">
                                   <div className="max-w-[85%] sm:max-w-[88%] space-y-1 text-right">
                                     <div className="flex items-center gap-2 justify-end">
                                       <span className="text-xs text-stone-400 tabular-nums">
                                         {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                       </span>
                                       <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f5efe8] text-[#6e533c] border border-[#e3d5c5]">
                                         Technician
                                       </span>
                                       <span className="font-semibold text-xs text-stone-800">
                                         {msg.author_name}
                                       </span>
                                     </div>

                                     {/* Message Bubble: Light Brown for Technician */}
                                     <div className="p-3.5 rounded-xl rounded-tr-xs text-xs whitespace-pre-wrap leading-relaxed text-left border bg-[#8c6d53] text-white border-[#7a5d45]">
                                       {msg.body && <p>{msg.body}</p>}

                                       {msg.attachments && msg.attachments.length > 0 && (
                                         <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1.5">
                                           {msg.attachments.map(att => (
                                             <a 
                                               key={att.id || att.name} 
                                               href={att.url} 
                                               download={att.name}
                                               target="_blank" 
                                               rel="noreferrer"
                                               className="flex items-center gap-2 p-2 rounded-lg border bg-[#765a43] border-white/20 text-white hover:bg-[#684e39] transition-colors group"
                                             >
                                               <div className="size-7 rounded flex items-center justify-center shrink-0 overflow-hidden bg-[#5c4433]">
                                                 {att.type?.startsWith('image/') ? (
                                                   <img src={att.url} alt={att.name} className="size-full object-cover" />
                                                 ) : (
                                                   <FileIcon className="size-3.5 text-stone-200" />
                                                 )}
                                               </div>
                                               <div className="flex-1 min-w-0 text-left">
                                                 <p className="text-[11px] font-medium truncate">{att.name}</p>
                                                 <p className="text-[9px] text-stone-200">{formatBytes(att.size)}</p>
                                               </div>
                                               <Download className="size-3 transition-colors shrink-0 text-stone-200 group-hover:text-white" />
                                             </a>
                                           ))}
                                         </div>
                                       )}
                                     </div>
                                   </div>

                                   <div className="size-7 rounded-full text-xs shrink-0 flex items-center justify-center font-bold bg-[#8c6d53] text-white">
                                     {msg.author_name.charAt(0)}
                                   </div>
                                 </div>
                               );
                             }

                             // Customer message aligned to the Left
                             return (
                               <div key={msg.id} className="calm-fade-slide flex w-full gap-3 items-start justify-start">
                                 <div className="size-7 rounded-full text-xs shrink-0 flex items-center justify-center font-bold bg-[#ebe9e4] text-stone-700 border border-[#dad7d0]">
                                   {msg.author_name.charAt(0)}
                                 </div>

                                 <div className="max-w-[85%] sm:max-w-[88%] space-y-1 text-left">
                                   <div className="flex items-center gap-2 justify-start">
                                     <span className="font-semibold text-xs text-stone-800">
                                       {msg.author_name}
                                     </span>
                                     <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#ebe9e4] text-stone-600">
                                       Customer
                                     </span>
                                     <span className="text-xs text-stone-400 tabular-nums">
                                       · {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                     </span>
                                   </div>

                                   {/* Message Bubble: White for Customer */}
                                   <div className="p-3.5 rounded-xl rounded-tl-xs text-xs whitespace-pre-wrap leading-relaxed text-left border bg-white text-stone-800 border-[#e2dfd9]">
                                     {msg.body && <p>{msg.body}</p>}

                                     {msg.attachments && msg.attachments.length > 0 && (
                                       <div className="mt-2.5 pt-2 border-t border-[#f0eee9] space-y-1.5">
                                         {msg.attachments.map(att => (
                                           <a 
                                             key={att.id || att.name} 
                                             href={att.url} 
                                             download={att.name}
                                             target="_blank" 
                                             rel="noreferrer"
                                             className="flex items-center gap-2 p-2 rounded-lg border border-[#e2dfd9] bg-[#fafaf9] hover:border-[#8c6d53] text-stone-800 transition-colors group"
                                           >
                                             <div className="size-7 rounded flex items-center justify-center shrink-0 overflow-hidden bg-white border border-[#e2dfd9]">
                                               {att.type?.startsWith('image/') ? (
                                                 <img src={att.url} alt={att.name} className="size-full object-cover" />
                                               ) : (
                                                 <FileIcon className="size-3.5 text-stone-400" />
                                               )}
                                             </div>
                                             <div className="flex-1 min-w-0 text-left">
                                               <p className="text-[11px] font-medium truncate">{att.name}</p>
                                               <p className="text-[9px] text-stone-400">{formatBytes(att.size)}</p>
                                             </div>
                                             <Download className="size-3 transition-colors shrink-0 text-stone-400 group-hover:text-[#8c6d53]" />
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
                        <div className="w-16 border-l border-[#e2dfd9] bg-white p-2 flex flex-col gap-2 shrink-0 items-center overflow-y-auto">
                          <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="calm-btn w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-[#e2dfd9] text-stone-700 hover:bg-[#f5efe8] hover:border-[#c7b6a6] cursor-pointer"
                          >
                             <UserPlus className="size-3.5 text-[#8c6d53]" />
                             <span className="text-[9px] font-semibold text-center leading-tight">Assign<br/>Agent</span>
                          </button>
                          <button
                            onClick={handleAssignToMe}
                            className="calm-btn w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-[#e2dfd9] text-stone-700 hover:bg-[#f5efe8] hover:border-[#c7b6a6] cursor-pointer"
                          >
                             <UserCheck className="size-3.5 text-[#8c6d53]" />
                             <span className="text-[9px] font-semibold text-center leading-tight">Take<br/>Ticket</span>
                          </button>
                          <button
                            onClick={handleEscalate}
                            className="calm-btn w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-[#e2dfd9] text-[#6e533c] hover:bg-[#f5efe8] hover:border-[#c7b6a6] cursor-pointer"
                          >
                             <ArrowUpRight className="size-3.5 text-[#8c6d53]" />
                             <span className="text-[9px] font-semibold text-center leading-tight">Escalate</span>
                          </button>
                          <button
                            onClick={handleResolve}
                            className="calm-btn w-full flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-[#c6e6d0] bg-[#e6f4ea]/50 text-[#2f6b45] hover:bg-[#e6f4ea] cursor-pointer"
                          >
                             <CheckCircle className="size-3.5 text-[#2f6b45]" />
                             <span className="text-[9px] font-semibold text-center leading-tight">Resolve</span>
                          </button>
                        </div>
                      </div>

                      {/* Bottom Composer */}
                      <div className="border-t border-[#e2dfd9] bg-white p-4 shrink-0 space-y-3">
                         <div className="flex items-center gap-4 border-b border-[#f0eee9] pb-2">
                           <button
                             onClick={() => setIsInternal(false)}
                             className={`text-xs font-semibold pb-2 -mb-[9px] border-b-2 transition-colors cursor-pointer ${
                               !isInternal ? 'border-[#8c6d53] text-[#8c6d53]' : 'border-transparent text-stone-500 hover:text-stone-800'
                             }`}
                           >
                             Customer Reply
                           </button>
                           <button
                             onClick={() => setIsInternal(true)}
                             className={`flex items-center gap-1 text-xs font-semibold pb-2 -mb-[9px] border-b-2 transition-colors cursor-pointer ${
                               isInternal ? 'border-[#8c6d53] text-[#8c6d53]' : 'border-transparent text-stone-500 hover:text-stone-800'
                             }`}
                           >
                             Internal Note <Lock className="size-3" />
                           </button>
                           
                           {/* Quick Macros */}
                           <div className="flex-1 flex justify-end gap-1.5 overflow-x-auto">
                              <button
                                onClick={handleAIDraft}
                                disabled={isDrafting}
                                className="calm-btn shrink-0 text-xs font-medium px-3 py-1 rounded-full bg-[#f5efe8] hover:bg-[#ebe3da] text-[#6e533c] border border-[#e3d5c5] flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                 {isDrafting ? <Loader2 className="size-3 animate-spin" /> : null}
                                 AI Suggested
                              </button>
                              {MACROS.map(m => (
                                <button
                                  key={m.label}
                                  onClick={() => setReplyText(m.body)}
                                  className="calm-btn shrink-0 text-xs font-medium px-3 py-1 rounded-full bg-[#f4f4f2] hover:bg-[#ebe9e4] text-stone-700 border border-[#e2dfd9] cursor-pointer"
                                >
                                  {m.label}
                                </button>
                              ))}
                           </div>
                         </div>

                         {/* Attached Files List */}
                         {composerAttachments.length > 0 && (
                           <div className="flex flex-wrap gap-2 pt-1">
                             {composerAttachments.map(att => (
                               <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-[#e2dfd9] bg-[#f4f4f2] text-stone-700">
                                 <FileIcon className="size-3 text-stone-400" />
                                 <span className="truncate max-w-[120px] font-medium">{att.file.name}</span>
                                 <button type="button" onClick={() => removeTechAttachment(att.id)} className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer">
                                   <Trash2 className="size-3" />
                                 </button>
                               </div>
                             ))}
                           </div>
                         )}

                         {/* Voice Error Notice */}
                         {speechError && (
                           <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border border-[#e3d5c5] bg-[#f5efe8] text-[#6e533c]">
                             <div className="flex items-center gap-1.5">
                               <AlertCircle className="size-3.5 text-[#8c6d53] shrink-0" />
                               <span>{speechError}</span>
                             </div>
                             <button onClick={clearSpeechError} className="text-[#8c6d53] hover:underline font-semibold ml-2 cursor-pointer">Dismiss</button>
                           </div>
                         )}
                         
                         <form onSubmit={handleSendReply} className="relative">
                           <textarea
                             value={replyText}
                             onChange={e => setReplyText(e.target.value)}
                             placeholder={isInternal ? "Write internal note (visible to support specialists only)..." : "Type your reply to customer..."}
                             rows={3}
                             className="w-full resize-none p-2.5 pb-11 pr-24 rounded-xl border border-[#e2dfd9] bg-[#fafaf9] focus:bg-white text-stone-800 text-xs outline-none focus:border-[#8c6d53] transition-colors"
                             onKeyDown={e => {
                               if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                 handleSendReply(e);
                               }
                             }}
                           />

                           <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                             <label className="p-1.5 rounded-lg cursor-pointer text-stone-500 hover:text-stone-800 hover:bg-[#ebe9e4] transition-colors" title="Attach file">
                               <Paperclip className="size-4" />
                               <input type="file" multiple onChange={handleTechFileSelect} className="hidden" />
                             </label>

                             <button
                               type="button"
                               onClick={toggleVoiceInput}
                               className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                                 isListening
                                   ? 'bg-[#8c6d53] text-white'
                                   : isTranscribing
                                   ? 'bg-[#f5efe8] text-[#8c6d53]'
                                   : 'text-stone-500 hover:text-stone-800 hover:bg-[#ebe9e4]'
                               }`}
                               title={isListening ? 'Stop recording' : 'Voice dictation'}
                             >
                               {isTranscribing ? (
                                 <Loader2 className="size-4 animate-spin" />
                               ) : (
                                 <Mic className="size-4" />
                               )}
                               {isListening && <span className="font-semibold text-[10px] tabular-nums">{recordingSeconds}s</span>}
                             </button>
                           </div>

                           <button
                             type="submit"
                             disabled={!replyText.trim() && composerAttachments.length === 0}
                             className="calm-btn absolute bottom-2.5 right-2.5 bg-[#8c6d53] hover:bg-[#765a43] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                           >
                             <Send className="size-3.5" />
                             Send
                           </button>
                         </form>
                      </div>
                    </motion.div>
                  )}
                  
                  {inspectorTab === 'ai_intel' && (
                    <motion.div
                      key={`ai-${activeTicket.id}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16 }}
                      className="flex-1 p-6 flex flex-col items-center justify-center bg-[#f4f4f2] text-stone-600"
                    >
                      <Cpu className="size-10 mb-3 text-[#8c6d53]" />
                      <p className="font-bold text-base text-stone-800">AI Triage Assessment</p>
                      <p className="text-xs mt-1 tabular-nums">
                        Confidence Score: <strong className="text-[#2f6b45]">{aiConfidenceAnimated}%</strong>
                      </p>

                      {/* Smooth Confidence Bar */}
                      <div className="w-full max-w-md h-2 rounded-full bg-[#e2dfd9] overflow-hidden mt-3">
                        <div
                          style={{ width: `${aiConfidenceAnimated}%` }}
                          className="h-full bg-[#8c6d53] rounded-full transition-all duration-300"
                        />
                      </div>

                      <div className="mt-4 p-4 rounded-xl border border-[#e2dfd9] bg-white max-w-md w-full text-xs space-y-2 text-stone-700">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Assigned Category:</span>
                          <span className="font-semibold capitalize">{activeTicket.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Assessed Priority:</span>
                          <span className="font-semibold capitalize">{activeTicket.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Classification Engine:</span>
                          <span className="font-semibold">Gemini 2.5 Flash</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {inspectorTab === 'requester' && (
                    <motion.div
                      key={`requester-${activeTicket.id}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16 }}
                      className="flex-1 p-6 flex flex-col items-center justify-center bg-[#f4f4f2] text-stone-600"
                    >
                      <User className="size-10 mb-3 text-[#8c6d53]" />
                      <p className="font-bold text-base text-stone-800">{activeTicket.requester_name}</p>
                      <p className="text-xs mt-1 text-stone-500">{activeTicket.requester_email}</p>
                      <div className="mt-4 p-4 rounded-xl border border-[#e2dfd9] bg-white max-w-md w-full text-xs space-y-2 text-stone-700">
                        <div className="flex justify-between">
                          <span className="text-stone-500">User Role:</span>
                          <span className="font-semibold uppercase text-[#8c6d53]">Customer</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Ticket Origin:</span>
                          <span className="font-semibold">Web Portal</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f4f4f2] text-stone-500">
                 <TicketIcon className="size-12 mb-3 text-stone-400" />
                 <p className="font-semibold text-base text-stone-700">No Ticket Selected</p>
                 <p className="text-xs">Select a ticket from the queue to view details.</p>
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
