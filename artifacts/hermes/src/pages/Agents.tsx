import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { Bot, ChevronLeft, ChevronRight, Plus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const STYLE_LABELS: Record<string, string> = {
  concise: 'Concise',
  formal: 'Formal',
  socratic: 'Socratic',
  comprehensive: 'Comprehensive',
};

export default function Agents() {
  const { agents, settings } = useApp();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">

      {/* ── Fixed header ── */}
      <div
        className="fixed top-0 left-0 right-0 md:left-60 z-30 bg-background"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center px-3 h-14">
          <button
            onClick={() => setLocation('/')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-foreground/[0.07] active:bg-foreground/[0.12] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground/80" />
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-[17px] text-foreground tracking-tight select-none pointer-events-none">
            Your Agents
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="px-4 pb-36"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 64px)' }}
      >
        {/* Section label */}
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-3 px-1">
          Your Agents
        </p>

        {/* Agent cards */}
        {agents.length > 0 ? (
          <div className="space-y-2.5">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setLocation(`/agents/${agent.id}`)}
                className="w-full glass-card rounded-2xl px-4 py-4 flex items-center gap-3.5 text-left active:scale-[0.985] transition-transform"
              >
                {/* Coloured avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-[18px] shrink-0 select-none shadow-sm"
                  style={{ background: agent.color }}
                >
                  {agent.name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[15px] font-semibold text-foreground leading-snug">{agent.name}</p>
                    {settings.activeAgentId === agent.id && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary leading-none shrink-0">
                        <Zap className="w-2.5 h-2.5" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-relaxed">
                    {agent.instructions || `Style: ${STYLE_LABELS[agent.responseStyle]}`}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-foreground/20 shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-full bg-foreground/[0.06] flex items-center justify-center">
              <Bot className="w-8 h-8 text-foreground/25" />
            </div>
            <p className="text-sm font-semibold text-foreground/45">No agents yet</p>
            <p className="text-xs text-foreground/25 text-center max-w-[220px] leading-relaxed">
              Create an agent with a unique persona and set of instructions
            </p>
          </div>
        )}

        {agents.length > 0 && (
          <p className="text-xs text-muted-foreground mt-5 px-1 leading-relaxed">
            Custom agents you create will be automatically used in every new chat when set as active.
          </p>
        )}
      </div>

      {/* ── Fixed bottom "Create Agent" button ── */}
      <div
        className="fixed bottom-0 left-0 right-0 md:left-60 px-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
      >
        <button
          onClick={() => setLocation('/agents/new')}
          className="w-full py-[15px] rounded-full bg-foreground text-background font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          Create Agent
        </button>
      </div>
    </div>
  );
}
