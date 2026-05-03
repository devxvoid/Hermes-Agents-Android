import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { ProfileSheet } from './ProfileSheet';
import { cn } from '@/lib/utils';

const ROUTE_TITLES: { path: string; title: string }[] = [
  { path: '/ai-models',      title: 'AI Provider'   },
  { path: '/settings',       title: 'Settings'      },
  { path: '/conversations',  title: 'Chats'         },
  { path: '/memory',         title: 'Memory'        },
  { path: '/skills',         title: 'Skills'        },
  { path: '/chat',           title: 'Chat'          },
  { path: '/',               title: 'Today'         },
];

function getTitle(location: string): string {
  for (const { path, title } of ROUTE_TITLES) {
    if (path === '/' ? location === '/' : location.startsWith(path)) return title;
  }
  return 'Mr. Robot';
}

export function MobileHeader() {
  const [location] = useLocation();
  const { settings } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);

  const isChat = location.startsWith('/chat');
  if (isChat) return null; // Chat manages its own header

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
        className="md:hidden fixed top-0 left-0 right-0 z-40 liquid-glass-topbar"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className={cn(
            'font-extrabold tracking-tight text-foreground leading-none select-none',
            title.length > 10 ? 'text-lg' : 'text-xl'
          )}>
            {title}
          </h1>

          {/* Profile avatar button */}
          <button
            onClick={() => setProfileOpen(true)}
            data-testid="btn-profile-avatar"
            className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/25 active:scale-90 transition-transform focus:outline-none"
          >
            {settings.profileImage ? (
              <img
                src={settings.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                <span
                  className="text-white font-black text-sm select-none"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                >
                  {initials || 'R'}
                </span>
              </div>
            )}
          </button>
        </div>
      </header>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
