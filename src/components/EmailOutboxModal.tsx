import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mail,
  X,
  CheckCircle2,
  Copy,
  Search,
  KeyRound,
} from 'lucide-react';

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({ isOpen, onClose }) => {
  const { outbox, showToast, verifyEmail } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = outbox.filter(
    (item) =>
      item.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.payload && item.payload.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    showToast('Copied to clipboard!', 'info');
  };

  const extractCode = (payload?: string) => {
    if (!payload) return null;
    const match = payload.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  };

  return (
    <div
      id="email-outbox-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="calm-fade-slide w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-[#e2dfd9] bg-white shadow-xl overflow-hidden text-[#262523] font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2dfd9] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-[#f5efe8] text-[#8c6d53] border border-[#d6c2b0] grid place-items-center">
              <Mail className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#262523]">System Email Outbox</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#f5efe8] text-[#6e533c] border border-[#d6c2b0] tabular-nums">
                  {outbox.length} Dispatched
                </span>
              </div>
              <p className="text-[11px] text-[#5c5954]">
                Live delivery logs for email confirmations, ticket updates & approvals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8c8881] hover:text-[#262523] hover:bg-[#f4f4f2] transition-all cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-2.5 bg-[#f4f4f2] border-b border-[#e2dfd9]">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8881]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by recipient or subject..."
              className="w-full rounded-xl border border-[#e2dfd9] bg-white pl-9 pr-3 py-2 text-xs text-[#262523] placeholder:text-[#8c8881] outline-none focus:border-[#8c6d53] transition-all"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#f4f4f2]/50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#8c8881] text-xs">
              No email records found matching your filter.
            </div>
          ) : (
            filtered.map((item) => {
              const code = extractCode(item.payload);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#e2dfd9] bg-white p-4 space-y-2.5 transition-all calm-card-hover"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#e6f4ea] text-[#2f6b45] border border-[#c6e6d0] uppercase">
                        {item.status}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#6e533c]">
                        To: {item.to}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8c8881] tabular-nums">
                      {new Date(item.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#262523]">{item.subject}</h4>

                  {item.payload && (
                    <div className="rounded-lg bg-[#f4f4f2] p-3 text-xs text-[#262523] font-mono whitespace-pre-wrap leading-relaxed border border-[#e2dfd9]">
                      {item.payload}
                    </div>
                  )}

                  {code && (
                    <div className="flex items-center justify-between bg-[#f5efe8] border border-[#d6c2b0] rounded-lg p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <KeyRound className="size-3.5 text-[#8c6d53]" />
                        <span className="text-[#5c5954]">Verification Code:</span>
                        <span className="font-mono font-extrabold text-[#262523] text-sm tracking-wider tabular-nums">
                          {code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#e2dfd9] text-xs font-semibold text-[#262523] hover:bg-[#f4f4f2] flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="size-3" /> Copy
                        </button>
                        <button
                          onClick={async () => {
                            await verifyEmail(code);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#8c6d53] hover:bg-[#765a43] text-xs font-bold text-white flex items-center gap-1 cursor-pointer calm-btn"
                        >
                          <CheckCircle2 className="size-3" /> Apply Code
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e2dfd9] bg-white flex items-center justify-between text-xs text-[#5c5954]">
          <span>Transactional delivery simulator active</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#f4f4f2] hover:bg-[#ebe9e4] border border-[#e2dfd9] text-[#262523] font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
