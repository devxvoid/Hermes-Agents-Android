import { Link, useLocation } from 'wouter';
import { LayoutDashboard, MessageSquare, MessagesSquare, Brain, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/* 4 labelled main tabs + 1 icon-only Search tab (App Store–style) */
const MAIN_NAV = [
  { path: '/',              label: 'Home',   icon: LayoutDashboard },
  { path: '/chat',          label: 'Chat',   icon: MessageSquare   },
  { path: '/conversations', label: 'Chats',  icon: MessagesSquare  },
  { path: '/memory',        label: 'Memory', icon: Brain           },
];

export function MobileNav() {
  const [location] = useLocation();
  const isSearchActive = location.startsWith('/conversations');

  return (
    <nav
      data-testid="mobile-nav"
      className="md:hidden fixed bottom-4 left-4 right-4 z-50 liquid-glass-nav rounded-[22px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-between px-2 py-2">

        {/* ── 4 labelled tabs ── */}
        <div className="flex items-center flex-1">
          {MAIN_NAV.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/' ? location === '/' : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                data-testid={`mobile-nav-${label.toLowerCase()}`}
                className="flex-1 flex justify-center"
              >
                <span className={cn(
                  'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-[14px] transition-all duration-200 min-w-[52px]',
                  isActive ? 'liquid-glass-tab-active' : ''
                )}>
                  <Icon className={cn(
                    'w-[22px] h-[22px] transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-foreground/45 dark:text-foreground/40'
                  )} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={cn(
                    'text-[10px] font-semibold leading-none transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-foreground/45 dark:text-foreground/40'
                  )}>
                    {label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Divider ── */}
        <div className="w-px h-7 bg-foreground/10 mx-1 shrink-0" />

        {/* ── Search icon-only (App Store–style) ── */}
        <Link
          href="/conversations"
          data-testid="mobile-nav-search"
          className="flex justify-center pl-1 pr-2"
        >
          <span className={cn(
            'w-10 h-10 flex items-center justify-center rounded-[14px] transition-all duration-200',
            isSearchActive ? 'liquid-glass-tab-active' : ''
          )}>
            <Search className={cn(
              'w-[22px] h-[22px] transition-colors duration-200',
              isSearchActive ? 'text-primary' : 'text-foreground/45 dark:text-foreground/40'
            )} strokeWidth={isSearchActive ? 2.2 : 1.8} />
          </span>
        </Link>

      </div>
    </nav>
  );
}
