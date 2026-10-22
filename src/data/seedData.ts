import {
  CategoryMeta,
  FAQItem,
  Macro,
  Ticket,
  TicketMessage,
  UserProfile,
  EmailOutboxItem,
  SLAConfig,
  SLAEvaluation,
  SecurityAuditEntry,
} from '../types';

export const DEFAULT_SLA_CONFIG: SLAConfig = {
  urgent: 2,
  high: 4,
  medium: 8,
  low: 24,
  updated_at: new Date().toISOString(),
  updated_by: 'philibaneawonke@gmail.com',
};

export function evaluateTicketSLA(ticket: Ticket, slaConfig: SLAConfig): SLAEvaluation {
  const targetHours =
    ticket.priority === 'urgent'
      ? slaConfig.urgent
      : ticket.priority === 'high'
      ? slaConfig.high
      : ticket.priority === 'medium'
      ? slaConfig.medium
      : slaConfig.low;

  const targetMs = Math.max(0.5, targetHours) * 60 * 60 * 1000;
  const createdMs = new Date(ticket.created_at).getTime() || Date.now();
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
  const endMs = isResolved && ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : Date.now();
  const elapsedMs = Math.max(0, endMs - createdMs);
  const elapsedHours = Number((elapsedMs / (1000 * 60 * 60)).toFixed(1));
  const remainingMinutes = Math.round((targetMs - elapsedMs) / (1000 * 60));
  const percentElapsed = Math.min(200, Math.round((elapsedMs / targetMs) * 100));

  const formatDuration = (mins: number) => {
    const absMins = Math.abs(mins);
    if (absMins < 60) return `${absMins}m`;
    const h = Math.floor(absMins / 60);
    const m = absMins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (isResolved) {
    if (elapsedMs <= targetMs) {
      return {
        status: 'met',
        label: `Met SLA (${elapsedHours}h / ${targetHours}h)`,
        shortLabel: `Met SLA · ${elapsedHours}h`,
        targetHours,
        elapsedHours,
        remainingMinutes,
        percentElapsed,
      };
    }
    return {
      status: 'resolved_late',
      label: `Resolved Late (${elapsedHours}h / ${targetHours}h)`,
      shortLabel: `Late · ${elapsedHours}h`,
      targetHours,
      elapsedHours,
      remainingMinutes,
      percentElapsed,
    };
  }

  if (remainingMinutes < 0) {
    return {
      status: 'breached',
      label: `Overdue by ${formatDuration(remainingMinutes)} (${targetHours}h SLA)`,
      shortLabel: `${formatDuration(remainingMinutes)} overdue`,
      targetHours,
      elapsedHours,
      remainingMinutes,
      percentElapsed,
    };
  }

  if (percentElapsed >= 75) {
    return {
      status: 'at_risk',
      label: `At Risk · ${formatDuration(remainingMinutes)} left (${targetHours}h SLA)`,
      shortLabel: `${formatDuration(remainingMinutes)} left`,
      targetHours,
      elapsedHours,
      remainingMinutes,
      percentElapsed,
    };
  }

  return {
    status: 'on_track',
    label: `On Track · ${formatDuration(remainingMinutes)} left (${targetHours}h SLA)`,
    shortLabel: `${formatDuration(remainingMinutes)} left`,
    targetHours,
    elapsedHours,
    remainingMinutes,
    percentElapsed,
  };
}

export const CATEGORIES: CategoryMeta[] = [
  {
    value: 'hardware',
    label: 'Hardware & Devices',
    blurb: 'Laptops, desktops, monitors, docking stations, printers & peripherals',
    iconName: 'Laptop',
  },
  {
    value: 'software',
    label: 'Software & Application Support',
    blurb: 'Installs, updates, runtime crashes, IDEs, licenses & SaaS tooling',
    iconName: 'Code',
  },
  {
    value: 'network',
    label: 'Network & Connectivity',
    blurb: 'Office Wi-Fi, GlobalProtect VPN, LAN drops & remote bandwidth issues',
    iconName: 'Wifi',
  },
  {
    value: 'access',
    label: 'Account & Access Management',
    blurb: 'SSO passwords, MFA tokens, Okta lockouts, IAM & directory permissions',
    iconName: 'KeyRound',
  },
  {
    value: 'security',
    label: 'Security Incidents',
    blurb: 'Phishing attempts, endpoint anomalies, malware & suspicious activity',
    iconName: 'ShieldAlert',
  },
  {
    value: 'billing',
    label: 'Billing & Payments',
    blurb: 'Invoices, enterprise plan renewals, seat licenses & payment card updates',
    iconName: 'CreditCard',
  },
  {
    value: 'general',
    label: 'General Business Inquiry',
    blurb: 'Consultations, contract upgrades, custom workflow integrations & feedback',
    iconName: 'HelpCircle',
  },
];

export function getCategoryLabel(val: string): string {
  return CATEGORIES.find((c) => c.value === val)?.label ?? val;
}

export function formatStatus(status: string): string {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const MACROS: Macro[] = [
  {
    label: 'Acknowledge',
    body: "Thanks for reaching out — I've picked up your ticket and I'm looking into it now.",
  },
  {
    label: 'Need more info',
    body: 'Could you share a bit more detail (screenshots, OS version, device hostname, and when this started)? That will help me diagnose and resolve this faster.',
  },
  {
    label: 'Remote session',
    body: "I'd like to initiate a quick remote assistance session to inspect the diagnostics. Please confirm a 15-minute slot that suits you and keep your machine connected to power.",
  },
  {
    label: 'Resolved',
    body: "This issue has now been resolved and verified. I am closing the ticket, but please reply to this thread anytime if you need further assistance.",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    q: 'How do I reset my password?',
    a: "Go to the sign-in page and choose 'Forgot password', or present your badge at the IT kiosk on the 2nd floor for an in-person temporary PIN reset.",
    category: 'access',
  },
  {
    q: 'My Wi-Fi keeps dropping — what should I try?',
    a: "Toggle Wi-Fi off and on, forget the corporate network 'Enterprise-Secure' and rejoin with your current SSO credentials, or ensure your VPN client is up to date.",
    category: 'network',
  },
  {
    q: 'How do I request a new software licence or SaaS seat?',
    a: "Submit a request under 'Software & Application Support' specifying the application name, business justification, and department cost centre.",
    category: 'software',
  },
  {
    q: 'How to set up Multi-Factor Authentication (MFA)?',
    a: 'Download your preferred authenticator app (Google Authenticator or Microsoft Authenticator), visit your account security settings, and scan the provisioned QR code.',
    category: 'access',
  },
  {
    q: 'How do I connect to the corporate VPN from home?',
    a: "Open the installed GlobalProtect/AnyConnect VPN client, enter gateway 'vpn.technoresolve.internal', and sign in with your enterprise SSO credentials.",
    category: 'network',
  },
  {
    q: 'What are the SLA response times for different priorities?',
    a: 'Urgent (P1): < 2 hours; High (P2): < 4 hours; Medium (P3): < 8 hours; Low (P4): < 24 business hours (customizable by Administrator).',
    category: 'general',
  },
];

// Clean zero-state collections (no seeded demo items)
export const INITIAL_USERS: UserProfile[] = [];
export const INITIAL_TICKETS: Ticket[] = [];
export const INITIAL_MESSAGES: TicketMessage[] = [];
export const INITIAL_OUTBOX: EmailOutboxItem[] = [];
export const INITIAL_AUDIT_LOGS: SecurityAuditEntry[] = [
  {
    id: 'AUD-1001',
    action: 'ROLE_UPDATED',
    category: 'role',
    actor_id: 'system-bootstrap',
    actor_name: 'System Security Policy',
    actor_email: 'philibaneawonke@gmail.com',
    target_id: 'admin-root',
    target_name: 'Philibane Awonke',
    target_email: 'philibaneawonke@gmail.com',
    details: 'Designated primary System Administrator role and enforced strict portal isolation.',
    previous_value: 'USER',
    new_value: 'ADMIN',
    created_at: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: 'AUD-1002',
    action: 'SLA_UPDATED',
    category: 'policy',
    actor_id: 'system-bootstrap',
    actor_name: 'Philibane Awonke',
    actor_email: 'philibaneawonke@gmail.com',
    target_id: 'sla-policy-global',
    target_name: 'Global SLA Policy',
    target_email: 'system@technoresolve.com',
    details: 'Initialized SLA resolution targets: Urgent 2h · High 4h · Medium 8h · Low 24h.',
    previous_value: 'Default',
    new_value: '2h / 4h / 8h / 24h',
    created_at: new Date(Date.now() - 1800 * 1000).toISOString(),
  },
];

