import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  onNewChat: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onNewChat, disabled, placeholder = 'Message Hermes...' }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
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

  return (
    <div
      className="glass-bar px-3 py-3"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
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

        {/* Text + send */}
        <div className={cn(
          'flex-1 flex items-end gap-2 rounded-2xl px-4 py-2.5 glass-input',
          disabled && 'opacity-60'
        )}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => { setValue(e.target.value); handleInput(); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            data-testid="input-chat-message"
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none max-h-40 leading-relaxed"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            data-testid="btn-send-message"
            className={cn(
              'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all',
              value.trim() && !disabled
                ? 'bg-primary text-primary-foreground glow-primary hover:opacity-90'
                : 'bg-foreground/10 text-muted-foreground cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-2 text-center">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
