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
  const usedMems   = memories.filter(m => message.usedMemoryIds?.includes(m.id));
  const usedSkills = skills.filter(s => message.triggeredSkillIds?.includes(s.id));
  const hasMeta    = !!message.metadata || usedMems.length > 0 || usedSkills.length > 0;

  return (
    <div
      data-testid={`message-${message.id}`}
      className={cn('flex gap-2.5 group', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* Avatar — AI */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
          <span className="text-primary text-xs font-bold">H</span>
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[82%] md:max-w-[68%]', isUser && 'items-end')}>
        {/* Bubble */}
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-primary/90 text-primary-foreground rounded-br-md'
            : 'glass-bubble-ai text-foreground rounded-bl-md'
        )}>
          {message.content}
        </div>

        {/* Meta row */}
        <div className={cn('flex items-center gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {!isUser && hasMeta && (
            <button
              onClick={() => setMetaOpen(o => !o)}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {metaOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {message.metadata?.mode === 'demo' ? 'demo' : message.metadata?.model || 'detail'}
            </button>
          )}
        </div>

        {/* Expanded meta */}
        {!isUser && hasMeta && metaOpen && (
          <div className="glass-card rounded-2xl p-3 text-xs space-y-1.5 w-full max-w-xs">
            {message.metadata && (
              <>
                <Row label="Provider" value={message.metadata.providerName} />
                <Row label="Model"    value={message.metadata.model} truncate />
                <Row label="Mode"     value={message.metadata.mode}
                  valueClass={
                    message.metadata.mode === 'demo'  ? 'text-amber-400' :
                    message.metadata.mode === 'local' ? 'text-cyan-400'  : 'text-emerald-400'
                  } />
                {message.metadata.latencyMs && <Row label="Latency" value={`${message.metadata.latencyMs}ms`} />}
              </>
            )}
            {usedMems.length   > 0 && <Row label="Memories" value={usedMems.map(m => m.title).join(', ')}     valueClass="text-cyan-400"   />}
            {usedSkills.length > 0 && <Row label="Skills"   value={usedSkills.map(s => s.name).join(', ')}   valueClass="text-violet-400" />}
          </div>
        )}
      </div>

      {/* Avatar — User */}
      {isUser && (
        <div className="w-7 h-7 rounded-full glass-card flex items-center justify-center shrink-0 mt-1">
          <span className="text-foreground text-xs font-semibold">U</span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass = 'text-foreground', truncate }: { label: string; value: string; valueClass?: string; truncate?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn(valueClass, truncate && 'truncate max-w-[150px]')}>{value}</span>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5" data-testid="typing-indicator">
      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <span className="text-primary text-xs font-bold">H</span>
      </div>
      <div className="glass-bubble-ai px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
        {[0,1,2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
