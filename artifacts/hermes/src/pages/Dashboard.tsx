import { useApp } from '@/contexts/AppContext';
import { useLocation } from 'wouter';
import { Mic, BarChart2, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Quick-action suggestion chips ── */
const SUGGESTIONS = [
  { emoji: '💬', label: 'Start a new chat' },
  { emoji: '🧠', label: 'Search my memories' },
  { emoji: '📝', label: 'Write anything' },
  { emoji: '✨', label: 'Boost my day' },
];

export default function Dashboard() {
  const { settings } = useApp();
  const [, setLocation] = useLocation();

  const startChat = (prefill?: string) => {
    if (prefill) {
      sessionStorage.setItem('chat_prefill', prefill);
    }
    setLocation('/chat');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Main scrollable content ── */}
      <div className="flex-1 px-6 pt-10 md:pt-16 pb-52">

        {/* Greeting */}
        <div className="mb-10">
          <p className="text-base text-foreground/55 font-medium mb-1">
            Hi {settings.agentName}
          </p>
          <h1 className="text-[32px] md:text-[40px] font-bold text-foreground leading-tight tracking-tight">
            Where should we start?
          </h1>
        </div>

        {/* ── Suggestion chips ── */}
        <div className="flex flex-col gap-3 max-w-sm">
          {SUGGESTIONS.map(({ emoji, label }) => (
            <button
              key={label}
              onClick={() => startChat(label)}
              className="gemini-chip flex items-center gap-3 px-5 py-3.5 rounded-full text-left w-fit"
            >
              <span className="text-xl leading-none select-none">{emoji}</span>
              <span className="text-[15px] font-medium text-foreground/90">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Fixed bottom Gemini-style input bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 md:left-[220px] px-4 pt-3 pb-5 gemini-bottom-bar"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        onClick={() => startChat()}
      >
        {/* Input pill */}
        <div className="gemini-input-pill w-full px-5 py-4 cursor-text mb-3">
          <p className="text-foreground/35 text-[15px] select-none">Ask {settings.agentName}…</p>
        </div>

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-1">
          {/* Left: attachment + tools */}
          <div className="flex items-center gap-5">
            <button
              className="text-foreground/50 hover:text-foreground/80 transition-colors active:scale-90"
              onClick={e => { e.stopPropagation(); startChat(); }}
            >
              <Plus className="w-[22px] h-[22px]" strokeWidth={1.8} />
            </button>
            <button
              className="text-foreground/50 hover:text-foreground/80 transition-colors active:scale-90"
              onClick={e => { e.stopPropagation(); startChat(); }}
            >
              <SlidersHorizontal className="w-[20px] h-[20px]" strokeWidth={1.8} />
            </button>
          </div>

          {/* Right: speed badge + mic + analyze */}
          <div className="flex items-center gap-4">
            <div className="gemini-speed-badge flex items-center gap-1.5 px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-foreground/60" />
              <span className="text-[13px] font-medium text-foreground/70">Fast</span>
            </div>
            <button className="text-foreground/55 hover:text-foreground/80 transition-colors active:scale-90">
              <Mic className="w-[22px] h-[22px]" strokeWidth={1.8} />
            </button>
            <button className="text-foreground/55 hover:text-foreground/80 transition-colors active:scale-90">
              <BarChart2 className="w-[22px] h-[22px]" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
