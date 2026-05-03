import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { useState } from 'react';
import {
  Search, Plus, ChevronRight, Pin, Settings,
  Brain, Zap, MessagesSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerNavProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  { label: 'Conversations', path: '/conversations', icon: MessagesSquare },
  { label: 'Memory',        path: '/memory',        icon: Brain           },
  { label: 'Skills',        path: '/skills',        icon: Zap             },
];

export function DrawerNav({ open, onClose }: DrawerNavProps) {
  const { conversations } = useApp();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  const chats = conversations
    .filter(c => !c.archived)
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()))
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
            className="fixed left-0 top-0 bottom-0 z-50 w-[82%] max-w-[310px] flex flex-col drawer-panel"
          >
            {/* ── Search ── */}
            <div
              className="px-4 pb-3"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
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
              onClick={() => go('/chat')}
              className="flex items-center gap-3 px-5 py-3 text-white hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white/80" strokeWidth={2} />
              </div>
              <span className="text-sm font-medium text-white/90">New chat</span>
            </button>

            <div className="h-px bg-white/[0.08] mx-4 my-1" />

            {/* ── Nav sections ── */}
            {SECTIONS.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className="flex items-center justify-between px-5 py-3.5 text-white hover:bg-white/[0.06] transition-colors"
              >
                <span className="text-sm font-semibold text-white/90">{label}</span>
                <ChevronRight className="w-4 h-4 text-white/25" />
              </button>
            ))}

            <div className="h-px bg-white/[0.08] mx-4 my-1" />

            {/* ── Chats list ── */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 px-5 pt-3 pb-2">
                Chats
              </p>
              {chats.length === 0 ? (
                <p className="text-xs text-white/25 px-5 py-2">No conversations yet</p>
              ) : (
                chats.map(c => (
                  <button
                    key={c.id}
                    onClick={() => go(`/chat/${c.id}`)}
                    className="w-full flex items-center gap-2.5 px-5 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
                  >
                    {c.pinned && <Pin className="w-3 h-3 text-white/35 shrink-0" />}
                    <span className="flex-1 text-sm text-white/70 truncate leading-snug">
                      {c.title}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* ── Bottom settings ── */}
            <div className="h-px bg-white/[0.08] mx-4" />
            <button
              onClick={() => go('/settings')}
              className="flex items-center gap-3 px-5 py-4 text-white hover:bg-white/[0.06] transition-colors"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
            >
              <Settings className="w-4 h-4 text-white/45" />
              <span className="text-sm text-white/70">Settings</span>
            </button>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
