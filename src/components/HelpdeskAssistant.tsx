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
} from 'lucide-react';
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const {
    isListening,
    isTranscribing,
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

  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      const isNumbered = /^\d+\.\s+/.test(line);
      const isBullet = /^[-*•]\s+/.test(line);

      let cleanLine = line;
      if (isNumbered) cleanLine = line.replace(/^\d+\.\s+/, '');
      if (isBullet) cleanLine = line.replace(/^[-*•]\s+/, '');

      const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);

      const content = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-[#262523]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={pIdx}
              className="px-1.5 py-0.5 mx-0.5 text-xs font-mono font-medium rounded bg-[#f5efe8] text-[#6e533c] border border-[#d6c2b0]"
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
            <span className="flex-shrink-0 size-5 rounded-full bg-[#f5efe8] text-[#6e533c] border border-[#d6c2b0] text-[11px] font-bold grid place-items-center mt-0.5 tabular-nums">
              {num}
            </span>
            <div className="flex-1 leading-relaxed text-[#262523] text-xs sm:text-sm">{content}</div>
          </div>
        );
      }

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
            <span className="flex-shrink-0 size-1.5 rounded-full bg-[#8c6d53] mt-2" />
            <div className="flex-1 leading-relaxed text-[#262523] text-xs sm:text-sm">{content}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed text-[#262523] text-xs sm:text-sm">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="bg-white border border-[#e2dfd9] rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#e2dfd9] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-9 rounded-xl bg-[#8c6d53] text-white grid place-items-center">
              <Bot className="size-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#2f6b45] ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-[#262523]">ResolveBot Assistant</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#f5efe8] text-[#6e533c] border border-[#d6c2b0] flex items-center gap-1">
                <Sparkles className="size-2.5 text-[#8c6d53]" /> AI Helpdesk
              </span>
            </div>
            <p className="text-[11px] text-[#5c5954]">Self-service troubleshooter & ticket dispatch</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleResetChat}
            title="Restart conversation"
            className="p-1.5 rounded-lg text-[#8c8881] hover:text-[#262523] hover:bg-[#f4f4f2] transition-colors cursor-pointer"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Queries */}
      <div className="px-4 py-2.5 bg-[#f4f4f2] border-b border-[#e2dfd9] overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[#5c5954] shrink-0 uppercase tracking-wider flex items-center gap-1">
          <HelpCircle className="size-3 text-[#8c6d53]" /> Suggestions:
        </span>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => handleSendMessage(p.query)}
            disabled={isLoading}
            className="shrink-0 text-xs font-medium px-3 py-1 rounded-lg bg-white hover:bg-[#f5efe8] hover:text-[#6e533c] hover:border-[#d6c2b0] border border-[#e2dfd9] text-[#5c5954] transition-all disabled:opacity-50 cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[440px] min-h-[300px] bg-[#f4f4f2]/50">
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              className={`flex gap-3 calm-fade-slide ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="size-7 rounded-lg bg-[#f5efe8] text-[#8c6d53] border border-[#d6c2b0] grid place-items-center shrink-0 mt-0.5">
                  <Bot className="size-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm space-y-2.5 ${
                  isUser
                    ? 'bg-[#8c6d53] text-white rounded-tr-xs'
                    : 'bg-white border border-[#e2dfd9] text-[#262523] rounded-tl-xs'
                }`}
              >
                <div className="leading-relaxed">
                  {isUser ? m.text : renderFormattedText(m.text)}
                </div>

                {/* Actions on Assistant Responses */}
                {!isUser && (
                  <div className="pt-2 mt-2 border-t border-[#ebe9e4] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(m.text, m.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-[#5c5954] hover:text-[#262523] px-2 py-1 rounded bg-[#f4f4f2] hover:bg-[#ebe9e4] transition-colors cursor-pointer"
                        title="Copy steps"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="size-3 text-[#2f6b45]" />
                            <span className="text-[#2f6b45] font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3 text-[#8c8881]" />
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#8c6d53] hover:bg-[#765a43] transition-all cursor-pointer calm-btn"
                      >
                        <TicketIcon className="size-3.5" />
                        <span>Create Support Ticket</span>
                      </button>
                    )}
                  </div>
                )}

                <div className={`text-[10px] tabular-nums ${isUser ? 'text-[#f5efe8]/80 text-right' : 'text-[#8c8881]'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {isUser && (
                <div className="size-7 rounded-lg bg-[#ebe9e4] text-[#5c5954] grid place-items-center shrink-0 mt-0.5">
                  <UserIcon className="size-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading / Thinking Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start calm-fade-slide">
            <div className="size-7 rounded-lg bg-[#f5efe8] text-[#8c6d53] border border-[#d6c2b0] grid place-items-center shrink-0">
              <Bot className="size-4" />
            </div>
            <div className="bg-white border border-[#e2dfd9] rounded-2xl rounded-tl-xs p-3.5 text-xs text-[#5c5954] flex items-center gap-2">
              <Loader2 className="size-3.5 text-[#8c6d53] animate-spin" />
              <span>ResolveBot is reviewing knowledge base & drafting guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Transcription Notice */}
      {speechError && (
        <div className="px-4 py-2 bg-[#f5efe8] border-t border-[#d6c2b0] text-xs text-[#6e533c] flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={clearSpeechError} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Voice Indicator */}
      {isListening && (
        <div className="px-4 py-2 bg-[#f5efe8] border-t border-[#d6c2b0] text-xs text-[#6e533c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="size-3.5 text-[#8c6d53]" />
            <span className="font-semibold tabular-nums">Listening... ({recordingSeconds}s) Speak clearly</span>
          </div>
          <button
            onClick={toggleVoiceInput}
            className="text-xs font-bold text-[#6e533c] hover:text-[#262523] cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      {/* Bottom Input Composer */}
      <div className="p-3 bg-white border-t border-[#e2dfd9] flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a technical question or describe your issue..."
            disabled={isLoading}
            className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] focus:bg-white text-xs sm:text-sm text-[#262523] placeholder:text-[#8c8881] outline-none focus:border-[#8c6d53] transition-all"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              title={isListening ? 'Stop recording' : 'Voice input'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isListening
                  ? 'bg-[#8c6d53] text-white'
                  : isTranscribing
                  ? 'bg-[#f5efe8] text-[#8c6d53]'
                  : 'text-[#8c8881] hover:text-[#262523] hover:bg-[#ebe9e4]'
              }`}
            >
              <Mic className="size-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 calm-btn"
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
