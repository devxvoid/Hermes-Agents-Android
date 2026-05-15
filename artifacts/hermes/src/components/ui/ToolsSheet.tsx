import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon, Music2, Layout, SearchCheck, BookOpen,
} from 'lucide-react';

export interface Tool {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: 'New';
  prompt: string;
}

const TOOLS: Tool[] = [
  {
    id: 'create-image',
    icon: <ImageIcon className="w-[22px] h-[22px]" strokeWidth={1.6} />,
    label: 'Create image',
    badge: 'New',
    prompt: 'Create an image of ',
  },
  {
    id: 'create-music',
    icon: <Music2 className="w-[22px] h-[22px]" strokeWidth={1.6} />,
    label: 'Create music',
    badge: 'New',
    prompt: 'Create a music track that sounds like ',
  },
  {
    id: 'canvas',
    icon: <Layout className="w-[22px] h-[22px]" strokeWidth={1.6} />,
    label: 'Canvas',
    prompt: 'Help me brainstorm and lay out ideas on a canvas about ',
  },
  {
    id: 'deep-research',
    icon: <SearchCheck className="w-[22px] h-[22px]" strokeWidth={1.6} />,
    label: 'Deep research',
    prompt: 'Do a deep research report on ',
  },
  {
    id: 'guided-learning',
    icon: <BookOpen className="w-[22px] h-[22px]" strokeWidth={1.6} />,
    label: 'Guided learning',
    prompt: 'Guide me step-by-step to learn ',
  },
];

interface ToolsSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
}

export function ToolsSheet({ open, onClose, onSelect }: ToolsSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tools-backdrop"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="tools-sheet"
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
            style={{ background: '#1c1c1e' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
          >
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-[4px] rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <p className="px-5 pt-3 pb-4 text-[15px] font-semibold text-white/90 tracking-wide">
              Tools
            </p>

            {/* Tool rows */}
            <div className="pb-[calc(env(safe-area-inset-bottom)+20px)]">
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => { onSelect(tool.prompt); onClose(); }}
                  className="w-full flex items-center gap-4 px-5 py-[14px] hover:bg-white/[0.06] active:bg-white/[0.10] transition-colors"
                >
                  <span className="text-white/75 shrink-0">{tool.icon}</span>
                  <span className="flex-1 text-left text-[16px] font-normal text-white/90">
                    {tool.label}
                  </span>
                  {tool.badge && (
                    <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-full bg-blue-600 text-white leading-none">
                      {tool.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
