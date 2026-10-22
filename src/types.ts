export type UserRole = 'admin' | 'technician' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company?: string;
  role: UserRole;
  is_approved: boolean;
  email_verified: boolean;
  verification_code?: string;
  rejected?: boolean;
  banned: boolean;
  created_at: string;
  avatar_url?: string;
  phone?: string;
}

export interface AppNotification {
  id: string;
  user_id?: string; // targeted user or 'all' or 'admin'
  title: string;
  message: string;
  type: 'ticket' | 'approval' | 'verification' | 'system' | 'message';
  read: boolean;
  created_at: string;
  link_page?: string;
  target_id?: string;
}

export type TicketCategory =
  | 'hardware'
  | 'software'
  | 'network'
  | 'access'
  | 'security'
  | 'billing'
  | 'general';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus =
  | 'new'
  | 'in_progress'
  | 'pending_user'
  | 'escalated'
  | 'resolved'
  | 'closed';


export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // Could be data URL or remote URL
}

export interface Ticket {
  attachments?: Attachment[];
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  company?: string;
  assigned_to?: string;
  assigned_name?: string;
  ai_category?: TicketCategory;
  ai_confidence?: number;
  ai_reasoning?: string;
  ai_suggested_priority?: TicketPriority;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  ticket_requester_id?: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  body: string;
  internal: boolean;
  created_at: string;
  attachments?: Attachment[];
}

export interface EmailOutboxItem {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: 'sent' | 'queued' | 'failed';
  created_at: string;
  ticket_id?: string;
  payload?: string;
}

export interface FAQItem {
  q: string;
  a: string;
  category: TicketCategory;
}

export interface Macro {
  label: string;
  body: string;
}

export interface CategoryMeta {
  value: TicketCategory;
  label: string;
  blurb: string;
  iconName: string;
}
