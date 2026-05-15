import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { AIProviderConfig } from '@/types';
import { testProviderConnection } from '@/lib/ai/aiClient';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft, ChevronRight, Eye, EyeOff,
  Loader2, Check, Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Provider catalogue ─────────────────────────────────────── */
const PROVIDERS = [
  { name: 'OpenAI',      color: '#74AA9C', letter: 'O', desc: 'GPT-4o, GPT-4 Turbo',            type: 'openai-compatible' as const, baseUrl: 'https://api.openai.com/v1',                        models: ['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-3.5-turbo'],                                     placeholder: 'sk-...' },
  { name: 'Anthropic',   color: '#C96442', letter: 'A', desc: 'Claude 3.5 Sonnet & Haiku',       type: 'anthropic'         as const, baseUrl: 'https://api.anthropic.com/v1',                   models: ['claude-3-5-sonnet-20241022','claude-3-5-haiku-20241022','claude-3-opus-20240229'],         placeholder: 'sk-ant-...' },
  { name: 'Google',      color: '#4285F4', letter: 'G', desc: 'Gemini 1.5 Pro & Flash',           type: 'gemini'            as const, baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-1.5-pro','gemini-1.5-flash','gemini-2.0-flash-exp'],                              placeholder: 'AIza...' },
  { name: 'Groq',        color: '#F55036', letter: 'Q', desc: 'Ultra-fast Llama & Mixtral',       type: 'openai-compatible' as const, baseUrl: 'https://api.groq.com/openai/v1',                  models: ['llama-3.3-70b-versatile','llama-3.1-8b-instant','mixtral-8x7b-32768'],                   placeholder: 'gsk_...' },
  { name: 'OpenRouter',  color: '#6366F1', letter: 'R', desc: '100+ models in one API',           type: 'openai-compatible' as const, baseUrl: 'https://openrouter.ai/api/v1',                   models: ['openai/gpt-4o','anthropic/claude-3.5-sonnet','meta-llama/llama-3.1-70b-instruct'],       placeholder: 'sk-or-...' },
  { name: 'Together AI', color: '#0EA5E9', letter: 'T', desc: 'Open-source fine-tunes',           type: 'openai-compatible' as const, baseUrl: 'https://api.together.xyz/v1',                    models: ['meta-llama/Llama-3-70b-chat-hf','mistralai/Mixtral-8x7B-Instruct-v0.1'],                placeholder: 'API key...' },
  { name: 'Mistral',     color: '#FF7000', letter: 'M', desc: 'Mistral Large & Small',            type: 'openai-compatible' as const, baseUrl: 'https://api.mistral.ai/v1',                      models: ['mistral-large-latest','mistral-medium-latest','mistral-small-latest'],                   placeholder: 'API key...' },
  { name: 'DeepSeek',    color: '#1E90FF', letter: 'D', desc: 'DeepSeek Chat & Coder',            type: 'openai-compatible' as const, baseUrl: 'https://api.deepseek.com/v1',                    models: ['deepseek-chat','deepseek-coder','deepseek-reasoner'],                                    placeholder: 'sk-...' },
  { name: 'xAI',         color: '#E0E0E0', letter: 'X', desc: 'Grok Beta',                       type: 'openai-compatible' as const, baseUrl: 'https://api.x.ai/v1',                            models: ['grok-beta','grok-vision-beta'],                                                          placeholder: 'xai-...' },
  { name: 'Perplexity',  color: '#20B2AA', letter: 'P', desc: 'Search-enhanced responses',        type: 'openai-compatible' as const, baseUrl: 'https://api.perplexity.ai',                      models: ['llama-3.1-sonar-large-128k-online','llama-3.1-sonar-small-128k-online'],                placeholder: 'pplx-...' },
  { name: 'Cohere',      color: '#39A0ED', letter: 'C', desc: 'Command R+',                       type: 'openai-compatible' as const, baseUrl: 'https://api.cohere.ai/v1',                       models: ['command-r-plus','command-r','command'],                                                  placeholder: 'API key...' },
];

type ProviderDef = typeof PROVIDERS[number];
type Step = 'list' | 'config';

interface AddModelSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddModelSheet({ open, onClose }: AddModelSheetProps) {
  const [step, setStep]           = useState<Step>('list');
  const [selected, setSelected]   = useState<ProviderDef | null>(null);

  function handleClose() {
    onClose();
    setTimeout(() => { setStep('list'); setSelected(null); }, 350);
  }

  function pickProvider(p: ProviderDef) {
    setSelected(p);
    setStep('config');
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="am-backdrop"
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            key="am-sheet"
            className="fixed bottom-0 left-0 right-0 md:left-60 z-[60] rounded-t-[22px] overflow-hidden flex flex-col"
            style={{ background: '#111113', maxHeight: '82vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 380, mass: 0.85 }}
          >
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-[4px] rounded-full bg-white/20" />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step === 'list' ? (
                <motion.div
                  key="step-list"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col min-h-0"
                >
                  <ProviderList onPick={pickProvider} onClose={handleClose} />
                </motion.div>
              ) : (
                <motion.div
                  key="step-config"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col min-h-0"
                >
                  {selected && (
                    <ConfigForm
                      provider={selected}
                      onBack={() => setStep('list')}
                      onDone={handleClose}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Step 1: Provider list ─────────────────────────────────── */
function ProviderList({ onPick, onClose }: { onPick: (p: ProviderDef) => void; onClose: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-4 shrink-0">
        <p className="text-[17px] font-bold text-white">Add AI Model</p>
        <button
          onClick={onClose}
          className="text-[13px] font-medium text-white/45 hover:text-white/70 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto overscroll-contain">
        {PROVIDERS.map(p => (
          <button
            key={p.name}
            onClick={() => onPick(p)}
            className="w-full flex items-center gap-4 px-5 py-[13px] hover:bg-white/[0.05] active:bg-white/[0.09] transition-colors"
          >
            {/* Colored letter badge */}
            <div
              className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 text-[17px] font-black"
              style={{ background: p.color + '22', color: p.color }}
            >
              {p.letter}
            </div>

            <div className="flex-1 text-left min-w-0">
              <p className="text-[15px] font-semibold text-white/90 leading-snug">{p.name}</p>
              <p className="text-[12px] text-white/38 mt-0.5 truncate">{p.desc}</p>
            </div>

            <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
          </button>
        ))}

        {/* Custom AI — last row */}
        <button
          onClick={() => { setLocation('/ai-models'); onClose(); }}
          className="w-full flex items-center gap-4 px-5 py-[13px] hover:bg-white/[0.05] active:bg-white/[0.09] transition-colors"
        >
          <div className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 bg-white/[0.07]">
            <Settings2 className="w-5 h-5 text-white/45" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[15px] font-semibold text-white/90">Custom AI</p>
            <p className="text-[12px] text-white/38">Local model or custom endpoint</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
        </button>

        <div style={{ height: 'calc(env(safe-area-inset-bottom) + 24px)' }} />
      </div>
    </>
  );
}

/* ── Step 2: Config form ───────────────────────────────────── */
function ConfigForm({
  provider, onBack, onDone,
}: {
  provider: ProviderDef;
  onBack: () => void;
  onDone: () => void;
}) {
  const { addProvider, updateProvider, updateSettings, providers } = useApp();
  const { toast } = useToast();

  const [apiKey,    setApiKey]    = useState('');
  const [showKey,   setShowKey]   = useState(false);
  const [model,     setModel]     = useState(provider.models[0]);
  const [testing,   setTesting]   = useState(false);
  const [connected, setConnected] = useState(false);

  const existing = providers.find(p => p.name === provider.name && p.mode === 'online');

  async function handleConnect() {
    if (!apiKey.trim()) { toast({ title: 'Enter your API key', variant: 'destructive' }); return; }
    setTesting(true);

    const cfg: AIProviderConfig = {
      id: existing?.id || crypto.randomUUID(),
      name: provider.name,
      type: provider.type,
      mode: 'online',
      apiKey: apiKey.trim(),
      baseUrl: provider.baseUrl,
      selectedModel: model,
      customModels: [],
      enabled: true,
      supportsStreaming: true,
      supportsSystemPrompt: true,
      status: 'testing',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing) updateProvider(existing.id, cfg);
    else addProvider(cfg);

    const result = await testProviderConnection(cfg);
    const finalCfg = { ...cfg, status: result.success ? 'connected' as const : 'error' as const };

    if (existing) updateProvider(existing.id, finalCfg);
    else updateProvider(cfg.id, finalCfg);

    setTesting(false);

    if (result.success) {
      setConnected(true);
      updateSettings({ activeProviderId: cfg.id });
      toast({ title: `${provider.name} connected!`, description: result.message });
      setTimeout(onDone, 900);
    } else {
      toast({ title: 'Connection failed', description: result.message, variant: 'destructive' });
    }
  }

  function handleSaveOnly() {
    if (!apiKey.trim()) { toast({ title: 'Enter your API key', variant: 'destructive' }); return; }
    const cfg: AIProviderConfig = {
      id: existing?.id || crypto.randomUUID(),
      name: provider.name, type: provider.type, mode: 'online',
      apiKey: apiKey.trim(), baseUrl: provider.baseUrl, selectedModel: model,
      customModels: [], enabled: true, supportsStreaming: true, supportsSystemPrompt: true,
      status: 'not_configured',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existing) updateProvider(existing.id, cfg);
    else addProvider(cfg);
    toast({ title: `${provider.name} key saved` });
    onDone();
  }

  return (
    <>
      {/* Header with back */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-4 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.14] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white/70" />
        </button>
        {/* Provider badge */}
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[16px] font-black"
          style={{ background: provider.color + '22', color: provider.color }}
        >
          {provider.letter}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-white leading-snug">{provider.name}</p>
          <p className="text-[11px] text-white/38 truncate">{provider.desc}</p>
        </div>
      </div>

      {/* Form */}
      <div className="overflow-y-auto overscroll-contain px-5 space-y-4">

        {/* API Key */}
        <div>
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">API Key</p>
          <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.07] px-4 py-3.5">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={provider.placeholder}
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 outline-none font-mono"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => setShowKey(v => !v)}
              className="text-white/35 hover:text-white/60 transition-colors shrink-0"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Model selector */}
        <div>
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">Model</p>
          <div className="flex flex-wrap gap-2">
            {provider.models.map(m => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={cn(
                  'px-3.5 py-2 rounded-full text-[12px] font-semibold border transition-all',
                  model === m
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/[0.05] border-white/[0.08] text-white/45 hover:bg-white/[0.09]'
                )}
              >
                {m.split('/').pop()}
              </button>
            ))}
          </div>
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={testing || connected || !apiKey.trim()}
          className={cn(
            'w-full py-[15px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all',
            connected
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white text-black hover:opacity-90 disabled:opacity-40'
          )}
        >
          {testing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Testing…</>
          ) : connected ? (
            <><Check className="w-4 h-4" /> Connected!</>
          ) : (
            'Test & Connect'
          )}
        </button>

        {/* Save without testing */}
        {!connected && (
          <button
            onClick={handleSaveOnly}
            className="w-full text-center text-[13px] text-white/35 hover:text-white/55 transition-colors py-1"
          >
            Save without testing
          </button>
        )}
      </div>

      <div style={{ height: 'calc(env(safe-area-inset-bottom) + 32px)' }} />
    </>
  );
}
