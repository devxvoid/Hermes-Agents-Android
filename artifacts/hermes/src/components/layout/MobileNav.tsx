import { Link, useLocation } from 'wouter';
import { LayoutDashboard, MessageSquare, MessagesSquare, Brain, Zap, Settings, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const primaryNav = [
  { path: '/',              label: 'Home',   icon: LayoutDashboard },
  { path: '/chat',          label: 'Chat',   icon: MessageSquare   },
  { path: '/conversations', label: 'Chats',  icon: MessagesSquare  },
  { path: '/memory',        label: 'Memory', icon: Brain           },
  { path: '/skills',        label: 'Skills', icon: Zap             },
];

const moreNav = [
  { path: '/ai-models', label: 'AI Model',  icon: Cpu      },
  { path: '/settings',  label: 'Settings',  icon: Settings },
];

export function MobileNav() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreNav.some(n => location.startsWith(n.path));

  return (
    <>
      <nav
        data-testid="mobile-nav"
        className="md:hidden fixed bottom-5 left-5 right-5 z-50 glass-pill-nav rounded-full"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {primaryNav.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/' ? location === '/' : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                data-testid={`mobile-nav-${label.toLowerCase()}`}
                className="flex flex-col items-center"
              >
                <span className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all',
                  isActive && 'glass-pill-active'
                )}>
                  <Icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-[10px] font-medium leading-none', isActive ? 'text-primary' : 'text-muted-foreground/60')}>
                    {label}
                  </span>
                </span>
              </Link>
            );
          })}

          <button onClick={() => setMoreOpen(true)} data-testid="mobile-nav-more" className="flex flex-col items-center">
            <span className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all',
              isMoreActive && 'glass-pill-active'
            )}>
              <Settings className={cn('w-5 h-5', isMoreActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-[10px] font-medium leading-none', isMoreActive ? 'text-primary' : 'text-muted-foreground/60')}>More</span>
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl glass-strong border-x-0 border-b-0">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-base">More</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 pb-8">
            {moreNav.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                href={path}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-foreground/[0.06] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-sm">{label}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
