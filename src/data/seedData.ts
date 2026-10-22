import { CategoryMeta, FAQItem, Macro, Ticket, TicketMessage, UserProfile, EmailOutboxItem } from '../types';

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
    a: 'Urgent (P1): < 15 minutes; High (P2): < 1 hour; Medium (P3): < 4 hours; Low (P4): < 24 business hours.',
    category: 'general',
  },
];

// Clean zero-state collections (no seeded demo items)
export const INITIAL_USERS: UserProfile[] = [];
export const INITIAL_TICKETS: Ticket[] = [];
export const INITIAL_MESSAGES: TicketMessage[] = [];
export const INITIAL_OUTBOX: EmailOutboxItem[] = [];
