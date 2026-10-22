import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmailOutboxItem } from '../types';
import {
  Mail,
  X,
  Send,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Search,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({ isOpen, onClose }) => {
  const { outbox, showToast, verifyEmail } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailOutboxItem | null>(null);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-700/80 bg-[#09172e] shadow-2xl overflow-hidden text-slate-100 font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#060f1e]">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 grid place-items-center">
              <Mail className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">System Email Outbox</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {outbox.length} Dispatched
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live delivery logs for email confirmations, ticket updates & approvals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-2.5 bg-[#071326] border-b border-slate-800/80">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by recipient or subject..."
              className="w-full rounded-xl border border-slate-800 bg-[#060f1e] pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition-all"
            />
          </div>
        </div>

        {/* Content Body: Two columns if selected, or single list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No email records found matching your filter.
            </div>
          ) : (
            filtered.map((item) => {
              const code = extractCode(item.payload);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800/80 bg-[#071428] p-4 space-y-2.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30 uppercase">
                        {item.status}
                      </span>
                      <span className="font-mono text-xs font-semibold text-cyan-300">
                        To: {item.to}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{item.subject}</h4>

                  {item.payload && (
                    <div className="rounded-lg bg-[#050c18] p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                      {item.payload}
                    </div>
                  )}

                  {code && (
                    <div className="flex items-center justify-between bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <KeyRound className="size-3.5 text-cyan-400" />
                        <span className="text-slate-300">Verification Code:</span>
                        <span className="font-mono font-extrabold text-white text-sm tracking-wider">
                          {code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="px-2 py-1 rounded bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="size-3" /> Copy
                        </button>
                        <button
                          onClick={async () => {
                            await verifyEmail(code);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-400 text-xs font-bold text-slate-950 hover:bg-cyan-300 flex items-center gap-1 cursor-pointer"
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
        <div className="px-5 py-3 border-t border-slate-800 bg-[#060f1e] flex items-center justify-between text-xs text-slate-400">
          <span>Transactional delivery simulator active</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
