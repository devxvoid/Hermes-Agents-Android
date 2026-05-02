import { Message, Memory, Skill } from '@/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  memories?: Memory[];
  skills?: Skill[];
}

export function MessageBubble({ message, memories = [], skills = [] }: MessageBubbleProps) {
  const [metaOpen, setMetaOpen] = useState(false);
  const isUser = message.role === 'user';
  const usedMems = memories.filter(m => message.usedMemoryIds?.includes(m.id));
  const usedSkills = skills.filter(s => message.triggeredSkillIds?.includes(s.id));
  const hasMeta = !!message.metadata || usedMems.length > 0 || usedSkills.length > 0;

  return (
    <div
      data-testid={`message-${message.id}`}
      className={cn('flex gap-3 group', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
          <span className="text-primary text-xs font-bold">H</span>
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[85%] md:max-w-[70%]', isUser && 'items-end')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-card border border-card-border text-card-foreground rounded-bl-sm'
          )}
        >
          {message.content}
        </div>

        <div className={cn('flex items-center gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {!isUser && hasMeta && (
            <button
              onClick={() => setMetaOpen(o => !o)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`btn-meta-${message.id}`}
            >
              {metaOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {message.metadata?.mode === 'demo' ? 'Demo' : message.metadata?.model || 'context'}
            </button>
          )}
        </div>

        {!isUser && hasMeta && metaOpen && (
          <div className="bg-card/60 border border-border rounded-lg p-3 text-xs space-y-1.5 w-full max-w-xs">
            {message.metadata && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="text-foreground">{message.metadata.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span className="text-foreground truncate max-w-[150px]">{message.metadata.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className={cn('font-medium', message.metadata.mode === 'demo' ? 'text-amber-400' : message.metadata.mode === 'local' ? 'text-cyan-400' : 'text-green-400')}>
                    {message.metadata.mode}
                  </span>
                </div>
                {message.metadata.latencyMs && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="text-foreground">{message.metadata.latencyMs}ms</span>
                  </div>
                )}
              </>
            )}
            {usedMems.length > 0 && (
              <div>
                <span className="text-muted-foreground">Memories: </span>
                <span className="text-cyan-400">{usedMems.map(m => m.title).join(', ')}</span>
              </div>
            )}
            {usedSkills.length > 0 && (
              <div>
                <span className="text-muted-foreground">Skills: </span>
                <span className="text-primary">{usedSkills.map(s => s.name).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 mt-1">
          <span className="text-foreground text-xs font-semibold">U</span>
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start" data-testid="typing-indicator">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <span className="text-primary text-xs font-bold">H</span>
      </div>
      <div className="bg-card border border-card-border px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
