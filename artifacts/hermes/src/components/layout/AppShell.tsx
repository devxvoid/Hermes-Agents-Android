import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { useLocation } from 'wouter';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const isChat = location.startsWith('/chat');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/*
        Mobile: fixed top bar (56px) + floating bottom nav (~88px).
        Chat page manages its own layout internally.
        Desktop: no extra padding needed.
      */}
      <main className={[
        'flex-1 min-w-0',
        // Mobile top bar offset (not on chat — chat has own header)
        !isChat ? 'pt-14 md:pt-0' : '',
        // Bottom nav clearance
        !isChat ? 'pb-28 md:pb-0' : '',
      ].filter(Boolean).join(' ')}>
        {children}
      </main>

      {/* Mobile top bar with profile avatar */}
      <MobileHeader />

      {/* Floating bottom pill nav */}
      <MobileNav />
    </div>
  );
}
