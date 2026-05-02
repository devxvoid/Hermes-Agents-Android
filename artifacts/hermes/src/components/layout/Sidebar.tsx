import { Link, useLocation } from 'wouter';
import { LayoutDashboard, MessageSquare, MessagesSquare, Brain, Zap, Cpu, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { path: '/',              label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/chat',          label: 'Chat',          icon: MessageSquare   },
  { path: '/conversations', label: 'Conversations', icon: MessagesSquare  },
  { path: '/memory',        label: 'Memory',        icon: Brain           },
  { path: '/skills',        label: 'Skills',        icon: Zap             },
  { path: '/ai-models',     label: 'AI Models',     icon: Cpu             },
  { path: '/settings',      label: 'Settings',      icon: Settings        },
];

export function Sidebar() {
  const [location] = useLocation();
  const { settings, providers } = useApp();
  const activeProvider = providers.find(
    p => p.id === settings.activeProviderId && p.enabled && p.status === 'connected'
  );

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 shrink-0 glass-sidebar">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">H</span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-sidebar-foreground">{settings.agentName}</div>
            <div className="text-[11px] truncate mt-0.5">
              {activeProvider
                ? <span className="text-emerald-500">{activeProvider.selectedModel}</span>
                : <span className="text-amber-500">Demo Mode</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/' ? location === '/' : location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary/12 text-primary border border-primary/20'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-foreground/[0.06] border border-transparent'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 shrink-0',
                isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-sidebar-foreground'
              )} />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Status footer */}
      <div className="px-3 py-4 border-t border-border/20">
        <div className="px-3 py-2.5 rounded-xl glass-card">
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              activeProvider
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,.9)]'
                : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,.8)]'
            )} />
            <span className={cn(
              'text-xs font-medium',
              activeProvider ? 'text-emerald-500' : 'text-amber-500'
            )}>
              {activeProvider ? activeProvider.name : 'Demo Mode'}
            </span>
          </div>
          {!activeProvider && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 leading-snug">
              Configure a model to enable real AI
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
