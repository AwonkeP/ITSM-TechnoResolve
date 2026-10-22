import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  ShieldCheck,
  Ticket as TicketIcon,
  Trash2,
  X,
  Volume2,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicket?: (ticketId: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onSelectTicket,
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    playNotificationSound,
    setViewRole,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'ticket' | 'approval' | 'system'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'ticket') return n.type === 'ticket' || n.type === 'message';
    if (activeTab === 'approval') return n.type === 'approval' || n.type === 'verification';
    if (activeTab === 'system') return n.type === 'system';
    return true;
  });

  const handleNotificationClick = async (notif: AppNotification) => {
    await markNotificationAsRead(notif.id);
    if (notif.target_id && onSelectTicket && (notif.type === 'ticket' || notif.type === 'message')) {
      onSelectTicket(notif.target_id);
      onClose();
    } else if (notif.type === 'approval' && currentUser?.role === 'admin') {
      setViewRole('admin');
      onClose();
    }
  };

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'ticket':
        return <TicketIcon className="size-4 text-cyan-400" />;
      case 'message':
        return <MessageSquare className="size-4 text-blue-400" />;
      case 'approval':
        return <ShieldCheck className="size-4 text-purple-400" />;
      case 'verification':
        return <Mail className="size-4 text-amber-400" />;
      default:
        return <Sparkles className="size-4 text-emerald-400" />;
    }
  };

  return (
    <div
      id="notification-center-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-slate-700/80 bg-[#09172e] shadow-2xl overflow-hidden text-slate-100 font-sans"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#060f1e]/80">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 grid place-items-center">
              <Bell className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Notifications & Alerts</h3>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-cyan-500 text-slate-950">
                    {unreadNotificationsCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Real-time system events and alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={playNotificationSound}
              title="Test Sound Chime"
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Volume2 className="size-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#071326] border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {(['all', 'unread', 'ticket', 'approval', 'system'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="text-[11px] text-cyan-400 hover:underline font-semibold whitespace-nowrap ml-2 cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Inbox className="size-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No notifications in this view</p>
              <p className="text-xs text-slate-500">
                You are all caught up! New alerts will trigger real-time banners and chimes.
              </p>
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 mb-1 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'hover:bg-slate-800/40 opacity-70 border border-transparent'
                    : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 shadow-sm'
                }`}
              >
                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                  notif.read ? 'bg-slate-800/80 border-slate-700/50' : 'bg-slate-700/50 border-slate-600/50'
                }`}>
                  {getIconForType(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold truncate ${notif.read ? 'text-slate-300' : 'text-white'}`}>{notif.title}</h4>
                    <span className={`text-[10px] whitespace-nowrap ${notif.read ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${notif.read ? 'text-slate-400' : 'text-slate-200'}`}>{notif.message}</p>
                </div>

                {!notif.read && (
                  <span className="size-2.5 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#060f1e] flex items-center justify-between text-[11px] text-slate-400">
          <span>Real-time Firestore alerts active</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
