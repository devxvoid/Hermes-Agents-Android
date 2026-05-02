import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
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
        Non-chat pages: pad bottom to clear the floating pill nav
        (pill is at bottom-5=20px, ~68px tall → need ~100px clearance)
        Chat page: manages its own layout internally, no extra padding needed
      */}
      <main className={`flex-1 min-w-0 md:pb-0 ${isChat ? '' : 'pb-28'}`}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
