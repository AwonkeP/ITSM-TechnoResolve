import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TicketCategory } from '../types';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  User as UserIcon,
  Mic,
  Loader2,
  Ticket as TicketIcon,
  Copy,
  Check,
  HelpCircle,
  Radio,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVoiceInput } from '../hooks/useVoiceInput';

export interface HelpdeskMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  suggestedCategory?: TicketCategory;
  canCreateTicket?: boolean;
}

interface HelpdeskAssistantProps {
  onOpenNewTicket: (prefill?: { category?: TicketCategory; title?: string; description?: string }) => void;
  onSelectFaqQuery?: (query: string) => void;
}

const QUICK_PROMPTS = [
  { label: 'Reset password or MFA', query: 'How do I reset my password and re-enroll MFA?' },
  { label: 'Wi-Fi drops & latency', query: 'My Wi-Fi keeps dropping or running slow. What should I do?' },
  { label: 'Connect to corporate VPN', query: 'How do I configure and connect to the corporate VPN?' },
  { label: 'Request software licence', query: 'How do I request a new software licence or SaaS seat?' },
  { label: 'Check SLA response times', query: 'What are the response time SLAs for support tickets?' },
  { label: 'Submit support ticket', query: 'I need to report an IT issue and open a support ticket.' },
];

export const HelpdeskAssistant: React.FC<HelpdeskAssistantProps> = ({
  onOpenNewTicket,
}) => {
  const { currentUser, showToast } = useApp();
  const userName = currentUser?.full_name?.split(' ')[0] || 'there';

  const [messages, setMessages] = useState<HelpdeskMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello ${userName}! I'm your **TechnoResolve Helpdesk Assistant**.\n\nI can help you troubleshoot common IT problems (passwords, Wi-Fi, VPN, software), provide verified policy steps, or prepare a support ticket for our technician team.\n\nWhat can I help you with today?`,
      timestamp: new Date(),
      canCreateTicket: false,
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Hook-based Voice input
  const {
    isListening,
    isTranscribing,
    audioLevel,
    recordingSeconds,
    error: speechError,
    clearError: clearSpeechError,
    toggleVoiceInput,
  } = useVoiceInput({
    onTranscript: (incomingText) => {
      setInputQuery((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${incomingText}` : incomingText;
      });
    },
  });

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMessage: HelpdeskMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build history payload
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/helpdesk-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          userName: currentUser?.full_name || 'Customer',
          userEmail: currentUser?.email,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || "I've received your query. If this requires further attention, please feel free to submit a support ticket!";
      
      const assistantMessage: HelpdeskMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: replyText,
        timestamp: new Date(),
        suggestedCategory: data.suggestedCategory as TicketCategory | undefined,
        canCreateTicket: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.warn('Helpdesk chat endpoint notice:', err);
      // Friendly fallback
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          text: `I'm having trouble connecting to the knowledge service at this instant. You can try asking again, or click **"Create Support Ticket"** below so our technician team can assist you directly!`,
          timestamp: new Date(),
          canCreateTicket: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Chat restarted. Hello ${userName}! How can I help you resolve your technical issue or answer questions today?`,
        timestamp: new Date(),
        canCreateTicket: false,
      },
    ]);
    setInputQuery('');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Solution copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format text with simple markdown bold, list items, and code highlights
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      // Empty line spacing
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Check if numbered list item (e.g. "1. " or "2. ")
      const isNumbered = /^\d+\.\s+/.test(line);
      // Check if bullet point
      const isBullet = /^[-*•]\s+/.test(line);

      let cleanLine = line;
      if (isNumbered) cleanLine = line.replace(/^\d+\.\s+/, '');
      if (isBullet) cleanLine = line.replace(/^[-*•]\s+/, '');

      // Parse bold parts: **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);

      const content = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={pIdx}
              className="px-1.5 py-0.5 mx-0.5 text-xs font-mono font-medium rounded bg-blue-50 text-blue-800 border border-blue-200/80"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (isNumbered) {
        const match = line.match(/^(\d+)\.\s+/);
        const num = match ? match[1] : '';
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1">
            <span className="flex-shrink-0 size-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold grid place-items-center mt-0.5">
              {num}
            </span>
            <div className="flex-1 leading-relaxed text-slate-700 text-xs sm:text-sm">{content}</div>
          </div>
        );
      }

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
            <span className="flex-shrink-0 size-1.5 rounded-full bg-blue-500 mt-2" />
            <div className="flex-1 leading-relaxed text-slate-700 text-xs sm:text-sm">{content}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed text-slate-700 text-xs sm:text-sm">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200/80 bg-gradient-to-r from-[#1a4043]/5 via-white to-blue-50/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center shadow-xs">
              <Bot className="size-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900">ResolveBot Assistant</h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Sparkles className="size-2.5" /> AI Helpdesk
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Self-service troubleshooter & ticket dispatch</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleResetChat}
            title="Restart conversation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Queries */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/70 overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <HelpCircle className="size-3" /> Quick suggestions:
        </span>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => handleSendMessage(p.query)}
            disabled={isLoading}
            className="shrink-0 text-xs font-medium px-3 py-1 rounded-full bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-700 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[440px] min-h-[300px] bg-slate-50/30">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isUser = m.role === 'user';

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="size-7 rounded-lg bg-blue-600 text-white grid place-items-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="size-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm shadow-2xs space-y-2.5 ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="leading-relaxed">
                    {isUser ? m.text : renderFormattedText(m.text)}
                  </div>

                  {/* Actions on Assistant Responses */}
                  {!isUser && (
                    <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyText(m.text, m.id)}
                          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Copy steps"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="size-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3 text-slate-400" />
                              <span>Copy solution</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Escalate / Create ticket button */}
                      {m.canCreateTicket && (
                        <button
                          onClick={() =>
                            onOpenNewTicket({
                              category: m.suggestedCategory,
                              title: messages.find((prev) => prev.role === 'user')?.text.slice(0, 60),
                              description: `Assistance requested for:\n${m.text.slice(0, 300)}...`,
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xs cursor-pointer"
                        >
                          <TicketIcon className="size-3.5" />
                          <span>Create Support Ticket</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className={`text-[10px] ${isUser ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="size-7 rounded-lg bg-slate-200 text-slate-700 grid place-items-center shrink-0 mt-0.5">
                    <UserIcon className="size-4" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading / Thinking Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="size-7 rounded-lg bg-blue-600 text-white grid place-items-center shrink-0 shadow-2xs">
              <Bot className="size-4" />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-500 shadow-2xs flex items-center gap-2">
              <Loader2 className="size-3.5 text-blue-600 animate-spin" />
              <span>ResolveBot is reviewing knowledge base & drafting guidance...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Transcription Notice */}
      {speechError && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={clearSpeechError} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Voice Indicator */}
      {isListening && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-700 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="size-3.5 text-red-500 animate-ping" />
            <span className="font-semibold">Listening... ({recordingSeconds}s) Speak clearly</span>
          </div>
          <button
            onClick={toggleVoiceInput}
            className="text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      {/* Bottom Input Composer */}
      <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a technical question or describe your issue..."
            disabled={isLoading}
            className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              title={isListening ? 'Stop recording' : 'Voice input'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white'
                  : isTranscribing
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <Mic className="size-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <Send className="size-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
