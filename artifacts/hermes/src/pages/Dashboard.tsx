import { useApp } from '@/contexts/AppContext';
import { Link } from 'wouter';
import { MessageSquare, Brain, Zap, Cpu, Plus, ArrowRight, Clock, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accent)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { conversations, memories, skills, providers, settings } = useApp();
  const activeProvider = providers.find(p => p.id === settings.activeProviderId && p.status === 'connected');
  const recentConvs = [...conversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  const activeMemories = memories.filter(m => m.active);
  const enabledSkills   = skills.filter(s => s.enabled);
  const configuredProviders = providers.filter(p => p.status === 'connected').length;

  const quickActions = [
    { label: 'New Chat',     icon: MessageSquare, href: '/chat',      color: 'bg-primary/12 text-primary border-primary/20'        },
    { label: 'Add Memory',   icon: Brain,         href: '/memory',    color: 'bg-cyan-500/12 text-cyan-400 border-cyan-500/20'     },
    { label: 'Create Skill', icon: Zap,           href: '/skills',    color: 'bg-violet-500/12 text-violet-400 border-violet-500/20'},
    { label: 'Configure AI', icon: Cpu,           href: '/ai-models', color: 'bg-amber-500/12 text-amber-400 border-amber-500/20'  },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">

      {/* ── Hero ── */}
      <div className="glass-strong rounded-3xl p-5 relative overflow-hidden glass-shine">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5 pointer-events-none" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{settings.agentName}</h1>
              <span className={cn(
                'text-xs px-2.5 py-1 rounded-full border font-medium',
                activeProvider
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
              )}>
                {activeProvider ? 'Online' : 'Demo Mode'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Autonomous assistant for research, task management, data analysis, and agent orchestration.
            </p>
            {activeProvider && (
              <p className="text-xs text-muted-foreground mt-2">
                Active: <span className="text-foreground font-medium">{activeProvider.selectedModel}</span>
                {' '}via {activeProvider.name}
              </p>
            )}
          </div>
          <Link
            href="/chat"
            className="btn-pill flex items-center gap-2 px-4 py-2.5 text-sm font-medium shrink-0"
          >
            <Plus className="w-4 h-4" /> New Chat
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Conversations"  value={conversations.length}     icon={MessageSquare} accent="bg-primary/15 text-primary"         />
        <StatCard label="Active Memories" value={activeMemories.length}    icon={Brain}         accent="bg-cyan-500/15 text-cyan-400"       />
        <StatCard label="Active Skills"  value={enabledSkills.length}     icon={Zap}           accent="bg-violet-500/15 text-violet-400"   />
        <StatCard label="AI Models"      value={configuredProviders}       icon={Cpu}           accent="bg-amber-500/15 text-amber-400"     />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, href, color }) => (
            <Link
              key={href}
              href={href}
              data-testid={`quick-action-${label.toLowerCase().replace(/\s/g, '-')}`}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border glass-card transition-all',
                color
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom 2-col ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Recent Conversations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</h2>
            <Link href="/conversations" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentConvs.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
              <Link href="/chat" className="text-sm text-primary hover:underline mt-1 inline-block">
                Start your first chat →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentConvs.map(conv => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  data-testid={`recent-conv-${conv.id}`}
                  className="flex items-center gap-3 glass-card rounded-2xl p-3 block"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {conv.pinned && <Pin className="w-3 h-3 text-primary" />}
                      <span className="text-sm font-medium truncate">{conv.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                      <span>· {conv.messages.length} msgs</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Memory Highlights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Memory Highlights</h2>
            <Link href="/memory" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {activeMemories.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active memories.</p>
              <Link href="/memory" className="text-sm text-primary hover:underline mt-1 inline-block">
                Add your first memory →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activeMemories.slice(0, 4).map(mem => (
                <div key={mem.id} className="glass-card rounded-2xl p-3 flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{mem.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{mem.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Active Skills ── */}
      {enabledSkills.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Skills</h2>
            <Link href="/skills" className="text-xs text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {enabledSkills.map(skill => (
              <span
                key={skill.id}
                data-testid={`skill-badge-${skill.id}`}
                className="text-xs glass-card border-violet-500/20 text-violet-400 px-3 py-1 rounded-full font-medium"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
