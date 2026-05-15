import { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { Send, Plus, Mic, MicOff, Paperclip, X } from 'lucide-react';
import { AttachmentMenu } from '@/components/ui/AttachmentMenu';
import { cn } from '@/lib/utils';

interface AttachedFile {
  name: string;
  content: string;
  type: string;
}

interface ChatInputProps {
  onSend: (message: string, attachments?: AttachedFile[]) => void;
  onNewChat: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onNewChat, disabled, placeholder = 'Message...' }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;

    let messageText = trimmed;
    if (attachments.length > 0) {
      const fileSection = attachments.map(f =>
        f.type.startsWith('image/')
          ? `[Image: ${f.name}]\n<img src="${f.content}" alt="${f.name}" />`
          : `[Attached file: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``
      ).join('\n\n');
      messageText = trimmed ? `${trimmed}\n\n${fileSection}` : fileSection;
    }

    onSend(messageText, attachments);
    setValue('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  /* ── Voice input ── */
  const startVoiceInput = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) { alert('Voice input not supported in this browser.'); return; }

    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setValue(prev => prev ? prev + ' ' + t : t);
      setTimeout(autoResize, 50);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend   = () => setIsRecording(false);
    rec.start();
    setIsRecording(true);
    recognitionRef.current = rec;
  }, [isRecording]);

  /* ── File handling (from AttachmentMenu or direct) ── */
  const processFile = useCallback(async (file: File) => {
    try {
      let content: string;
      if (file.type.startsWith('image/')) {
        content = await readFileAsDataURL(file);
      } else {
        content = await readFileAsText(file);
      }
      setAttachments(prev => [...prev, { name: file.name, content, type: file.type }].slice(0, 5));
    } catch {
      setAttachments(prev => [
        ...prev,
        { name: file.name, content: `[Binary file — ${formatBytes(file.size)}]`, type: file.type },
      ].slice(0, 5));
    }
  }, []);

  const removeAttachment = (i: number) => setAttachments(prev => prev.filter((_, idx) => idx !== i));

  const canSend = (value.trim() || attachments.length > 0) && !disabled;

  return (
    <div
      className="glass-bar px-3 pt-2 pb-3 relative"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="max-w-3xl mx-auto flex flex-wrap gap-1.5 mb-2">
          {attachments.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1 text-xs font-medium text-primary"
            >
              {file.type.startsWith('image/') ? (
                <img src={file.content} alt={file.name} className="w-5 h-5 rounded object-cover" />
              ) : (
                <Paperclip className="w-3 h-3 shrink-0" />
              )}
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-primary/60 hover:text-primary ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto flex items-end gap-2">
        {/* + button → attachment menu */}
        <button
          onClick={() => setAttachMenuOpen(v => !v)}
          data-testid="btn-attach-plus"
          title="Attach"
          className="shrink-0 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:border-primary/30 transition-all"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Main input */}
        <div className={cn(
          'flex-1 flex items-end gap-1 rounded-2xl px-3 py-2.5 glass-input',
          disabled && 'opacity-60'
        )}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => { setValue(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Listening…' : placeholder}
            disabled={disabled}
            rows={1}
            data-testid="input-chat-message"
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none max-h-40 leading-relaxed self-center"
            style={{ minHeight: '24px' }}
          />

          {/* Mic */}
          <button
            onClick={startVoiceInput}
            title={isRecording ? 'Stop' : 'Voice input'}
            data-testid="btn-voice-input"
            className={cn(
              'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all',
              isRecording
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'
            )}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            data-testid="btn-send-message"
            className={cn(
              'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all',
              canSend
                ? 'bg-primary text-primary-foreground glow-primary hover:opacity-90'
                : 'bg-foreground/10 text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isRecording ? (
        <p className="text-[10px] text-red-400/70 mt-1.5 text-center animate-pulse">
          Recording… tap mic to stop
        </p>
      ) : (
        <p className="text-[10px] text-muted-foreground/35 mt-1.5 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      )}

      {/* Attachment popup (anchored above this bar) */}
      <AttachmentMenu
        open={attachMenuOpen}
        onClose={() => setAttachMenuOpen(false)}
        onFile={processFile}
        bottomOffset={82}
      />
    </div>
  );
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target?.result as string);
    r.onerror = reject;
    r.readAsText(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target?.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
