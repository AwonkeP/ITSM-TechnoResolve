import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/seedData';
import { TicketCategory } from '../types';
import {
  Sparkles,
  X,
  Loader2,
  CheckCircle,
  UploadCloud,
  Trash2,
  File as FileIcon,
  Mic,
  AlertCircle,
} from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

export const NewTicketModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: TicketCategory;
  initialTitle?: string;
  initialDescription?: string;
}> = ({ isOpen, onClose, initialCategory, initialTitle, initialDescription }) => {
  const { createTicket, currentUser, isAIClassifying } = useApp();

  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [company, setCompany] = useState(currentUser?.company || '');

  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | ''>(
    initialCategory || ''
  );
  const [attachments, setAttachments] = useState<{ id: string; file: File; previewUrl: string; size: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory !== undefined) setSelectedCategory(initialCategory);
      if (initialTitle !== undefined) setTitle(initialTitle);
      if (initialDescription !== undefined) setDescription(initialDescription);
    }
  }, [isOpen, initialCategory, initialTitle, initialDescription]);

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
    onTranscript: (incomingText) => {
      setDescription((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${incomingText}` : incomingText;
      });
    },
  });

  useEffect(() => {
    if (!isOpen && isListening) {
      stopVoiceInput();
    }
  }, [isOpen, isListening, stopVoiceInput]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (files: FileList | File[]) => {
    const newAttachments = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      size: file.size,
    }));
    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 5));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!description.trim() && attachments.length === 0)) return;
    setSubmitting(true);
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

      await createTicket({
        title: title.trim(),
        description: description.trim(),
        company: company.trim() || undefined,
        category: selectedCategory || undefined,
        attachments: processedAttachments,
      });
      onClose();
      setTitle('');
      setDescription('');
      setSelectedCategory('');
      setAttachments([]);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="new-ticket-modal-overlay"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        id="new-ticket-modal"
        className="calm-fade-slide max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white border border-[#e2dfd9] p-6 shadow-xl text-[#262523]"
      >
        <div className="flex items-start justify-between pb-3 border-b border-[#ebe9e4]">
          <div>
            <h2 className="text-lg font-bold text-[#262523]">Create New Ticket</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5c5954]">
              <Sparkles className="size-3.5 text-[#8c6d53]" />
              AI reads your description and routes it for you automatically.
            </p>
          </div>
          <button
            id="close-ticket-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8c8881] hover:bg-[#f4f4f2] hover:text-[#262523] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-[#262523] uppercase tracking-wider">
              Subject
            </span>
            <input
              id="ticket-subject-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VPN authentication error on corporate laptop"
              required
              minLength={4}
              maxLength={140}
              className="mt-1.5 w-full rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] focus:bg-white px-4 py-2.5 text-sm text-[#262523] outline-none focus:border-[#8c6d53] transition-all"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[#262523] uppercase tracking-wider flex items-center justify-between">
              <span>Category</span>
              <span className="text-[11px] font-normal text-[#8c8881]">
                Optional — AI will suggest one
              </span>
            </span>
            <select
              id="ticket-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TicketCategory | '')}
              className="mt-1.5 w-full rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] focus:bg-white px-4 py-2.5 text-sm text-[#262523] outline-none focus:border-[#8c6d53] transition-all cursor-pointer"
            >
              <option value="">Let AI decide automatically</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} — {cat.blurb}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[#262523] uppercase tracking-wider">
              Company / Department
            </span>
            <input
              id="ticket-company-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Operations Department"
              maxLength={120}
              className="mt-1.5 w-full rounded-xl border border-[#e2dfd9] bg-[#f4f4f2] focus:bg-white px-4 py-2.5 text-sm text-[#262523] outline-none focus:border-[#8c6d53] transition-all"
            />
          </label>

          <div className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#262523] uppercase tracking-wider">
                How can we help?
              </span>

              <button
                type="button"
                id="ticket-mic-btn"
                onClick={() => toggleVoiceInput()}
                disabled={isTranscribing}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isListening
                    ? 'bg-[#8c6d53] text-white border-[#765a43]'
                    : isTranscribing
                    ? 'bg-[#f5efe8] text-[#6e533c] border-[#d6c2b0]'
                    : 'bg-[#f4f4f2] text-[#5c5954] hover:bg-[#f5efe8] hover:text-[#6e533c] border-[#e2dfd9]'
                }`}
                title={isListening ? 'Stop voice recording' : 'Dictate issue using your microphone'}
              >
                {isListening ? (
                  <>
                    <Mic className="size-3.5" />
                    <span className="tabular-nums">Recording ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})</span>
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Transcribing...</span>
                  </>
                ) : (
                  <>
                    <Mic className="size-3.5 text-[#8c6d53]" />
                    <span>Voice Input</span>
                  </>
                )}
              </button>
            </div>

            {isListening && (
              <div className="mb-2 p-3 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#6e533c] text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <div className="flex items-center gap-1 shrink-0 h-4">
                    <span
                      className="w-1 bg-[#8c6d53] rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(4, Math.min(16, (audioLevel / 100) * 16 + 4))}px` }}
                    />
                    <span
                      className="w-1 bg-[#8c6d53] rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(4, Math.min(16, (audioLevel / 100) * 20 + 6))}px` }}
                    />
                    <span
                      className="w-1 bg-[#8c6d53] rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(4, Math.min(16, (audioLevel / 100) * 14 + 4))}px` }}
                    />
                  </div>
                  <div className="truncate flex-1">
                    <span className="font-bold">Listening... </span>
                    <span className="italic opacity-90">
                      {interimText ? `"${interimText}"` : 'Speak into your microphone. Tap Done when finished.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopVoiceInput}
                  className="shrink-0 px-3 py-1 bg-[#8c6d53] hover:bg-[#765a43] text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {isTranscribing && (
              <div className="mb-2 p-2.5 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#6e533c] text-xs flex items-center gap-2">
                <Loader2 className="size-4 shrink-0 animate-spin text-[#8c6d53]" />
                <span className="font-medium">Transcribing and refining your speech...</span>
              </div>
            )}

            {speechError && (
              <div className="mb-2 p-2.5 rounded-xl bg-[#f5efe8] border border-[#d6c2b0] text-[#6e533c] text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{speechError}</span>
                </div>
                <button
                  type="button"
                  onClick={clearSpeechError}
                  className="text-[#6e533c] hover:text-[#262523] text-[11px] underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            <textarea
              id="ticket-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail, error codes, affected devices or business impact..."
              required={attachments.length === 0}
              minLength={attachments.length === 0 ? 10 : undefined}
              maxLength={4000}
              rows={5}
              className={`mt-1 w-full resize-none rounded-xl border bg-[#f4f4f2] focus:bg-white px-4 py-2.5 text-sm text-[#262523] outline-none focus:border-[#8c6d53] transition-all ${
                isListening ? 'border-[#8c6d53]' : 'border-[#e2dfd9]'
              }`}
            />
          </div>

          {/* Attachments UI */}
          <div className="block">
            <span className="text-xs font-semibold text-[#262523] uppercase tracking-wider mb-1.5 block">
              Attachments
            </span>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full rounded-xl border-2 border-dashed p-5 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                isDragging ? 'border-[#8c6d53] bg-[#f5efe8]' : 'border-[#e2dfd9] bg-[#f4f4f2]/60 hover:bg-[#f4f4f2]'
              }`}
              onClick={() => document.getElementById('ticket-file-upload')?.click()}
            >
              <input
                id="ticket-file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="size-10 rounded-full bg-white border border-[#e2dfd9] flex items-center justify-center">
                <UploadCloud className="size-5 text-[#8c6d53]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#262523]">Click to upload or drag & drop</p>
                <p className="text-xs text-[#8c8881] mt-0.5">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#e2dfd9] bg-[#f4f4f2]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="size-8 rounded bg-white flex items-center justify-center shrink-0 border border-[#e2dfd9]">
                        {att.file.type.startsWith('image/') ? (
                          <img src={att.previewUrl} alt="preview" className="size-full object-cover rounded" />
                        ) : (
                          <FileIcon className="size-4 text-[#8c8881]" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium text-[#262523] truncate">{att.file.name}</p>
                        <p className="text-[10px] text-[#8c8881]">{formatBytes(att.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAttachment(att.id);
                      }}
                      className="p-1.5 text-[#8c8881] hover:text-[#262523] transition-colors rounded-md hover:bg-[#ebe9e4]"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#5c5954] hover:bg-[#f4f4f2] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-ticket-btn"
              type="submit"
              disabled={submitting || isAIClassifying}
              className="flex items-center gap-2 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] px-6 py-2.5 text-xs font-semibold text-white transition disabled:opacity-60 cursor-pointer calm-btn"
            >
              {submitting || isAIClassifying ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Classifying & Submitting…</span>
                </>
              ) : (
                <>
                  <CheckCircle className="size-3.5" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
