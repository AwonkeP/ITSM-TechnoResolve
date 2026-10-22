import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';
import {
  Bell,
  Inbox,
  Mail,
  ShieldCheck,
  Ticket as TicketIcon,
  X,
  Volume2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

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
        return <TicketIcon className="size-4 text-[#8c6d53]" />;
      case 'message':
        return <MessageSquare className="size-4 text-[#8c6d53]" />;
      case 'approval':
        return <ShieldCheck className="size-4 text-[#2f6b45]" />;
      case 'verification':
        return <Mail className="size-4 text-[#6e533c]" />;
      default:
        return <Sparkles className="size-4 text-[#8c6d53]" />;
    }
  };

  return (
    <div
      id="notification-center-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="calm-fade-slide w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-[#e2dfd9] bg-white shadow-xl overflow-hidden text-[#262523] font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2dfd9] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-[#f5efe8] text-[#8c6d53] border border-[#d6c2b0] grid place-items-center">
              <Bell className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#262523]">Notifications & Alerts</h3>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#8c6d53] text-white tabular-nums">
                    {unreadNotificationsCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5c5954]">Real-time system events and alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={playNotificationSound}
              title="Test Sound Chime"
              className="p-2 rounded-lg text-[#8c8881] hover:text-[#262523] hover:bg-[#f4f4f2] transition-all cursor-pointer"
            >
              <Volume2 className="size-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#8c8881] hover:text-[#262523] hover:bg-[#f4f4f2] transition-all cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#f4f4f2] border-b border-[#e2dfd9] text-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {(['all', 'unread', 'ticket', 'approval', 'system'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#8c6d53] text-white'
                    : 'text-[#5c5954] hover:text-[#262523] hover:bg-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="text-[11px] text-[#8c6d53] hover:underline font-semibold whitespace-nowrap ml-2 cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#ebe9e4] p-2 bg-white">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Inbox className="size-8 text-[#8c8881] mx-auto" />
              <p className="text-sm font-semibold text-[#262523]">No notifications in this view</p>
              <p className="text-xs text-[#5c5954]">
                You are all caught up. New alerts will appear here automatically.
              </p>
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 mb-1 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'hover:bg-[#f4f4f2] opacity-80 border border-transparent'
                    : 'bg-[#f5efe8]/60 border border-[#d6c2b0] hover:bg-[#f5efe8]'
                }`}
              >
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    notif.read
                      ? 'bg-[#f4f4f2] border-[#e2dfd9]'
                      : 'bg-white border-[#d6c2b0]'
                  }`}
                >
                  {getIconForType(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold truncate ${notif.read ? 'text-[#5c5954]' : 'text-[#262523]'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] whitespace-nowrap text-[#8c8881] tabular-nums">
                      {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed text-[#5c5954]">{notif.message}</p>
                </div>

                {!notif.read && (
                  <span className="size-2 rounded-full bg-[#8c6d53] shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e2dfd9] bg-[#f4f4f2] flex items-center justify-between text-[11px] text-[#5c5954]">
          <span>Real-time Firestore alerts active</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#ebe9e4] border border-[#e2dfd9] text-[#262523] font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
