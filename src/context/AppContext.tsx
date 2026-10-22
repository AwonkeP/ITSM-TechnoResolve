import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  AppNotification,
  EmailOutboxItem,
  Ticket,
  TicketCategory,
  TicketMessage,
  UserProfile,
  UserRole,
} from '../types';
import {
  INITIAL_MESSAGES,
  INITIAL_OUTBOX,
  INITIAL_TICKETS,
  INITIAL_USERS,
} from '../data/seedData';
import {
  initializeFirestoreDatabase,
  getUsersCountFromFirestore,
  subscribeToTickets,
  subscribeToMessages,
  subscribeToUsers,
  subscribeToOutbox,
  subscribeToNotifications,
  saveTicketToFirestore,
  updateTicketInFirestore,
  saveMessageToFirestore,
  saveUserToFirestore,
  updateUserInFirestore,
  deleteUserFromFirestore,
  saveOutboxToFirestore,
  saveNotificationToFirestore,
  updateNotificationInFirestore,
  purgeAllFirestoreData,
} from '../lib/firestoreService';
import { auth, db, googleProvider } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
    signOut as fbSignOut,
  signInWithPopup,
} from 'firebase/auth';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  currentUser: UserProfile | null;
  viewRole: UserRole;
  setViewRole: (role: UserRole) => void;
  tickets: Ticket[];
  messages: TicketMessage[];
  users: UserProfile[];
  outbox: EmailOutboxItem[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  unreadCounts: Record<string, number>;
  activePage: string;
  setActivePage: (page: string) => void;
  markTicketRead: (ticketId: string) => void;
  createTicket: (data: {
    title: string;
    description: string;
    company?: string;
    category?: TicketCategory;
    attachments?: { id: string; name: string; size: number; type: string; url: string; }[];
  }) => Promise<{ ticket: Ticket; aiResult?: any }>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  sendMessage: (ticketId: string, body: string, internal?: boolean, attachments?: any[]) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateUserStatus: (
    userId: string,
    updates: { is_approved?: boolean; banned?: boolean; rejected?: boolean }
  ) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  approveUser: (userId: string, role?: UserRole) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  signIn: (email: string, password?: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signUp: (data: {
    email: string;
    password?: string;
    full_name: string;
    company?: string;
    role?: UserRole;
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  switchDemoUser: (role: UserRole) => void;
  purgeAllData: () => Promise<void>;
  draftAIReply: (ticketId: string) => Promise<string>;
  isAIClassifying: boolean;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  notificationToast: ToastItem | null;
  clearNotification: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  playNotificationSound: () => void;
  isOutboxOpen: boolean;
  setIsOutboxOpen: (open: boolean) => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  isAdmin: boolean;
  isTechnician: boolean;
  isApproved: boolean;
  isEmailVerified: boolean;
  pendingUsersCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'technoresolve_current_user_id_v4',
  VIEW_ROLE: 'technoresolve_view_role_v4',
  UNREAD: 'technoresolve_unread_v4',
};

// Play a pleasant synthesizer notification sound via Web Audio API
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch (e) {
    // Web audio might be restricted before first user interaction
  }
};

// Designated Administrator Email from workspace
export const DESIGNATED_ADMIN_EMAILS = [
  'tatiavumile@gmail.com',
  'avutati@gmail.com',
  'philibaneawonke@gmail.com',
  'maladze.mugeri@capaciti.org.za',
  'emihle.tom@capaciti.org.za',
  'malhilhibonani02@gmail.com',
];
export const isDesignatedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return DESIGNATED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [messages, setMessages] = useState<TicketMessage[]>(INITIAL_MESSAGES);
  const [outbox, setOutbox] = useState<EmailOutboxItem[]>(INITIAL_OUTBOX);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (savedId && INITIAL_USERS.length > 0) {
      const match = INITIAL_USERS.find((u) => u.id === savedId);
      if (match) return match;
    }
    return null;
  });

  const [viewRole, setViewRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_ROLE);
    return (saved as UserRole) || currentUser?.role || 'admin';
  });

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UNREAD);
    return saved ? JSON.parse(saved) : {};
  });

  const [activePage, setActivePage] = useState<string>('landing');
  const [isAIClassifying, setIsAIClassifying] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notificationToast, setNotificationToast] = useState<ToastItem | null>(null);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const prevNotifsLengthRef = useRef(0);

  // Derived authorization statuses
  const isAdmin = currentUser?.role === 'admin';
  const isTechnician = currentUser?.role === 'technician' || currentUser?.role === 'admin';
  const isApproved = currentUser?.is_approved === true;
  const isEmailVerified = true;
  const pendingUsersCount = users.filter((u) => !u.is_approved && !u.rejected).length;

  // Filter notifications for current user
  const userNotifications = notifications.filter(
    (n) =>
      !n.user_id ||
      n.user_id === 'all' ||
      n.user_id === currentUser?.id ||
      (isAdmin && n.user_id === 'admin')
  );

  const unreadNotificationsCount = userNotifications.filter((n) => !n.read).length;

  // Real-time snapshot listeners for Firestore
  useEffect(() => {
    initializeFirestoreDatabase();

    const unsubAuth = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        const uid = fbUser.uid;
        const email = fbUser.email || '';
        const isDesignated = isDesignatedAdminEmail(email);

        const count = await getUsersCountFromFirestore();
        const isFirstUser = count === 0;
        const assignedRole: UserRole = (isFirstUser || isDesignated) ? 'admin' : 'user';

        // Check if user already exists
        const matched = users.find((u) => u.id === uid || (email && u.email.toLowerCase() === email.toLowerCase()));
        if (matched) {
          const userWithUid: UserProfile = {
            ...matched,
            id: uid,
            role: (isDesignated || matched.role === 'admin') ? 'admin' : matched.role,
            is_approved: isDesignated ? true : matched.is_approved,
            email_verified: true,
          };
          setCurrentUser(userWithUid);
          setUsers((prev) => prev.map((u) => (u.id === matched.id || u.id === uid) ? userWithUid : u));
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, uid);
          await saveUserToFirestore(userWithUid);
        } else {
          const newUser: UserProfile = {
            id: uid,
            email: email,
            full_name: fbUser.displayName || (email ? email.split('@')[0] : 'User'),
            company: isDesignated ? 'TechnoResolve IT Administration' : 'Enterprise Support',
            role: assignedRole,
            is_approved: isFirstUser || isDesignated,
            email_verified: true,
            banned: false,
            created_at: new Date().toISOString(),
          };
          setCurrentUser(newUser);
          setUsers((prev) => [...prev.filter((u) => u.id !== uid), newUser]);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, uid);
          await saveUserToFirestore(newUser);
        }
      }
    });

    const unsubTickets = subscribeToTickets(currentUser?.role, currentUser?.id, (realTickets) => {
      setTickets(realTickets || []);
    });

    const unsubMessages = subscribeToMessages(currentUser?.role, currentUser?.id, (realMessages) => {
      setMessages(realMessages || []);
    });

    const unsubUsers = subscribeToUsers(currentUser?.id, (realUsers) => {
      setUsers(realUsers || []);
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (savedId) {
        const matched = (realUsers || []).find((u) => u.id === savedId);
        if (matched) {
          // If this is the designated admin and it's the currently authenticated user, ensure admin role
          if (isDesignatedAdminEmail(matched.email) && matched.role !== 'admin' && auth.currentUser?.uid === matched.id) {
            const upgradedAdmin: UserProfile = {
              ...matched,
              role: 'admin',
              is_approved: true,
              email_verified: true,
            };
            setCurrentUser(upgradedAdmin);
          } else {
            setCurrentUser(matched);
          }
          // If role changed externally or user is not admin, keep viewRole aligned
          if (matched.role !== 'admin' && viewRole !== matched.role) {
            setViewRoleState(matched.role);
          }
        }
      }
    });

    const unsubOutbox = subscribeToOutbox(currentUser?.role, (realOutbox) => {
      setOutbox(realOutbox || []);
    });

    const unsubNotifs = subscribeToNotifications(currentUser?.role, currentUser?.id, (realNotifs) => {
      setNotifications(realNotifs || []);
      // Chime ONLY when a new unread notification arrives after initial load
      if (realNotifs && prevNotifsLengthRef.current > 0 && realNotifs.length > prevNotifsLengthRef.current) {
        const newest = realNotifs[0];
        if (newest && !newest.read) {
          playChimeSound();
        }
      }
      prevNotifsLengthRef.current = realNotifs?.length || 0;
    });

    return () => {
      unsubAuth();
      unsubTickets();
      unsubMessages();
      unsubUsers();
      unsubOutbox();
      unsubNotifs();
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNREAD, JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setNotificationToast((prev) => (prev?.id === id ? null : prev));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = { id, message, type };
    setToasts((prev) => [...prev.slice(-4), newToast]);
    setNotificationToast(newToast);
    // Silent for standard toast feedback; chime sound is only played for notifications
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [dismissToast]);

  const clearNotification = useCallback(() => {
    setNotificationToast(null);
    setToasts([]);
  }, []);

  const playNotificationSound = useCallback(() => {
    playChimeSound();
  }, []);

  // Role-based access control: Only Admin can switch to any workspace; Technicians can access Tech + Customer; Users can only access Customer.
  const setViewRole = (role: UserRole) => {
    if (!currentUser) {
      setViewRoleState(role);
      localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, role);
      return;
    }

    if (currentUser.role === 'admin') {
      // Admin has full cross-workspace access
      setViewRoleState(role);
      localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, role);
      const roleName = role === 'admin' ? 'Administrator' : role === 'technician' ? 'Technician' : 'Customer';
      showToast(`Admin view context switched to ${roleName}`, 'info');
      return;
    }

    if (currentUser.role === 'technician') {
      if (role === 'admin') {
        showToast('🔒 Access Denied: Administrator privileges required to access the Admin Control Center.', 'error');
        return;
      }
      setViewRoleState(role);
      localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, role);
      showToast(`Switched to ${role === 'technician' ? 'Technician Workspace' : 'Customer Portal'}`, 'info');
      return;
    }

    // Standard User / Customer
    if (role !== 'user') {
      showToast(`🔒 Access Denied: ${role === 'admin' ? 'Administrator' : 'Technician'} role required to access this workspace.`, 'error');
      return;
    }

    setViewRoleState('user');
    localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, 'user');
  };

  const switchDemoUser = (role: UserRole) => {
    const target = users.find((u) => u.role === role);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
      setViewRoleState(target.role);
      localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, target.role);
      showToast(`Switched active profile to ${target.full_name} (${role.toUpperCase()})`, 'info');
    } else {
      showToast(`No registered ${role} found in database.`, 'info');
    }
  };

  const purgeAllData = async () => {
    try {
      await purgeAllFirestoreData();
      setUsers([]);
      setTickets([]);
      setMessages([]);
      setOutbox([]);
      setNotifications([]);
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      localStorage.removeItem(STORAGE_KEYS.UNREAD);
      localStorage.removeItem(STORAGE_KEYS.VIEW_ROLE);
      setActivePage('login');
      showToast('All database collections purged. Ready for fresh initial admin signup.', 'info');
    } catch (err) {
      showToast('Error purging database', 'error');
    }
  };

  const markTicketRead = useCallback((ticketId: string) => {
    setUnreadCounts((prev) => {
      if (!prev[ticketId]) return prev;
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
  }, []);

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await updateNotificationInFirestore(id, { read: true });
  };

  const markAllNotificationsAsRead = async () => {
    const unread = userNotifications.filter((n) => !n.read);
    setNotifications((prev) =>
      prev.map((n) => (userNotifications.some((un) => un.id === n.id) ? { ...n, read: true } : n))
    );
    for (const notif of unread) {
      await updateNotificationInFirestore(notif.id, { read: true });
    }
    showToast('All notifications marked as read', 'info');
  };

  const createTicket = async (data: {
    title: string;
    description: string;
    company?: string;
    category?: TicketCategory;
    attachments?: { id: string; name: string; size: number; type: string; url: string; }[];
  }) => {
    setIsAIClassifying(true);
    let aiData: any = null;

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          company: data.company || currentUser?.company,
          userSelectedCategory: data.category,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        aiData = json.ai;
      }
    } catch (err) {
      console.warn('Triage API call failed:', err);
    } finally {
      setIsAIClassifying(false);
    }

    const assignedCategory = aiData?.category || data.category || 'general';
    const assignedPriority = aiData?.priority || 'medium';
    const nextNum = 1000 + tickets.length + 1;
    const ticketId = `TICK-${nextNum}`;
    
    // WORKFLOW AUTOMATION: Auto-escalate if AI priority is critical and confidence > 0.8
    let initialStatus: Ticket['status'] = 'new'; // Default to new
    let autoEscalated = false;
    if (assignedPriority === 'critical' && (aiData?.confidence || 1) > 0.8) {
      initialStatus = 'escalated';
      autoEscalated = true;
    }

    const newTicket: Ticket = {
      attachments: data.attachments || [],
      id: ticketId,
      title: data.title,
      description: data.description,
      category: assignedCategory,
      priority: assignedPriority,
      status: initialStatus,
      requester_id: currentUser?.id || `user-guest-${Date.now()}`,
      requester_name: currentUser?.full_name || 'Customer Requester',
      requester_email: currentUser?.email || 'customer@company.com',
      company: data.company || currentUser?.company || 'Enterprise Client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ai_category: aiData?.category || assignedCategory,
      ai_confidence: typeof aiData?.confidence === 'number' ? aiData.confidence : 0.92,
      ai_reasoning: aiData?.reasoning || 'Categorized automatically by triage engine.',
      ai_suggested_priority: aiData?.priority || assignedPriority,
    };

    setTickets((prev) => [newTicket, ...prev]);
    await saveTicketToFirestore(newTicket);

    // Email Outbox notification for customer
    const outboxItem: EmailOutboxItem = {
      id: `out-${Date.now()}`,
      to: newTicket.requester_email,
      subject: `[TechnoResolve #${ticketId}] Ticket Received: ${data.title}`,
      template: 'ticket_created_customer',
      status: 'sent',
      created_at: new Date().toISOString(),
      ticket_id: ticketId,
      payload: `Hello ${newTicket.requester_name},\n\nWe received your request #${ticketId}: "${data.title}". Our team has been assigned and will update you shortly.`,
    };

    setOutbox((prev) => [outboxItem, ...prev]);
    saveOutboxToFirestore(outboxItem);
    
    if (autoEscalated) {
      // Send SLA violation / auto-escalation alert
      const escalationEmail: EmailOutboxItem = {
        id: `out-esc-${Date.now()}`,
        to: 'admin@technoresolve.com', // Group admin inbox
        subject: `[URGENT] Auto-Escalated Ticket #${ticketId}`,
        template: 'ticket_escalation',
        status: 'sent',
        created_at: new Date().toISOString(),
        ticket_id: ticketId,
        payload: `AI Workflow Automation triggered escalation for Ticket #${ticketId} based on high priority and high confidence assessment.`,
      };
      setOutbox((prev) => [escalationEmail, ...prev]);
      saveOutboxToFirestore(escalationEmail);
    }

    // Broadcast system notification for technicians/admins
    const adminNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: 'admin',
      title: `New Ticket #${ticketId}`,
      message: `${newTicket.requester_name} submitted "${data.title}" [${assignedPriority.toUpperCase()}]`,
      type: 'ticket',
      read: false,
      created_at: new Date().toISOString(),
      target_id: ticketId,
      link_page: 'tickets',
    };
    setNotifications((prev) => [adminNotif, ...prev]);
    saveNotificationToFirestore(adminNotif);

    showToast(`Ticket #${ticketId} created successfully!`, 'success');
    return { ticket: newTicket, aiResult: aiData };
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    const updatedWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString(),
      ...(updates.status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
      ...(updates.status === 'closed' ? { closed_at: new Date().toISOString() } : {}),
    };

    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedWithTimestamp } : t))
    );
    await updateTicketInFirestore(id, updatedWithTimestamp);

    const targetTicket = tickets.find((t) => t.id === id);
    if (targetTicket) {
      // Dispatch notification to requester about status change
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        user_id: targetTicket.requester_id,
        title: `Ticket #${id} Updated`,
        message: `Status changed to: ${updates.status || 'Updated'}`,
        type: 'ticket',
        read: false,
        created_at: new Date().toISOString(),
        target_id: id,
        link_page: 'tickets',
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotificationToFirestore(notif);

      // Email dispatch for ticket updates
      if (updates.status) {
        const outItem: EmailOutboxItem = {
          id: `out-${Date.now()}`,
          to: targetTicket.requester_email,
          subject: `[TechnoResolve #${id}] Ticket Status Update: ${updates.status.toUpperCase()}`,
          template: 'ticket_status_update',
          status: 'sent',
          created_at: new Date().toISOString(),
          ticket_id: id,
          payload: `Your ticket #${id} status has been updated to "${updates.status}".`,
        };
        setOutbox((prev) => [outItem, ...prev]);
        saveOutboxToFirestore(outItem);
      }
    }

    showToast(`Ticket #${id} updated (${updates.status || 'saved'})`, 'info');
  };

  const sendMessage = async (ticketId: string, body: string, internal: boolean = false, attachments: any[] = []) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_requester_id: targetTicket?.requester_id || currentUser?.id || '',
      ticket_id: ticketId,
      author_id: currentUser?.id || 'sys-author',
      author_name: currentUser?.full_name || 'System User',
      author_role: (currentUser?.role as any) || 'user',
      body,
      internal,
      created_at: new Date().toISOString(),
      attachments,
    };

    setMessages((prev) => [...prev, newMsg]);
    await saveMessageToFirestore(newMsg);

    if (targetTicket) {
      const nextStatus =
        targetTicket.status === 'new' && (currentUser?.role === 'technician' || currentUser?.role === 'admin')
          ? 'in_progress'
          : targetTicket.status;

      const ticketUpdates: Partial<Ticket> = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ...ticketUpdates } : t))
      );
      await updateTicketInFirestore(ticketId, ticketUpdates);

      // Notify the recipient
      const recipientId =
        currentUser?.id === targetTicket.requester_id
          ? targetTicket.assigned_to || 'admin'
          : targetTicket.requester_id;

      if (!internal) {
        const notif: AppNotification = {
          id: `notif-${Date.now()}`,
          user_id: recipientId,
          title: `New Message on #${ticketId}`,
          message: `${currentUser?.full_name}: "${body.slice(0, 70)}${body.length > 70 ? '...' : ''}"`,
          type: 'message',
          read: false,
          created_at: new Date().toISOString(),
          target_id: ticketId,
          link_page: 'chat',
        };
        setNotifications((prev) => [notif, ...prev]);
        saveNotificationToFirestore(notif);
      }
    }
  };

  const draftAIReply = async (ticketId: string): Promise<string> => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return '';

    const ticketMessages = messages.filter((m) => m.ticket_id === ticketId);

    try {
      const res = await fetch('/api/ai-draft-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          messages: ticketMessages,
          technicianName: currentUser?.full_name || 'Support Specialist',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return json.suggestion || '';
      }
    } catch (e) {
      console.warn('Failed to generate AI reply:', e);
    }

    return `Hi ${ticket.requester_name},\n\nThank you for reaching out regarding "${ticket.title}". I am actively investigating the ${ticket.category} issue you reported.\n\nCould you please let me know if restarting your device or checking your connection helps? I will follow up shortly with our resolution steps.\n\nBest regards,\n${currentUser?.full_name || 'TechnoResolve Desk'}`;
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    try {
      await updateUserInFirestore(userId, { role });
    } catch (err) {
      console.warn('Could not update role in Firestore:', err);
    }

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role } : null));
      setViewRoleState(role);
    }

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: userId,
      title: 'Role Permissions Updated',
      message: `Your account role was changed to ${role.toUpperCase()}`,
      type: 'system',
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationToFirestore(notif);

    showToast(`User role updated to ${role.toUpperCase()}`, 'info');
  };

  const updateUserStatus = async (
    userId: string,
    updates: Partial<UserProfile>
  ) => {
    if (!isAdmin) {
      showToast('Unauthorized: Only administrators can modify account approvals or status.', 'error');
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
    await updateUserInFirestore(userId, updates);

    const targetUser = users.find((u) => u.id === userId);
    const updatedUserRole = updates.role || targetUser?.role || 'user';
    const roleLabel = updatedUserRole === 'admin' ? 'Administrator' : updatedUserRole === 'technician' ? 'Support Technician' : 'Customer';

    if (targetUser) {
      if (updates.is_approved) {
        const approveNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          user_id: userId,
          title: 'Account Approved! 🎉',
          message: `Your TechnoResolve account has been approved by the Administrator as a ${roleLabel}. You now have access.`,
          type: 'approval',
          read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [approveNotif, ...prev]);
        saveNotificationToFirestore(approveNotif);

        // Outbox email
        const outItem: EmailOutboxItem = {
          id: `out-${Date.now()}`,
          to: targetUser.email,
          subject: `[TechnoResolve] Account Approved: ${roleLabel} Role Assigned`,
          template: 'account_approved',
          status: 'sent',
          created_at: new Date().toISOString(),
          payload: `Hi ${targetUser.full_name},\n\nYour registration request has been reviewed and approved by the System Administrator.\n\nAssigned Role: ${roleLabel.toUpperCase()}\n\nYou can now log in and access your workspace at any time.`,
        };
        setOutbox((prev) => [outItem, ...prev]);
        saveOutboxToFirestore(outItem);
      }
    }

    showToast(
      updates.is_approved !== undefined
        ? updates.is_approved
          ? `User approved as ${roleLabel}`
          : 'User approval removed'
        : updates.banned
        ? 'User suspended'
        : 'User status updated',
      'info'
    );
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) {
      showToast('Unauthorized: Only administrators can delete users.', 'error');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      await deleteUserFromFirestore(userId);
      showToast('User account successfully removed.', 'info');
    } catch (err) {
      console.warn('Could not delete user in Firestore:', err);
    }
  };

  const approveUser = async (userId: string, role?: UserRole) => {
    if (!isAdmin || !isApproved) {
      showToast('Unauthorized: Only administrators can approve users.', 'error');
      return;
    }
    if (userId === currentUser?.id) {
      showToast('You cannot approve your own account.', 'error');
      return;
    }
    const updates: Partial<UserProfile> = {
      is_approved: true,
      rejected: false,
      role: role || 'user',
    };
    await updateUserStatus(userId, updates);
  };

  const rejectUser = async (userId: string) => {
    if (!isAdmin) {
      showToast('Unauthorized: Only administrators can reject users.', 'error');
      return;
    }
    await updateUserStatus(userId, { is_approved: false, rejected: true });
    showToast('User registration rejected', 'info');
  };

  // Verify email (legacy stub, immediately successful)
  const verifyEmail = async (_code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const updates = { email_verified: true };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u)));
    await updateUserInFirestore(currentUser.id, updates);
    setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    return true;
  };

  // Resend verification email (no-op)
  const resendVerificationEmail = async () => {
    showToast('Email verification is not required.', 'info');
  };

  // Sign In
  const signIn = async (email: string, password?: string): Promise<boolean> => {
    if (!password || password.length < 6) {
      showToast('Password is required (min 6 chars).', 'error');
      return false;
    }

    const isDesignated = isDesignatedAdminEmail(email);

    try {
      const fbCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = fbCredential.user.uid;
      
      let existing = users.find((u) => u.id === uid || u.email.toLowerCase() === email.toLowerCase());
      
      if (!existing) {
        // User exists in Firebase Auth but not in Firestore (e.g. after DB wipe)
        const count = await getUsersCountFromFirestore();
        const isFirstUser = count === 0;
        
        existing = {
          id: uid,
          email: email,
          full_name: email.split('@')[0],
          role: isFirstUser ? 'admin' : 'user',
          is_approved: isFirstUser,
          email_verified: true,
          banned: false,
          created_at: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, existing!]);
        saveUserToFirestore(existing);
      }

      if (existing) {
        if (existing.banned) {
          showToast('This account has been suspended by an administrator.', 'error');
          return false;
        }

        // If designated admin, ensure admin role and full approval
        const userProfile: UserProfile = {
          ...existing,
          id: uid,
          role: (isDesignated || existing.role === 'admin') ? 'admin' : existing.role,
          is_approved: isDesignated ? true : existing.is_approved,
          email_verified: true,
        };
        setUsers((prev) => prev.map((u) => (u.id === existing!.id || u.id === uid) ? userProfile : u));
        await saveUserToFirestore(userProfile);
        
        setCurrentUser(userProfile);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, uid);
        setViewRoleState(userProfile.role);
        localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, userProfile.role);
        setActivePage('dashboard');
        
        showToast(`Welcome back, ${userProfile.full_name}! (${userProfile.role.toUpperCase()})`, 'success');
        return true;
      } else {
        showToast('Invalid login credentials or account not registered.', 'error');
        return false;
      }
    } catch (err: any) {
      console.log('Sign in general notice:', err?.code, err?.message);
      if (err?.code === 'auth/operation-not-allowed') {
        showToast('Firebase Auth is disabled. Please enable Email/Password provider in the Firebase Console.', 'error');
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        showToast('Login failed. Please verify your email and password.', 'error');
      } else {
        showToast(err?.message || 'Login failed. Please verify your credentials.', 'error');
      }
      return false;
    }
  };

  // Google Sign-In with Firebase Auth
  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser || !fbUser.email) {
        showToast('Google Sign-In failed: No email retrieved from Google account.', 'error');
        return false;
      }

      const email = fbUser.email;
      const displayName = fbUser.displayName || (isDesignatedAdminEmail(email) ? 'Philibane Awonke' : email.split('@')[0]);
      const photoURL = fbUser.photoURL || undefined;
      const isDesignated = isDesignatedAdminEmail(email);

      let existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase() || u.id === fbUser.uid);
      if (existing) {
        if (existing.banned) {
          showToast('This account has been suspended by an administrator.', 'error');
          return false;
        }
        const userProfile: UserProfile = {
          ...existing,
          id: fbUser.uid,
          avatar_url: photoURL || existing.avatar_url,
          role: (isDesignated || existing.role === 'admin') ? 'admin' : existing.role,
          is_approved: isDesignated ? true : existing.is_approved,
          email_verified: true,
        };
        setUsers((prev) => prev.map((u) => (u.id === existing!.id || u.id === fbUser.uid) ? userProfile : u));
        await saveUserToFirestore(userProfile);

        setCurrentUser(userProfile);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, fbUser.uid);
        setViewRoleState(userProfile.role);
        localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, userProfile.role);
        setActivePage('dashboard');
        
        showToast(`Welcome back, ${userProfile.full_name}! (${userProfile.role.toUpperCase()})`, 'success');
        return true;
      }

      const count = await getUsersCountFromFirestore();
      const isFirstUser = count === 0;
      const assignedRole: UserRole = (isFirstUser || isDesignated) ? 'admin' : 'user';

      const newUser: UserProfile = {
        id: fbUser.uid,
        email: email,
        full_name: displayName,
        company: isDesignated ? 'TechnoResolve IT Administration' : 'Google Workspace User',
        role: assignedRole,
        is_approved: isFirstUser || isDesignated,
        email_verified: true,
        avatar_url: photoURL,
        banned: false,
        created_at: new Date().toISOString(),
      };

      setUsers((prev) => [...prev, newUser]);
      await saveUserToFirestore(newUser);

      if (!isFirstUser && !isDesignated) {
        const adminNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          user_id: 'admin',
          title: 'New Google User Approval Required',
          message: `${displayName} (${email}) requested access via Google and requires approval.`,
          type: 'approval',
          read: false,
          created_at: new Date().toISOString(),
          target_id: newUser.id,
          link_page: 'users',
        };
        setNotifications((prev) => [adminNotif, ...prev]);
        saveNotificationToFirestore(adminNotif);
      }

      setCurrentUser(newUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
      setViewRoleState(assignedRole);
      localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, assignedRole);
      setActivePage('dashboard');

      if (isFirstUser || isDesignated) {
        showToast('👑 Welcome! Granted full Administrator access.', 'success');
      } else {
        showToast(`Welcome ${displayName}! Google authentication verified.`, 'success');
      }
      return true;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return false;
      }
      console.warn('Google Sign-In error:', err?.code, err?.message);
      if (err?.code === 'auth/operation-not-allowed') {
        showToast('Google Sign-In is disabled. Please enable it in the Firebase Console.', 'error');
      } else {
        showToast(`Google Sign-In: ${err?.message || 'Authentication was interrupted.'}`, 'error');
      }
      return false;
    }
  };

  // Sign Up with First Admin Guarantee, Designated Admin Upgrade & Admin Approval requirement (No email verification required)
  const signUp = async (data: {
    email: string;
    password?: string;
    full_name: string;
    company?: string;
    role?: UserRole;
  }): Promise<boolean> => {
    if (!data.password || data.password.length < 6) {
      showToast('Password is required (min 6 chars).', 'error');
      return false;
    }
    
    const isDesignated = isDesignatedAdminEmail(data.email);
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      // If designated admin already exists in record, upgrade to admin and sign in
      if (isDesignated) {
        showToast('An account with this email already exists. Please sign in instead.', 'error');
        return false;
      }
      showToast('An account with this email already exists.', 'error');
      return false;
    }

    let uid = '';
    try {
      const fbCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      uid = fbCredential.user.uid;
    } catch (authErr: any) {
      console.log('Firebase Auth registration notice:', authErr?.code, authErr?.message);
      if (authErr?.code === 'auth/operation-not-allowed') {
        showToast('Firebase Auth is disabled. Please enable Email/Password provider in the Firebase Console.', 'error');
      } else if (authErr?.code === 'auth/email-already-in-use') {
        showToast('Email already in use. Please sign in instead.', 'error');
      } else {
        showToast(authErr?.message || 'Registration failed.', 'error');
      }
      return false; // MUST fail early. Do NOT proceed to write to Firestore with a fake UID!
    }

    const count = await getUsersCountFromFirestore();
    const isFirstUser = count === 0;
    const assignedRole: UserRole = (isFirstUser || isDesignated) ? 'admin' : (data.role || 'user');
    const isAutoApproved = isFirstUser || isDesignated;

    const newUser: UserProfile = {
      id: uid,
      email: data.email.trim(),
      full_name: data.full_name,
      company: data.company || (isDesignated ? 'TechnoResolve IT Administration' : 'TechnoResolve Enterprise'),
      role: assignedRole,
      is_approved: isAutoApproved, // First user or designated admin is automatically approved
      email_verified: true, // No email verification required
      banned: false,
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    await saveUserToFirestore(newUser);

    if (!isAutoApproved) {
      // Dispatch approval notification to all Admins
      const adminNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        user_id: 'admin',
        title: 'New User Approval Required',
        message: `${data.full_name} (${data.email}) requested ${assignedRole.toUpperCase()} access and requires approval.`,
        type: 'approval',
        read: false,
        created_at: new Date().toISOString(),
        target_id: newUser.id,
        link_page: 'users',
      };
      setNotifications((prev) => [adminNotif, ...prev]);
      saveNotificationToFirestore(adminNotif);
    }

    setCurrentUser(newUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    setViewRoleState(assignedRole);
    localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, assignedRole);
    setActivePage('dashboard');

    if (isAutoApproved) {
      showToast('👑 Welcome! Granted full Administrator access.', 'success');
    } else {
      showToast('Account created! An administrator will review your access request.', 'success');
    }
    
    return true;
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    setActivePage('login');
    showToast('Signed out successfully.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        viewRole,
        setViewRole,
        tickets,
        messages,
        users,
        outbox,
        notifications: userNotifications,
        unreadNotificationsCount,
        unreadCounts,
        activePage,
        setActivePage,
        markTicketRead,
        createTicket,
        updateTicket,
        sendMessage,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        verifyEmail,
        resendVerificationEmail,
        approveUser,
        rejectUser,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        switchDemoUser,
        purgeAllData,
        draftAIReply,
        isAIClassifying,
        toasts,
        dismissToast,
        notificationToast,
        clearNotification,
        showToast,
        playNotificationSound,
        isOutboxOpen,
        setIsOutboxOpen,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        isAdmin,
        isTechnician,
        isApproved,
        isEmailVerified,
        pendingUsersCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
