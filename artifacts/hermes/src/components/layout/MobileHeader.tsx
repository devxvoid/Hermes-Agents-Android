import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { ProfileSheet } from './ProfileSheet';
import { Menu, SquareDashed } from 'lucide-react';
import { cn } from '@/lib/utils';

/* Route → title mapping (most-specific first) */
const ROUTE_TITLES: { path: string; title: string }[] = [
  { path: '/ai-models',      title: 'AI Provider'   },
  { path: '/settings',       title: 'Settings'      },
  { path: '/conversations',  title: 'Conversations' },
  { path: '/memory',         title: 'Memory'        },
  { path: '/skills',         title: 'Skills'        },
  { path: '/',               title: 'Mr. Robot'     },
];

function getTitle(location: string): string {
  for (const { path, title } of ROUTE_TITLES) {
    if (path === '/' ? location === '/' : location.startsWith(path)) return title;
  }
  return 'Mr. Robot';
}

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const [location] = useLocation();
  const { settings } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);

  /* Chat and agent pages manage their own headers */
  const hideHeader = location.startsWith('/chat') || location.startsWith('/agents');
  if (hideHeader) return null;

  const title = getTitle(location);

  const initials = settings.agentName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-3 h-14">

          {/* ── Hamburger ── */}
          <button
            onClick={onMenuClick}
            data-testid="btn-menu-open"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors"
          >
            <Menu className="w-[22px] h-[22px] text-foreground/80" strokeWidth={1.8} />
          </button>

          {/* ── Centered title (hacker mode: monospace + glow) ── */}
          <span
            className="absolute left-1/2 -translate-x-1/2 font-semibold text-[17px] tracking-tight select-none pointer-events-none transition-all duration-300"
            style={settings.hackerMode ? {
              color: '#00FF41',
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: '0 0 10px rgba(0,255,65,0.7)',
              letterSpacing: '0.06em',
            } : undefined}
          >
            {settings.hackerMode ? `> ${title}_` : title}
          </span>

          {/* ── Right side: new-chat icon + profile ── */}
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors">
              <SquareDashed className="w-[20px] h-[20px] text-foreground/60" strokeWidth={1.6} />
            </button>

            <button
              onClick={() => setProfileOpen(true)}
              data-testid="btn-profile-avatar"
              className="w-9 h-9 rounded-full overflow-hidden active:scale-90 transition-transform focus:outline-none ring-2 ring-white/15"
            >
              {settings.profileImage ? (
                <img
                  src={settings.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                  <span className="text-white font-black text-sm select-none"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                    {initials || 'R'}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
