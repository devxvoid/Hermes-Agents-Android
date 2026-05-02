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
    <aside className="hidden md:flex flex-col w-60 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 shrink-0">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
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

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/' ? location === '/' : location.startsWith(path);
          return (
            <Link key={path} href={path}
              data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-sidebar-primary/15 text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-sidebar-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground')} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-sidebar-primary/60" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <div className="text-xs text-muted-foreground">
            {activeProvider ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  <span className="text-green-400 font-medium">Online</span>
                </div>
                <div className="mt-0.5 truncate">{activeProvider.name}</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-400 font-medium">Demo Mode</span>
                </div>
                <div className="mt-0.5">Configure a model to enable real AI</div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
