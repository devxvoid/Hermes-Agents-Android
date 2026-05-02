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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  return (
    <div className="glass-nav border-t border-white/[0.07] px-3 py-3"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={onNewChat}
            className="shrink-0 h-10 w-10 rounded-xl glass border-white/10 hover:border-white/20"
            data-testid="btn-new-chat"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </Button>

          <div className={cn(
            'flex-1 flex items-end gap-2 glass-input rounded-2xl px-4 py-2.5',
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
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none max-h-40 leading-relaxed"
              style={{ minHeight: '24px' }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className="shrink-0 h-8 w-8 rounded-xl glow-primary"
              data-testid="btn-send-message"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
