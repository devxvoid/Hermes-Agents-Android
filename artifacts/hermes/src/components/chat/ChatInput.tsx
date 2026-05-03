import { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { Send, Plus, Mic, MicOff, Paperclip, X } from 'lucide-react';
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

export function ChatInput({ onSend, onNewChat, disabled, placeholder = 'Message Hermes...' }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;

    let messageText = trimmed;
    if (attachments.length > 0) {
      const fileSection = attachments.map(f =>
        `[Attached file: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``
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

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  /* ── Voice input ── */
  const startVoiceInput = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setValue(prev => prev ? prev + ' ' + transcript : transcript);
      setTimeout(handleInput, 50);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);

    rec.start();
    setIsRecording(true);
    recognitionRef.current = rec;
  }, [isRecording]);

  /* ── File attachment ── */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: AttachedFile[] = [];

    for (const file of files.slice(0, 5)) {
      try {
        const content = await readFileAsText(file);
        newAttachments.push({ name: file.name, content, type: file.type });
      } catch {
        newAttachments.push({ name: file.name, content: `[Binary file — ${formatBytes(file.size)}]`, type: file.type });
      }
    }

    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = (value.trim() || attachments.length > 0) && !disabled;

  return (
    <div
      className="glass-bar px-3 pt-2 pb-3"
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
              <Paperclip className="w-3 h-3 shrink-0" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-primary/60 hover:text-primary ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto flex items-end gap-2">
        {/* New chat */}
        <button
          onClick={onNewChat}
          data-testid="btn-new-chat"
          title="New chat"
          className="shrink-0 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:border-primary/30 transition-all"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Main input bar */}
        <div className={cn(
          'flex-1 flex items-end gap-1 rounded-2xl px-3 py-2.5 glass-input',
          disabled && 'opacity-60'
        )}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => { setValue(e.target.value); handleInput(); }}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Listening...' : placeholder}
            disabled={disabled}
            rows={1}
            data-testid="input-chat-message"
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none max-h-40 leading-relaxed self-center"
            style={{ minHeight: '24px' }}
          />

          {/* File attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            data-testid="btn-attach-file"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          {/* Mic */}
          <button
            onClick={startVoiceInput}
            title={isRecording ? 'Stop recording' : 'Voice input'}
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.ts,.tsx,.js,.jsx,.py,.json,.yaml,.yml,.csv,.html,.css,.sh,.swift,.kt,.java,.c,.cpp,.h,.sql,.xml,.env,.toml,.ini,.conf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!isRecording && (
        <p className="text-[10px] text-muted-foreground/35 mt-1.5 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      )}
      {isRecording && (
        <p className="text-[10px] text-red-400/70 mt-1.5 text-center animate-pulse">
          Recording... tap mic again to stop
        </p>
      )}
    </div>
  );
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
