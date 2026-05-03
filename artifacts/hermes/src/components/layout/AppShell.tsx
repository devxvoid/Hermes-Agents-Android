import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { DrawerNav } from './DrawerNav';
import { useLocation } from 'wouter';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isChat = location.startsWith('/chat');

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Desktop sidebar ── */}
      <Sidebar />

      {/* ── Mobile: left slide-in drawer ── */}
      <DrawerNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ── Page content ── */}
      <main className={[
        'flex-1 min-w-0',
        /* push content below fixed mobile top bar (56px), except chat */
        !isChat ? 'pt-14 md:pt-0' : '',
        /* bottom safe area for non-chat pages (no bottom nav any more) */
        !isChat ? 'pb-8 md:pb-0' : '',
      ].filter(Boolean).join(' ')}>
        {children}
      </main>

      {/* ── Mobile top bar (Gemini-style) ── */}
      <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
    </div>
  );
}
