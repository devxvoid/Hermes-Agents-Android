import { Link, useLocation } from 'wouter';
import { LayoutDashboard, MessageSquare, MessagesSquare, Brain, Zap, Cpu, Settings, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const primaryNav = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/conversations', label: 'Chats', icon: MessagesSquare },
  { path: '/memory', label: 'Memory', icon: Brain },
  { path: '/skills', label: 'Skills', icon: Zap },
];

const moreNav = [
  { path: '/ai-models', label: 'AI Models', icon: Cpu },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {primaryNav.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/' ? location === '/' : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                data-testid={`mobile-nav-${label.toLowerCase()}`}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[48px] transition-all',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'p-1 rounded-lg transition-all',
                  isActive && 'glass glow-primary'
                )}>
                  <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <span className={cn('text-[10px] font-medium leading-none', isActive ? 'text-primary' : 'text-muted-foreground/70')}>
                  {label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            data-testid="mobile-nav-more"
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[48px] text-muted-foreground transition-all"
          >
            <div className="p-1 rounded-lg">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none text-muted-foreground/70">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl glass-strong border-white/10">
          <SheetHeader className="pb-4">
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 pb-6">
            {moreNav.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                href={path}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.06] transition-colors"
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
