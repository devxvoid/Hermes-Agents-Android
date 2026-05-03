import { Link, useLocation } from 'wouter';
import { LayoutDashboard, MessageSquare, MessagesSquare, Brain, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { path: '/',              label: 'Dashboard',     icon: LayoutDashboard },
      { path: '/chat',          label: 'Chat',          icon: MessageSquare   },
      { path: '/conversations', label: 'Conversations', icon: MessagesSquare  },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/memory', label: 'Memory', icon: Brain },
      { path: '/skills', label: 'Skills', icon: Zap   },
    ]
  },
  {
    label: 'System',
    items: [
      { path: '/settings',   label: 'Settings',   icon: Settings },
    ]
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { settings, providers } = useApp();
  const activeProvider = providers.find(
    p => p.id === settings.activeProviderId && p.enabled && p.status === 'connected'
  );

  return (
    <aside className="hidden md:flex flex-col w-[220px] h-screen sticky top-0 shrink-0 glass-sidebar">

      {/* ── Brand ── */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="app-icon-sm">
            <span className="text-white font-black text-base select-none" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>R</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-[15px] tracking-tight text-sidebar-foreground leading-none">
              {settings.agentName}
            </div>
            <div className="text-[11px] mt-1 truncate font-medium">
              {activeProvider
                ? <span className="text-emerald-500">{activeProvider.selectedModel}</span>
                : <span className="text-amber-500/90">Demo Mode</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-sidebar-border mx-4" />

      {/* ── Nav sections ── */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto no-scrollbar space-y-4">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50 px-2 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ path, label, icon: Icon }) => {
                const isActive = path === '/' ? location === '/' : location.startsWith(path);
                return (
                  <Link
                    key={path}
                    href={path}
                    data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={cn(
                      'relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group',
                      isActive
                        ? 'text-primary bg-primary/10 dark:bg-primary/12'
                        : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.06]'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
                    )}
                    <Icon className={cn(
                      'w-[15px] h-[15px] shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
                    )} />
                    <span className="flex-1">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="h-px bg-sidebar-border mx-4" />

      {/* ── Status footer ── */}
      <div className="px-3 py-3.5">
        <div className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-xl',
          'bg-sidebar-foreground/[0.04] border border-sidebar-border'
        )}>
          <span className={cn(
            'w-2 h-2 rounded-full shrink-0 ring-4',
            activeProvider
              ? 'bg-emerald-400 ring-emerald-400/20 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : 'bg-amber-400 ring-amber-400/20 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
          )} />
          <div className="min-w-0 flex-1">
            <p className={cn('text-[12px] font-semibold leading-none',
              activeProvider ? 'text-emerald-500' : 'text-amber-500'
            )}>
              {activeProvider ? 'Connected' : 'Demo Mode'}
            </p>
            {!activeProvider && (
              <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-snug">
                Configure a model to start
              </p>
            )}
            {activeProvider && (
              <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">{activeProvider.name}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
