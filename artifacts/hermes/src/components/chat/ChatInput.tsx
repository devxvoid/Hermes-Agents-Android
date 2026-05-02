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
    <div className="border-t border-border bg-background/80 backdrop-blur-md px-4 py-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={onNewChat}
            className="shrink-0 h-10 w-10 rounded-xl"
            data-testid="btn-new-chat"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </Button>

          <div className={cn(
            'flex-1 flex items-end gap-2 bg-card border border-card-border rounded-xl px-3 py-2 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20',
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
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-40 leading-relaxed"
              style={{ minHeight: '24px' }}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className="shrink-0 h-8 w-8 rounded-lg"
              data-testid="btn-send-message"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Enter to send, Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
