import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { Paperclip, Image as ImageIcon, Camera } from 'lucide-react';

interface AttachmentMenuProps {
  open: boolean;
  onClose: () => void;
  onFile: (file: File) => void;
  /** Distance in px from the bottom of the viewport (default 90) */
  bottomOffset?: number;
}

const ITEMS = [
  { label: 'Files',  icon: Paperclip,  accept: '*/*',     capture: undefined           },
  { label: 'Photos', icon: ImageIcon,  accept: 'image/*', capture: undefined           },
  { label: 'Camera', icon: Camera,     accept: 'image/*', capture: 'environment' as const },
];

export function AttachmentMenu({
  open,
  onClose,
  onFile,
  bottomOffset = 90,
}: AttachmentMenuProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const triggerFile = (accept: string, capture?: string) => {
    if (!fileRef.current) return;
    fileRef.current.accept = accept;
    if (capture) fileRef.current.setAttribute('capture', capture);
    else         fileRef.current.removeAttribute('capture');
    fileRef.current.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onFile(file); onClose(); }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" className="hidden" onChange={handleChange} />

      <AnimatePresence>
        {open && (
          <>
            {/* Invisible backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Floating menu */}
            <motion.div
              key="attach-menu"
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={   { opacity: 0, scale: 0.85, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              className="fixed left-4 z-50 attachment-popup rounded-2xl overflow-hidden"
              style={{
                bottom: bottomOffset,
                minWidth: 190,
                transformOrigin: 'bottom left',
              }}
            >
              {ITEMS.map(({ label, icon: Icon, accept, capture }, i) => (
                <div key={label}>
                  {i > 0 && <div className="h-px bg-white/[0.07]" />}
                  <button
                    onClick={() => triggerFile(accept, capture)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.07] active:bg-white/[0.11] transition-colors"
                  >
                    <span className="text-sm font-medium text-white/88">{label}</span>
                    <Icon className="w-4 h-4 text-white/50 ml-8 shrink-0" strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
