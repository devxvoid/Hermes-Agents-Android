import { Link, useLocation } from 'wouter';
import { LayoutDashboard, MessageSquare, MessagesSquare, Brain, Zap, Cpu, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/conversations', label: 'Conversations', icon: MessagesSquare },
  { path: '/memory', label: 'Memory', icon: Brain },
  { path: '/skills', label: 'Skills', icon: Zap },
  { path: '/ai-models', label: 'AI Models', icon: Cpu },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { settings, providers } = useApp();
  const activeProvider = providers.find(p => p.id === settings.activeProviderId && p.enabled && p.status === 'connected');

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 shrink-0 glass-sidebar">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 glow-primary">
            <span className="text-primary-foreground font-bold text-sm">H</span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-sidebar-foreground truncate">{settings.agentName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {activeProvider ? (
                <span className="text-green-400">{activeProvider.selectedModel}</span>
              ) : (
                <span className="text-amber-400">Demo Mode</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">
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
                  ? 'glass text-primary glow-primary'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/[0.05]'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground')} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-primary/60" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="px-3 py-2.5 rounded-xl glass-card">
          <div className="text-xs text-muted-foreground">
            {activeProvider ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                  <span className="text-green-400 font-medium">Online</span>
                </div>
                <div className="mt-0.5 truncate text-muted-foreground/80">{activeProvider.name}</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                  <span className="text-amber-400 font-medium">Demo Mode</span>
                </div>
                <div className="mt-0.5 text-muted-foreground/70">Configure a model for real AI</div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
