import { useState, useRef, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { Agent } from '@/types';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const STYLE_OPTIONS: { value: Agent['responseStyle']; label: string; desc: string }[] = [
  { value: 'concise',       label: 'Concise',       desc: 'Short, direct answers' },
  { value: 'formal',        label: 'Formal',        desc: 'Professional tone'     },
  { value: 'socratic',      label: 'Socratic',      desc: 'Ask before answering'  },
  { value: 'comprehensive', label: 'Comprehensive', desc: 'Detailed & thorough'   },
];

const AGENT_COLORS = [
  '#7C45C6', '#2196B8', '#1A9C97', '#2D8A54',
  '#CC2B4C', '#E07B00', '#4b6480', '#9C6027',
];

function pickColor(name: string): string {
  const idx = name.charCodeAt(0) % AGENT_COLORS.length;
  return AGENT_COLORS[idx];
}

export default function AgentEditor() {
  const { agents, addAgent, updateAgent, deleteAgent, settings, updateSettings } = useApp();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();

  const isNew   = params.id === 'new';
  const existing = isNew ? null : agents.find(a => a.id === params.id);

  const [name,          setName]          = useState(existing?.name          ?? '');
  const [instructions,  setInstructions]  = useState(existing?.instructions  ?? '');
  const [responseStyle, setResponseStyle] = useState<Agent['responseStyle']>(existing?.responseStyle ?? 'comprehensive');
  const [color,         setColor]         = useState(existing?.color         ?? AGENT_COLORS[0]);
  const [isActive,      setIsActive]      = useState(!isNew && settings.activeAgentId === existing?.id);
  const [showDelete,    setShowDelete]    = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [instructions]);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const now = new Date().toISOString();
    if (isNew) {
      const id   = crypto.randomUUID();
      const col  = color !== AGENT_COLORS[0] ? color : pickColor(name.trim());
      addAgent({ id, name: name.trim(), instructions, responseStyle, color: col, createdAt: now, updatedAt: now });
      if (isActive) updateSettings({ activeAgentId: id });
      toast({ title: 'Agent created', description: `${name.trim()} is ready to use.` });
    } else if (existing) {
      updateAgent(existing.id, { name: name.trim(), instructions, responseStyle, color, updatedAt: now });
      if (isActive && settings.activeAgentId !== existing.id) {
        updateSettings({ activeAgentId: existing.id });
      } else if (!isActive && settings.activeAgentId === existing.id) {
        updateSettings({ activeAgentId: undefined });
      }
      toast({ title: 'Agent saved' });
    }
    setLocation('/agents');
  };

  const handleDelete = () => {
    if (!existing) return;
    deleteAgent(existing.id);
    if (settings.activeAgentId === existing.id) updateSettings({ activeAgentId: undefined });
    toast({ title: 'Agent deleted' });
    setLocation('/agents');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Fixed header ── */}
      <div
        className="fixed top-0 left-0 right-0 md:left-60 z-30 bg-background border-b border-border/20"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-3 h-14">
          {/* × cancel */}
          <button
            onClick={() => setLocation('/agents')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/[0.08] hover:bg-foreground/[0.12] active:bg-foreground/[0.16] transition-colors"
          >
            <X className="w-4 h-4 text-foreground/80" />
          </button>

          {/* Title */}
          <span className="font-semibold text-[17px] text-foreground tracking-tight">
            {isNew ? 'Create Agent' : 'Edit Agent'}
          </span>

          {/* ✓ save */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/[0.08] hover:bg-foreground/[0.12] active:bg-foreground/[0.16] transition-colors disabled:opacity-25"
          >
            <Check className="w-4 h-4 text-foreground/80" />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto px-4 space-y-5"
        style={{
          paddingTop:    'calc(env(safe-area-inset-top) + 72px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)',
        }}
      >

        {/* ── Avatar color picker ── */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0 select-none"
            style={{ background: color }}
          >
            {name ? name[0].toUpperCase() : '?'}
          </div>
          <div className="flex gap-2.5 flex-wrap">
            {AGENT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-8 h-8 rounded-full transition-all',
                  color === c ? 'ring-[3px] ring-offset-2 ring-offset-background ring-foreground/60 scale-110' : 'scale-100'
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {/* ── Name ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Name</p>
          <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Code Expert, Research Bot, Writing Coach..."
              className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-foreground/30 outline-none"
              autoFocus={isNew}
              maxLength={60}
            />
            {name.length > 0 && (
              <span className="text-xs text-foreground/25 shrink-0">{name.length}/60</span>
            )}
          </div>
        </div>

        {/* ── Instructions ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Instructions</p>
          <div className="glass-card rounded-2xl px-4 py-3.5">
            <textarea
              ref={textareaRef}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder={
                `Describe this agent's persona, role, and how it should respond.\n\nExample:\nYou are a senior cybersecurity engineer. Always explain concepts with practical examples and real code. Be direct, skip disclaimers, and assume the user is technical.`
              }
              className="w-full bg-transparent text-[15px] text-foreground placeholder:text-foreground/28 outline-none resize-none leading-[1.65] overflow-hidden"
              style={{ minHeight: '220px' }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-2 px-1">
            Changes will only apply to new conversations, not existing ones.
          </p>
        </div>

        {/* ── Response style ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">Response Style</p>
          <div className="flex gap-2 flex-wrap">
            {STYLE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setResponseStyle(value)}
                className={cn(
                  'px-4 py-2 rounded-full text-[13px] font-semibold border transition-all active:scale-95',
                  responseStyle === value
                    ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                    : 'bg-foreground/[0.05] border-foreground/10 text-foreground/55 hover:bg-foreground/[0.08]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Set as active ── */}
        <div className="glass-card rounded-2xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Set as Active Agent</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isNew ? 'Activate this agent immediately after creating it' : 'Use this agent for all new chats'}
              </p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        {/* ── Delete (edit mode only) ── */}
        {!isNew && (
          showDelete ? (
            <div className="glass-card rounded-2xl px-4 py-4 space-y-3">
              <p className="text-sm font-semibold text-red-400 text-center">Delete "{existing?.name}"?</p>
              <p className="text-xs text-muted-foreground text-center">This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border/50 text-sm font-semibold text-foreground/70 hover:bg-foreground/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/25 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDelete(true)}
              className="w-full py-3.5 rounded-2xl glass-card text-red-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Trash2 className="w-4 h-4" />
              Delete Agent
            </button>
          )
        )}
      </div>
    </div>
  );
}
