import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Ticket, TicketStatus } from '../types';
import { getCategoryLabel, formatStatus, MACROS } from '../data/seedData';
import {
  X,
  Send,
  Sparkles,
  Lock,
  User,
  Wrench,
  AlertCircle,
  Loader2,
  Paperclip,
  Trash2,
  Download,
  FileText as FileIcon,
  Mic,
} from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

export const TicketChatModal: React.FC<{
  ticket: Ticket | null;
  onClose: () => void;
}> = ({ ticket, onClose }) => {
  const {
    messages,
    sendMessage,
    updateTicket,
    draftAIReply,
    markTicketRead,
    viewRole,
  } = useApp();

  const [inputBody, setInputBody] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; file: File; previewUrl: string; size: number }[]>([]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray: File[] = Array.from(e.target.files);
      const newAttachments = filesArray.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
        size: file.size,
      }));
      setAttachments((prev) => [...prev, ...newAttachments].slice(0, 5));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const [isInternal, setIsInternal] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    isTranscribing,
    interimText,
    audioLevel,
    recordingSeconds,
    error: speechError,
    clearError: clearSpeechError,
    toggleVoiceInput,
    stopVoiceInput,
  } = useVoiceInput({
    onTranscript: (spokenText) => {
      setInputBody((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${spokenText}` : spokenText;
      });
    },
  });

  const ticketId = ticket?.id;

  useEffect(() => {
    if (ticketId) {
      markTicketRead(ticketId);
    }
  }, [ticketId, markTicketRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, ticketId]);

  if (!ticket) return null;

  const ticketMessages = messages.filter((m) => {
    if (m.ticket_id !== ticket.id) return false;
    if (viewRole === 'user' && m.internal) return false;
    return true;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim() && attachments.length === 0) return;

    try {
      const processedAttachments = await Promise.all(
        attachments.map(async (att) => {
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

      await sendMessage(ticket.id, inputBody.trim(), isInternal, processedAttachments);
      setInputBody('');
      setAttachments([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIDraft = async () => {
    setIsDrafting(true);
    try {
      const suggestion = await draftAIReply(ticket.id);
      if (suggestion) {
        setInputBody(suggestion);
        setIsInternal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const isOperator = viewRole === 'admin' || viewRole === 'technician';

  const getPriorityBadge = (p: string) => {
    if (p === 'urgent' || p === 'high') {
      return 'bg-[#f5efe8] text-[#6e533c] border-[#d6c2b0]';
    }
    return 'bg-[#f4f4f2] text-[#5c5954] border-[#e2dfd9]';
  };

  const getStatusBadge = (s: string) => {
    if (s === 'resolved' || s === 'closed') {
      return 'bg-[#e6f4ea] text-[#2f6b45] border-[#c6e6d0]';
    }
    return 'bg-[#f5efe8] text-[#6e533c] border-[#d6c2b0]';
  };

  return (
    <div
      id="ticket-chat-modal-overlay"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        id="ticket-chat-modal"
        className="calm-fade-slide flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white border border-[#e2dfd9] shadow-xl text-[#262523]"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e2dfd9] p-5 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-[#8c6d53]">
                {ticket.id}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${getStatusBadge(
                  ticket.status
                )}`}
              >
                {formatStatus(ticket.status)}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${getPriorityBadge(
                  ticket.priority
                )}`}
              >
                {ticket.priority} Priority
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#262523] line-clamp-1">
              {ticket.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#5c5954]">
              <span>{getCategoryLabel(ticket.category)}</span>
              <span>·</span>
              <span>
                Requester: <strong className="text-[#262523]">{ticket.requester_name}</strong>{' '}
                {ticket.company ? `(${ticket.company})` : ''}
              </span>
              {ticket.assigned_name && (
                <>
                  <span>·</span>
                  <span>
                    Assigned: <strong className="text-[#262523]">{ticket.assigned_name}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOperator && (
              <select
                value={ticket.status}
                onChange={(e) =>
                  updateTicket(ticket.id, { status: e.target.value as TicketStatus })
                }
                className="rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] px-3 py-1.5 text-xs font-semibold text-[#262523] outline-none focus:border-[#8c6d53] cursor-pointer"
              >
                <option value="new">Status: New</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_user">Pending User</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#8c8881] hover:bg-[#f4f4f2] hover:text-[#262523] transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* AI Triage Banner */}
        {ticket.ai_reasoning && (
          <div className="flex items-center justify-between border-b border-[#d6c2b0] bg-[#f5efe8] px-5 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-[#262523]">
              <Sparkles className="size-3.5 text-[#8c6d53] shrink-0" />
              <span>
                <strong className="text-[#6e533c]">AI Triage:</strong> {ticket.ai_reasoning}
              </span>
            </div>
            {ticket.ai_confidence && (
              <span className="shrink-0 text-[11px] font-semibold text-[#2f6b45] bg-[#e6f4ea] px-2 py-0.5 rounded border border-[#c6e6d0] tabular-nums">
                {Math.round(ticket.ai_confidence * 100)}% Confidence
              </span>
            )}
          </div>
        )}

        {/* Conversation Stream */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 bg-[#f4f4f2]">
          {/* Initial Ticket Description Card */}
          <div className="rounded-2xl rounded-tl-xs border border-[#e2dfd9] bg-white p-4 text-[#262523] w-full">
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe9e4] text-xs text-[#5c5954]">
              <span className="font-semibold text-[#262523] flex items-center gap-1.5">
                <User className="size-3.5 text-[#8c8881]" />
                <span>{ticket.requester_name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f4f4f2] text-[#5c5954] border border-[#e2dfd9]">
                  Customer
                </span>
                <span className="text-[10px] font-medium text-[#8c8881]">· Initial Request</span>
              </span>
              <span className="tabular-nums">{new Date(ticket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <p className="mt-2.5 text-sm text-[#262523] whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>

            {/* Initial Ticket Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-3.5 space-y-2 border-t border-[#ebe9e4] pt-3">
                <span className="text-[11px] font-bold text-[#5c5954] uppercase tracking-wider block">
                  Original Attachments ({ticket.attachments.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ticket.attachments.map((att) => (
                    <a
                      key={att.id || att.name}
                      href={att.url}
                      download={att.name}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] hover:bg-[#ebe9e4] transition-colors group"
                    >
                      <div className="size-9 rounded-lg bg-white flex items-center justify-center shrink-0 border border-[#e2dfd9] overflow-hidden">
                        {att.type?.startsWith('image/') ? (
                          <img src={att.url} alt={att.name} className="size-full object-cover" />
                        ) : (
                          <FileIcon className="size-4 text-[#8c6d53]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#262523] truncate group-hover:text-[#8c6d53] transition-colors">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-[#8c8881]">{formatBytes(att.size)}</p>
                      </div>
                      <Download className="size-3.5 text-[#8c8881] group-hover:text-[#8c6d53] transition-colors shrink-0 mr-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          {ticketMessages.map((msg) => {
            const isNote = msg.internal;
            const isTechnician =
              msg.author_role === 'technician' ||
              msg.author_role === 'admin' ||
              (msg.author_id !== ticket.requester_id && msg.author_role !== 'user');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isNote
                    ? 'items-center my-3'
                    : isTechnician
                    ? 'items-end'
                    : 'items-start'
                }`}
              >
                {isNote ? (
                  <div className="w-full rounded-xl border border-[#d6c2b0] bg-[#f5efe8] p-3.5 text-xs text-[#262523]">
                    <div className="flex items-center justify-between font-semibold text-[#6e533c]">
                      <span className="flex items-center gap-1.5">
                        <Lock className="size-3.5" />
                        Internal Technician Note · {msg.author_name}
                      </span>
                      <span className="text-[11px] font-normal text-[#8c8881] tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {msg.body && (
                      <p className="mt-1.5 text-sm whitespace-pre-wrap text-[#262523]">
                        {msg.body}
                      </p>
                    )}

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t pt-2.5 border-[#d6c2b0]">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id || att.name}
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2.5 p-2 rounded-lg border border-[#d6c2b0] bg-white hover:bg-[#f4f4f2] transition-colors group"
                          >
                            <div className="size-8 rounded bg-[#f5efe8] flex items-center justify-center shrink-0 border border-[#d6c2b0] overflow-hidden">
                              {att.type?.startsWith('image/') ? (
                                <img src={att.url} alt={att.name} className="size-full object-cover" />
                              ) : (
                                <FileIcon className="size-3.5 text-[#8c6d53]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#262523] truncate">{att.name}</p>
                              <p className="text-[10px] text-[#8c8881]">{formatBytes(att.size)}</p>
                            </div>
                            <Download className="size-3.5 text-[#8c8881] group-hover:text-[#6e533c] transition-opacity shrink-0 mr-1" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                      isTechnician
                        ? 'bg-[#8c6d53] text-white border-[#765a43] rounded-tr-xs'
                        : 'bg-white text-[#262523] border-[#e2dfd9] rounded-tl-xs'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between gap-3 text-[11px] pb-1 ${
                        isTechnician ? 'text-[#f5efe8]' : 'text-[#5c5954]'
                      }`}
                    >
                      <span className="font-semibold flex items-center gap-1.5">
                        {isTechnician ? (
                          <>
                            <Wrench className="size-3 text-[#f5efe8]" />
                            <span>{msg.author_name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/15 text-white border border-white/25">
                              Technician
                            </span>
                          </>
                        ) : (
                          <>
                            <User className="size-3 text-[#8c8881]" />
                            <span>{msg.author_name}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[#f4f4f2] text-[#5c5954] border border-[#e2dfd9]">
                              Customer
                            </span>
                          </>
                        )}
                      </span>
                      <span className="tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {msg.body && (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1">
                        {msg.body}
                      </p>
                    )}

                    {/* Render message attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`mt-3 space-y-1.5 ${msg.body ? 'border-t pt-2.5' : ''} ${isTechnician ? 'border-white/20' : 'border-[#ebe9e4]'}`}>
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id || att.name}
                            href={att.url}
                            download={att.name}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-colors group ${
                              isTechnician
                                ? 'bg-[#765a43] border-white/20 hover:bg-[#6e533c] text-white'
                                : 'bg-[#f4f4f2] border-[#e2dfd9] hover:border-[#8c6d53] text-[#262523]'
                            }`}
                          >
                            <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 border overflow-hidden ${
                              isTechnician ? 'bg-[#6e533c] border-white/20' : 'bg-white border-[#e2dfd9]'
                            }`}>
                              {att.type?.startsWith('image/') ? (
                                <img src={att.url} alt={att.name} className="size-full object-cover" />
                              ) : (
                                <FileIcon className={`size-3.5 ${isTechnician ? 'text-[#f5efe8]' : 'text-[#8c8881]'}`} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate leading-tight">{att.name}</p>
                              <p className={`text-[10px] leading-tight mt-0.5 ${isTechnician ? 'text-[#f5efe8]/80' : 'text-[#8c8881]'}`}>{formatBytes(att.size)}</p>
                            </div>
                            <Download className={`size-3.5 shrink-0 mr-1 transition-opacity ${isTechnician ? 'text-[#f5efe8] group-hover:text-white' : 'text-[#8c8881] group-hover:text-[#8c6d53]'}`} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Canned Macros for Operators */}
        {isOperator && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-t border-[#e2dfd9] bg-white px-5 py-2 text-xs">
            <span className="text-[11px] font-semibold text-[#8c8881] uppercase tracking-wider shrink-0 mr-1">
              Macros:
            </span>
            {MACROS.map((macro) => (
              <button
                key={macro.label}
                onClick={() => setInputBody(macro.body)}
                className="shrink-0 rounded-lg border border-[#e2dfd9] bg-[#f4f4f2] px-3 py-1 text-[11px] font-medium text-[#5c5954] hover:border-[#d6c2b0] hover:bg-[#f5efe8] hover:text-[#6e533c] transition-colors cursor-pointer"
              >
                {macro.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        {ticket.status === 'resolved' || ticket.status === 'closed' ? (
          <div className="border-t border-[#c6e6d0] bg-[#e6f4ea] p-5 flex flex-col items-center justify-center text-center space-y-1.5">
            <Lock className="size-4 text-[#2f6b45]" />
            <p className="text-sm font-semibold text-[#2f6b45]">
              This ticket has been marked as resolved.
            </p>
            <p className="text-xs text-[#2f6b45]/80">
              Further communication is closed. If you need additional help, please open a new ticket.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            className="border-t border-[#e2dfd9] bg-white p-4 space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              {isOperator ? (
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="size-3.5 rounded accent-[#8c6d53]"
                    />
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isInternal ? 'text-[#6e533c]' : 'text-[#5c5954]'
                      }`}
                    >
                      <Lock className="size-3" />
                      Internal Technician Note
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAIDraft}
                    disabled={isDrafting}
                    className="flex items-center gap-1.5 rounded-lg border border-[#d6c2b0] bg-[#f5efe8] px-3 py-1 font-semibold text-[#6e533c] hover:bg-[#ebe0d4] transition-all text-xs cursor-pointer"
                  >
                    {isDrafting ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        <span>Drafting reply…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3 text-[#8c6d53]" />
                        <span>AI Draft Reply</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-[#5c5954]">
                  Reply to the support technician directly:
                </span>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 bg-[#f4f4f2] rounded-lg p-1.5 pr-2 border border-[#e2dfd9]">
                    <div className="size-8 shrink-0 rounded bg-white flex items-center justify-center overflow-hidden">
                      {att.file.type.startsWith('image/') ? (
                        <img src={att.previewUrl} alt="preview" className="size-full object-cover" />
                      ) : (
                        <FileIcon className="size-4 text-[#8c8881]" />
                      )}
                    </div>
                    <div className="text-xs overflow-hidden max-w-[100px]">
                      <p className="truncate font-medium text-[#262523]">{att.file.name}</p>
                      <p className="text-[9px] text-[#8c8881]">{formatBytes(att.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 hover:bg-[#ebe9e4] text-[#8c8881] hover:text-[#262523] rounded-md ml-1 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Voice Input Feedback */}
            {isListening && (
              <div className="mb-2 p-2.5 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#6e533c] text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <div className="flex items-center gap-1 shrink-0 h-3.5">
                    <span
                      className="w-1 bg-[#8c6d53] rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(3, Math.min(14, (audioLevel / 100) * 14 + 3))}px` }}
                    />
                    <span
                      className="w-1 bg-[#8c6d53] rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(3, Math.min(16, (audioLevel / 100) * 16 + 4))}px` }}
                    />
                    <span
                      className="w-1 bg-[#8c6d53] rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(3, Math.min(12, (audioLevel / 100) * 12 + 3))}px` }}
                    />
                  </div>
                  <div className="truncate flex-1">
                    <span className="font-bold tabular-nums">Recording ({recordingSeconds}s): </span>
                    <span className="italic opacity-90">{interimText || 'Speak into your microphone...'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopVoiceInput}
                  className="shrink-0 px-2.5 py-0.5 bg-[#8c6d53] hover:bg-[#765a43] text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {isTranscribing && (
              <div className="mb-2 p-2 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#6e533c] text-xs flex items-center gap-2">
                <Loader2 className="size-3.5 shrink-0 animate-spin text-[#8c6d53]" />
                <span>Transcribing your voice message...</span>
              </div>
            )}

            {speechError && (
              <div className="mb-2 p-2 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#6e533c] text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span className="truncate">{speechError}</span>
                </div>
                <button
                  type="button"
                  onClick={clearSpeechError}
                  className="text-[#6e533c] hover:text-[#262523] text-[11px] underline cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('chat-file-upload')?.click()}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f2] text-[#5c5954] transition hover:bg-[#ebe9e4] hover:text-[#262523] border border-[#e2dfd9] cursor-pointer"
                title="Attach files"
              >
                <Paperclip className="size-4" />
              </button>
              <input
                id="chat-file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Microphone Button */}
              <button
                type="button"
                id="chat-mic-btn"
                onClick={() => toggleVoiceInput()}
                disabled={isTranscribing}
                title={isListening ? 'Stop voice recording' : 'Dictate message with voice'}
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition border cursor-pointer ${
                  isListening
                    ? 'bg-[#8c6d53] text-white border-[#765a43]'
                    : isTranscribing
                    ? 'bg-[#f5efe8] text-[#8c6d53] border-[#d6c2b0]'
                    : 'bg-[#f4f4f2] text-[#5c5954] border-[#e2dfd9] hover:bg-[#ebe9e4] hover:text-[#262523]'
                }`}
              >
                {isTranscribing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mic className="size-4" />
                )}
              </button>
              <textarea
                value={inputBody}
                onChange={(e) => setInputBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSend(e);
                  }
                }}
                placeholder={
                  isInternal
                    ? 'Write an internal note (visible to admins and technicians only)...'
                    : 'Type your message (Ctrl+Enter to send)...'
                }
                rows={2}
                className={`w-full resize-none rounded-xl border px-3.5 py-2 text-sm text-[#262523] outline-none transition-all ${
                  isInternal
                    ? 'border-[#d6c2b0] bg-[#f5efe8] focus:border-[#8c6d53]'
                    : 'border-[#e2dfd9] bg-[#f4f4f2] focus:bg-white focus:border-[#8c6d53]'
                }`}
              />
              <button
                type="submit"
                disabled={!inputBody.trim() && attachments.length === 0}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white transition disabled:opacity-50 cursor-pointer calm-btn"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
