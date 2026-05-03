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

  const isChat   = location.startsWith('/chat');
  const isAgents = location.startsWith('/agents');
  const hasOwnHeader = isChat || isAgents;

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Desktop sidebar ── */}
      <Sidebar />

      {/* ── Mobile: left slide-in drawer ── */}
      <DrawerNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ── Page content ── */}
      <main className={[
        'flex-1 min-w-0',
        !hasOwnHeader ? 'pt-14 md:pt-0' : '',
        !hasOwnHeader ? 'pb-8 md:pb-0' : '',
      ].filter(Boolean).join(' ')}>
        {children}
      </main>

      {/* ── Mobile top bar (Gemini-style) ── */}
      <MobileHeader onMenuClick={() => setDrawerOpen(true)} />
    </div>
  );
}
