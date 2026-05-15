import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { AddModelSheet } from '@/components/ui/AddModelSheet';
import { Check, Sparkles, Plus, Cpu, Globe, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelPickerSheetProps {
  open: boolean;
  onClose: () => void;
}

function providerIcon(type: string) {
  if (type.includes('anthropic')) return <Cpu className="w-5 h-5" />;
  if (type.includes('gemini'))    return <Sparkles className="w-5 h-5" />;
  if (type.includes('local'))     return <Zap className="w-5 h-5" />;
  return <Globe className="w-5 h-5" />;
}

function shortModel(model: string) {
  return model.split('/').pop() ?? model;
}

export function ModelPickerSheet({ open, onClose }: ModelPickerSheetProps) {
  const { providers, settings, updateSettings } = useApp();
  const [addOpen, setAddOpen] = useState(false);

  const ready  = providers.filter(p => p.enabled && p.status === 'connected');
  const isDemo = !settings.activeProviderId || !ready.find(p => p.id === settings.activeProviderId);

  function selectProvider(id: string | undefined) {
    updateSettings({ activeProviderId: id });
    onClose();
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mp-backdrop"
              className="fixed inset-0 z-40 bg-black/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              key="mp-sheet"
              className="fixed bottom-0 left-0 right-0 md:left-60 z-50 rounded-t-[20px] overflow-hidden"
              style={{ background: '#111113' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 34, stiffness: 380, mass: 0.85 }}
            >
              {/* Pull handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-[4px] rounded-full bg-white/20" />
              </div>

              {/* Section label */}
              <p className="px-5 pt-3 pb-1 text-[13px] font-semibold text-white/40 uppercase tracking-widest">
                AI Model
              </p>

              <div className="pb-3">
                {/* Connected provider rows */}
                {ready.map(provider => {
                  const isSelected = settings.activeProviderId === provider.id;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => selectProvider(provider.id)}
                      className={cn(
                        'w-full flex items-center gap-4 px-5 py-[14px] transition-colors',
                        isSelected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04] active:bg-white/[0.08]'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-white/[0.08] text-white/50'
                      )}>
                        {providerIcon(provider.type)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={cn(
                          'text-[16px] font-semibold leading-snug truncate',
                          isSelected ? 'text-white' : 'text-white/85'
                        )}>
                          {provider.name}
                        </p>
                        <p className="text-[13px] text-white/40 truncate mt-0.5 leading-none">
                          {shortModel(provider.selectedModel)}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Demo row */}
                <button
                  onClick={() => selectProvider(undefined)}
                  className={cn(
                    'w-full flex items-center gap-4 px-5 py-[14px] transition-colors',
                    isDemo ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04] active:bg-white/[0.08]'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    isDemo ? 'bg-primary/20 text-primary' : 'bg-white/[0.08] text-white/50'
                  )}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={cn(
                      'text-[16px] font-semibold leading-snug',
                      isDemo ? 'text-white' : 'text-white/85'
                    )}>
                      Demo Mode
                    </p>
                    <p className="text-[13px] text-white/40 mt-0.5 leading-none">
                      No API key required
                    </p>
                  </div>
                  {isDemo && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </button>

                {/* Divider */}
                <div className="mx-5 my-2 border-t border-white/[0.07]" />

                {/* Add AI Model — opens AddModelSheet */}
                <button
                  onClick={() => setAddOpen(true)}
                  className="w-full flex items-center gap-4 px-5 py-[14px] hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center shrink-0 text-white/50">
                    <Plus className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <p className="flex-1 text-left text-[16px] font-medium text-white/60">
                    Add AI Model
                  </p>
                </button>
              </div>

              <div style={{ height: 'env(safe-area-inset-bottom)' }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add model sheet — layered on top */}
      <AddModelSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </>
  );
}
