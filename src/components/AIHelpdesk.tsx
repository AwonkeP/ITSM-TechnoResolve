import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw, ChevronRight, HelpCircle, ExternalLink, TicketPlus, Lightbulb } from 'lucide-react';
import { FAQ_ITEMS } from '../data/seedData';
import { TicketCategory } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestedAction?: {
    type: 'create_ticket' | 'view_faq';
    category?: TicketCategory;
    title?: string;
  };
  matchedFaqs?: typeof FAQ_ITEMS;
}

interface AIHelpdeskProps {
  onCreateTicketClick?: (category?: TicketCategory, title?: string) => void;
}

export const AIHelpdesk: React.FC<AIHelpdeskProps> = ({ onCreateTicketClick }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your TechnoResolve AI Support Assistant. Ask me anything about passwords, VPN, Wi-Fi, software requests, equipment, or service policies. I'll provide instant step-by-step answers from our verified knowledge base.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const quickPrompts = [
    'How do I reset my password?',
    'My Wi-Fi keeps disconnecting',
    'How to connect to the corporate VPN',
    'Request a software license',
  ];

  const handleSend = async (userQuery?: string) => {
    const query = (userQuery || input).trim();
    if (!query || isThinking) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/faq-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.answer,
          suggestedAction: data.suggestedAction,
          matchedFaqs: data.matchedFaqs,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error('Endpoint returned error');
      }
    } catch {
      // Local robust fallback matching knowledge base
      const lower = query.toLowerCase();
      let answer = '';
      let category: TicketCategory = 'general';
      let suggestedAction: Message['suggestedAction'] | undefined = undefined;

      if (/password|passcode|reset|forgot|login|cred/i.test(lower)) {
        answer = "To reset your password:\n1. Navigate to the login page and click 'Forgot password'.\n2. Follow the secure email verification link to create a new passphrase.\n3. If your account is locked out by Okta/SSO, an administrator can unlock it directly from the Admin Center or you can submit an Access Management ticket.";
        category = 'access';
        suggestedAction = { type: 'create_ticket', category: 'access', title: 'Password Reset / Account Unlock' };
      } else if (/wifi|wi-fi|wireless|drop|disconnect|internet/i.test(lower)) {
        answer = "If your Wi-Fi keeps disconnecting:\n1. Toggle your Wi-Fi device adapter off and back on.\n2. In network settings, choose 'Forget Network' for 'Enterprise-Secure' and reconnect using your full SSO username and password.\n3. Check if your VPN is conflicting with local network gateways.\n4. If the issue persists, our Network team can inspect access point telemetry.";
        category = 'network';
        suggestedAction = { type: 'create_ticket', category: 'network', title: 'Wi-Fi / Connectivity Issue' };
      } else if (/vpn|globalprotect|anyconnect|remote|gateway/i.test(lower)) {
        answer = "To connect to the corporate VPN from remote or home:\n1. Launch the GlobalProtect or Cisco AnyConnect application on your machine.\n2. In portal/gateway, enter: vpn.technoresolve.internal\n3. Authenticate with your enterprise SSO credentials and approve the MFA push notification on your mobile device.";
        category = 'network';
        suggestedAction = { type: 'create_ticket', category: 'network', title: 'Corporate VPN Assistance' };
      } else if (/mfa|2fa|authenticator|qr|token|phone|device/i.test(lower)) {
        answer = "To set up or reset Multi-Factor Authentication (MFA):\n1. Download Google Authenticator or Microsoft Authenticator from your app store.\n2. Visit your account profile security settings.\n3. Scan the provided QR code and enter the 6-digit confirmation code.\n4. If you lost your phone or device, submit a ticket to request an MFA re-enrollment.";
        category = 'access';
        suggestedAction = { type: 'create_ticket', category: 'access', title: 'MFA Token Re-Enrollment' };
      } else if (/software|license|licence|seat|install|app|tool|slack|zoom|figma/i.test(lower)) {
        answer = "To request a new software license or SaaS subscription seat:\n1. Click 'New Ticket' and select 'Software & Application Support'.\n2. Specify the application name, version, business justification, and department cost centre.\n3. Department managers typically review and approve software provisioning within 24 hours.";
        category = 'software';
        suggestedAction = { type: 'create_ticket', category: 'software', title: 'Software License Request' };
      } else if (/sla|response time|priority|urgent|hours/i.test(lower)) {
        answer = "Our SLA targets for response times are:\n• Urgent (P1): Under 15 minutes (Critical business block)\n• High (P2): Under 1 hour (Severe productivity impact)\n• Medium (P3): Under 4 hours (Standard inquiries & bugs)\n• Low (P4): Under 24 business hours (Routine requests & queries)";
        category = 'general';
      } else if (/laptop|screen|monitor|dock|printer|hardware|mouse|keyboard|charger/i.test(lower)) {
        answer = "For hardware issues (monitors, docking stations, chargers, or laptops):\n1. Check all cable connections and power bricks.\n2. Try power-cycling the peripheral or docking station (unplug power for 10 seconds).\n3. If physical hardware is defective or needs replacement, submit a Hardware & Devices ticket for an IT depot exchange.";
        category = 'hardware';
        suggestedAction = { type: 'create_ticket', category: 'hardware', title: 'Hardware Peripheral / Laptop Issue' };
      } else {
        answer = `Thank you for your question. Based on our support database, our IT and customer service teams handle requests like this promptly. If you can't find the answer in our FAQs below, feel free to open a ticket and our technicians will assist you directly.`;
        suggestedAction = { type: 'create_ticket', category: 'general', title: query.slice(0, 50) };
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: answer,
          suggestedAction,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Chat cleared! How can I assist you today? Ask any IT, software, or account question.",
      },
    ]);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
            <Bot className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white">AI Helpdesk Assistant</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/15 border border-blue-400/30 px-2 py-0.5 text-[10px] font-semibold text-blue-200">
                <Sparkles className="size-2.5 text-blue-300" /> Instant FAQ Resolution
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Interactive support agent powered by our verified knowledge base
            </p>
          </div>
        </div>

        <button
          onClick={resetChat}
          title="Restart Conversation"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1">
          <Lightbulb className="size-3.5 text-amber-500" /> Quick questions:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isThinking}
            className="shrink-0 text-xs bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full px-3 py-1 text-slate-600 transition-all cursor-pointer whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="p-4 space-y-3.5 max-h-[360px] min-h-[220px] overflow-y-auto bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Bot className="size-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200/90 shadow-xs rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Action Button if issue needs an actual ticket */}
              {msg.suggestedAction && onCreateTicketClick && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Still need hands-on assistance?</span>
                  <button
                    onClick={() =>
                      onCreateTicketClick(
                        msg.suggestedAction?.category,
                        msg.suggestedAction?.title
                      )
                    }
                    className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer"
                  >
                    <TicketPlus className="size-3.5 text-blue-600" />
                    <span>Create Ticket</span>
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="size-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="size-4" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="size-4" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <div className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                <span className="size-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="size-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span>Searching knowledge base and formulating answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question (e.g. How do I setup VPN, fix Wi-Fi, reset MFA?)..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl px-4 py-2.5 text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <span>Ask</span>
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
};
