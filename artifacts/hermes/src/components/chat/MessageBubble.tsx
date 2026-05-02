import { Message, Memory, Skill } from '@/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Brain, Zap } from 'lucide-react';

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
      {/* AI avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <span className="text-white text-xs font-black select-none">H</span>
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[82%] md:max-w-[68%]', isUser && 'items-end')}>
        {/* Bubble */}
        <div className={cn(
          'px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-[6px] shadow-sm'
            : 'glass-bubble-ai text-foreground rounded-bl-[6px]'
        )}>
          {message.content}
        </div>

        {/* Context chips (memories/skills used) */}
        {!isUser && (usedMems.length > 0 || usedSkills.length > 0) && (
          <div className="flex flex-wrap gap-1 px-1">
            {usedMems.map(m => (
              <span key={m.id} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/15 text-cyan-500 font-medium">
                <Brain className="w-2.5 h-2.5" />{m.title}
              </span>
            ))}
            {usedSkills.map(s => (
              <span key={s.id} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-400 font-medium">
                <Zap className="w-2.5 h-2.5" />{s.name}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp + meta toggle */}
        <div className={cn('flex items-center gap-2 px-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-muted-foreground/35 opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {!isUser && hasMeta && (
            <button
              onClick={() => setMetaOpen(o => !o)}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              {metaOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              {message.metadata?.mode === 'demo' ? 'demo' : (message.metadata?.model?.split('/').pop() || 'detail')}
            </button>
          )}
        </div>

        {/* Expanded metadata card */}
        {!isUser && hasMeta && metaOpen && (
          <div className="glass-card rounded-xl p-3 text-xs space-y-1.5 w-full max-w-[260px]">
            {message.metadata && (
              <>
                <MetaRow label="Provider" value={message.metadata.providerName} />
                <MetaRow label="Model"    value={message.metadata.model} truncate />
                <MetaRow label="Mode"     value={message.metadata.mode}
                  valueClass={
                    message.metadata.mode === 'demo'  ? 'text-amber-400' :
                    message.metadata.mode === 'local' ? 'text-cyan-400'  : 'text-emerald-400'
                  } />
                {message.metadata.latencyMs && <MetaRow label="Latency" value={`${message.metadata.latencyMs}ms`} />}
              </>
            )}
            {usedMems.length > 0   && <MetaRow label="Memories" value={usedMems.map(m => m.title).join(', ')}   valueClass="text-cyan-400"   />}
            {usedSkills.length > 0 && <MetaRow label="Skills"   value={usedSkills.map(s => s.name).join(', ')} valueClass="text-violet-400" />}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-[10px] bg-foreground/10 border border-border flex items-center justify-center shrink-0 mt-1">
          <span className="text-foreground/80 text-xs font-bold select-none">U</span>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value, valueClass = 'text-foreground/80', truncate }: { label: string; value: string; valueClass?: string; truncate?: boolean }) {
  return (
    <div className="flex justify-between gap-2 items-baseline">
      <span className="text-muted-foreground/60 shrink-0 text-[11px]">{label}</span>
      <span className={cn(valueClass, 'text-[11px]', truncate && 'truncate max-w-[140px]')}>{value}</span>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5" data-testid="typing-indicator">
      <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-white text-xs font-black select-none">H</span>
      </div>
      <div className="glass-bubble-ai px-4 py-3 rounded-2xl rounded-bl-[6px] flex items-center gap-1.5">
        {[0,1,2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
