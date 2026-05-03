import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { useState } from 'react';
import { Search, SquarePen, ChevronRight, Pin, Settings } from 'lucide-react';

interface DrawerNavProps {
  open: boolean;
  onClose: () => void;
}

export function DrawerNav({ open, onClose }: DrawerNavProps) {
  const { conversations } = useApp();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  const chats = conversations
    .filter(c => !c.archived)
    .filter(c =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const go = (path: string) => {
    onClose();
    setTimeout(() => setLocation(path), 140);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Dim backdrop ── */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-black/65"
            onClick={onClose}
          />

          {/* ── Drawer panel ── */}
          <motion.nav
            key="drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.25, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.velocity.x < -250 || info.offset.x < -70) onClose();
            }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[82%] max-w-[320px] flex flex-col drawer-panel"
          >
            {/* ── Search bar ── */}
            <div
              className="px-4 pb-2"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
            >
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search for chats"
                  className="w-full bg-white/[0.08] border border-white/[0.10] rounded-full pl-9 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/35 outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>

            {/* ── New chat ── */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mr-robot-new-chat'));
                go('/');
              }}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.06] active:bg-white/[0.09] transition-colors"
            >
              <SquarePen className="w-[18px] h-[18px] text-white/70" strokeWidth={1.8} />
              <span className="text-[15px] font-medium text-white/90">New chat</span>
            </button>

            <div className="h-px bg-white/[0.08] mx-4 my-1" />

            {/* ── My stuff (Conversations) ── */}
            <button
              onClick={() => go('/conversations')}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.06] active:bg-white/[0.09] transition-colors"
            >
              <span className="text-[15px] font-semibold text-white/90">My stuff</span>
              <ChevronRight className="w-4 h-4 text-white/25" />
            </button>

            <div className="h-px bg-white/[0.08] mx-4 my-1" />

            {/* ── Chats list ── */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <p className="text-[13px] font-semibold text-white/50 px-5 pt-3 pb-1.5">
                Chats
              </p>

              {chats.length === 0 ? (
                <p className="text-[13px] text-white/30 px-5 py-2">
                  No conversations yet
                </p>
              ) : (
                chats.map(c => (
                  <button
                    key={c.id}
                    onClick={() => go(`/chat/${c.id}`)}
                    className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-white/[0.06] active:bg-white/[0.09] transition-colors text-left group"
                  >
                    <span className="flex-1 text-[14px] text-white/75 truncate leading-snug pr-2">
                      {c.title}
                    </span>
                    {c.pinned && (
                      <Pin className="w-3.5 h-3.5 text-white/35 shrink-0" strokeWidth={1.6} />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* ── Settings at bottom ── */}
            <div className="h-px bg-white/[0.08] mx-4" />
            <button
              onClick={() => go('/settings')}
              className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.06] active:bg-white/[0.09] transition-colors"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
            >
              <Settings className="w-4 h-4 text-white/45" strokeWidth={1.8} />
              <span className="text-[14px] text-white/60">Settings</span>
            </button>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
