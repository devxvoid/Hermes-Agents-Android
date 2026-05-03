import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { AIProviderConfig } from '@/types';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { testProviderConnection } from '@/lib/ai/aiClient';
import { testLocalRuntimeConnection, fetchLocalModels } from '@/lib/ai/localRuntimeClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  ChevronLeft, Plus, Trash2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle,
  Loader2, FolderOpen, FileArchive, Download, Copy, Check, Terminal, Server,
  RefreshCw, Cpu, ChevronRight, ChevronDown, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Constants ──────────────────────────────────────────────── */
const ONLINE_PROVIDERS = [
  { name: 'OpenAI',      type: 'openai-compatible' as const, baseUrl: 'https://api.openai.com/v1',             models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],               placeholder: 'sk-...' },
  { name: 'Anthropic',   type: 'anthropic'         as const, baseUrl: 'https://api.anthropic.com/v1',          models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'], placeholder: 'sk-ant-...' },
  { name: 'Google',      type: 'gemini'            as const, baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'], placeholder: 'AIza...' },
  { name: 'Groq',        type: 'openai-compatible' as const, baseUrl: 'https://api.groq.com/openai/v1',        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'], placeholder: 'gsk_...' },
  { name: 'OpenRouter',  type: 'openai-compatible' as const, baseUrl: 'https://openrouter.ai/api/v1',          models: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.1-70b-instruct'], placeholder: 'sk-or-...' },
  { name: 'Together AI', type: 'openai-compatible' as const, baseUrl: 'https://api.together.xyz/v1',           models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'], placeholder: 'API key...' },
  { name: 'Mistral',     type: 'openai-compatible' as const, baseUrl: 'https://api.mistral.ai/v1',             models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'], placeholder: 'API key...' },
  { name: 'DeepSeek',    type: 'openai-compatible' as const, baseUrl: 'https://api.deepseek.com/v1',           models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'], placeholder: 'sk-...' },
  { name: 'xAI',         type: 'openai-compatible' as const, baseUrl: 'https://api.x.ai/v1',                  models: ['grok-beta', 'grok-vision-beta'], placeholder: 'xai-...' },
  { name: 'Perplexity',  type: 'openai-compatible' as const, baseUrl: 'https://api.perplexity.ai',             models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'], placeholder: 'pplx-...' },
  { name: 'Cohere',      type: 'openai-compatible' as const, baseUrl: 'https://api.cohere.ai/v1',              models: ['command-r-plus', 'command-r', 'command'], placeholder: 'API key...' },
];

const LOCAL_RUNTIMES = [
  { name: 'Ollama',     endpoint: 'http://localhost:11434', apiFormat: 'ollama-native' as const },
  { name: 'LM Studio',  endpoint: 'http://localhost:1234/v1', apiFormat: 'openai-compatible' as const },
  { name: 'GPT4All',    endpoint: 'http://localhost:4891/v1', apiFormat: 'openai-compatible' as const },
  { name: 'vLLM',       endpoint: 'http://localhost:8000/v1', apiFormat: 'openai-compatible' as const },
  { name: 'llama.cpp',  endpoint: 'http://localhost:8080/v1', apiFormat: 'openai-compatible' as const },
];

const DOWNLOAD_CATALOG = [
  {
    name: 'Llama 3.2 3B',    modelId: 'llama3.2:3b',    size: '~1.9 GB', ram: '4 GB',
    hfUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    ollamaCmd: 'ollama pull llama3.2:3b', tags: ['Fast', 'Mobile-friendly'],
  },
  {
    name: 'Llama 3.1 8B',    modelId: 'llama3.1:8b',    size: '~4.9 GB', ram: '8 GB',
    hfUrl: 'https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
    ollamaCmd: 'ollama pull llama3.1:8b', tags: ['Balanced'],
  },
  {
    name: 'Gemma 3 4B',      modelId: 'gemma3:4b',      size: '~2.5 GB', ram: '4 GB',
    hfUrl: 'https://huggingface.co/bartowski/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q4_K_M.gguf',
    ollamaCmd: 'ollama pull gemma3:4b', tags: ['Google', 'Fast'],
  },
  {
    name: 'Mistral 7B',      modelId: 'mistral:7b',     size: '~4.1 GB', ram: '8 GB',
    hfUrl: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
    ollamaCmd: 'ollama pull mistral:7b', tags: ['Popular'],
  },
  {
    name: 'Phi-3.5 Mini',    modelId: 'phi3.5:3.8b',    size: '~2.2 GB', ram: '4 GB',
    hfUrl: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
    ollamaCmd: 'ollama pull phi3.5', tags: ['Microsoft', 'Compact'],
  },
  {
    name: 'Qwen2.5 7B',      modelId: 'qwen2.5:7b',     size: '~4.5 GB', ram: '8 GB',
    hfUrl: 'https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf',
    ollamaCmd: 'ollama pull qwen2.5:7b', tags: ['Multilingual'],
  },
  {
    name: 'TinyLlama 1.1B',  modelId: 'tinyllama:1.1b', size: '~638 MB', ram: '2 GB',
    hfUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    ollamaCmd: 'ollama pull tinyllama', tags: ['Ultra-compact'],
  },
  {
    name: 'DeepSeek Coder 6.7B', modelId: 'deepseek-coder:6.7b', size: '~4.0 GB', ram: '8 GB',
    hfUrl: 'https://huggingface.co/TheBloke/deepseek-coder-6.7B-instruct-GGUF/resolve/main/deepseek-coder-6.7b-instruct.Q4_K_M.gguf',
    ollamaCmd: 'ollama pull deepseek-coder:6.7b', tags: ['Code'],
  },
];

/* ── Helpers ────────────────────────────────────────────────── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function StatusDot({ status }: { status: AIProviderConfig['status'] }) {
  if (status === 'connected')    return <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />;
  if (status === 'error')        return <span className="w-2 h-2 rounded-full bg-red-400" />;
  if (status === 'testing')      return <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />;
  return <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />;
}

/* ── Section label ──────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 px-1 pt-5 pb-1.5 first:pt-0">
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADD KEY SHEET (bottom panel)
═══════════════════════════════════════════════════════════ */
function AddKeyPanel({ onClose }: { onClose: () => void }) {
  const { addProvider, updateProvider, providers } = useApp();
  const { toast } = useToast();
  const [provider, setProvider] = useState(ONLINE_PROVIDERS[0].name);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(ONLINE_PROVIDERS[0].models[0]);
  const [isTesting, setIsTesting] = useState(false);

  const preset = ONLINE_PROVIDERS.find(p => p.name === provider) || ONLINE_PROVIDERS[0];

  const save = async () => {
    if (!apiKey.trim()) { toast({ title: 'Enter your API key', variant: 'destructive' }); return; }
    const existing = providers.find(p => p.name === provider && p.mode === 'online');
    const config: AIProviderConfig = {
      id: existing?.id || crypto.randomUUID(),
      name: provider,
      type: preset.type,
      mode: 'online',
      apiKey: apiKey.trim(),
      baseUrl: preset.baseUrl,
      selectedModel: model,
      customModels: [],
      enabled: true,
      supportsStreaming: true,
      supportsSystemPrompt: true,
      status: 'not_configured',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existing) updateProvider(existing.id, config);
    else addProvider(config);
    toast({ title: `${provider} key saved` });
    onClose();
  };

  const testAndSave = async () => {
    if (!apiKey.trim()) return;
    setIsTesting(true);
    const existing = providers.find(p => p.name === provider && p.mode === 'online');
    const cfg: AIProviderConfig = {
      id: existing?.id || crypto.randomUUID(),
      name: provider, type: preset.type, mode: 'online',
      apiKey: apiKey.trim(), baseUrl: preset.baseUrl, selectedModel: model,
      customModels: [], enabled: true, supportsStreaming: true, supportsSystemPrompt: true,
      status: 'testing', createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (existing) updateProvider(existing.id, cfg);
    else addProvider(cfg);
    const result = await testProviderConnection(cfg);
    const finalCfg = { ...cfg, status: result.success ? 'connected' as const : 'error' as const };
    if (existing) updateProvider(existing.id, finalCfg);
    else updateProvider(cfg.id, finalCfg);
    toast({ title: result.success ? `${provider} connected!` : 'Connection failed', description: result.message, variant: result.success ? 'default' : 'destructive' });
    setIsTesting(false);
    if (result.success) onClose();
  };

  return (
    <div className="glass-strong rounded-t-3xl p-5 space-y-4 border-t border-x border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base">Add API Key</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs bg-muted/50 rounded-lg px-2.5 py-1">Cancel</button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Provider</Label>
        <Select value={provider} onValueChange={v => { setProvider(v); const p = ONLINE_PROVIDERS.find(x => x.name === v); if (p) setModel(p.models[0]); }}>
          <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ONLINE_PROVIDERS.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">API Key</Label>
        <div className="relative">
          <Input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={preset.placeholder}
            className="pr-10 font-mono text-sm bg-muted/30"
            data-testid="input-new-api-key"
          />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Model</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
          <SelectContent>
            {preset.models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={save} className="flex-1" disabled={!apiKey.trim()}>Save</Button>
        <Button onClick={testAndSave} className="flex-1 glow-primary" disabled={!apiKey.trim() || isTesting} data-testid="btn-test-and-save">
          {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test & Activate'}
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SELF-HOSTED FORM
═══════════════════════════════════════════════════════════ */
function SelfHostedForm() {
  const { addProvider, updateProvider, providers, settings, updateSettings } = useApp();
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState('');
  const [modelId, setModelId] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [runtimeName, setRuntimeName] = useState('Ollama');
  const [isTesting, setIsTesting] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);

  const preset = LOCAL_RUNTIMES.find(r => r.name === runtimeName) || LOCAL_RUNTIMES[0];

  const fillPreset = (name: string) => {
    setRuntimeName(name);
    const rt = LOCAL_RUNTIMES.find(r => r.name === name);
    if (rt) setBaseUrl(rt.endpoint);
  };

  const fetchModels = async () => {
    const cfg = { id: 'tmp', name: runtimeName, type: 'local-openai-compatible' as const, mode: 'local' as const, apiKey: bearerToken, baseUrl: baseUrl || preset.endpoint, selectedModel: '', customModels: [], enabled: true, supportsStreaming: false, supportsSystemPrompt: true, status: 'not_configured' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const models = await fetchLocalModels(cfg);
    if (models.length > 0) { setFetchedModels(models); if (!modelId) setModelId(models[0]); toast({ title: `Found ${models.length} models` }); }
    else toast({ title: 'No models found. Is the runtime running?', variant: 'destructive' });
  };

  const saveAndActivate = async () => {
    const url = baseUrl.trim() || preset.endpoint;
    const mId = modelId.trim();
    if (!mId) { toast({ title: 'Enter a model ID', variant: 'destructive' }); return; }
    setIsTesting(true);
    const existing = providers.find(p => p.name === runtimeName && p.mode === 'local');
    const config: AIProviderConfig = {
      id: existing?.id || crypto.randomUUID(),
      name: runtimeName, type: 'local-openai-compatible', mode: 'local',
      apiKey: bearerToken.trim(), baseUrl: url, selectedModel: mId,
      customModels: fetchedModels, enabled: true, supportsStreaming: false,
      supportsSystemPrompt: true, status: 'testing',
      createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (existing) updateProvider(existing.id, config);
    else addProvider(config);

    const result = await testLocalRuntimeConnection(config);
    const final = { ...config, status: result.success ? 'connected' as const : 'error' as const };
    if (existing) updateProvider(existing.id, final);
    else updateProvider(config.id, final);

    if (result.success) {
      updateSettings({ activeProviderId: final.id });
      toast({ title: `${runtimeName} connected and set active!` });
    } else {
      toast({ title: 'Connection failed', description: result.message, variant: 'destructive' });
    }
    setIsTesting(false);
  };

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        For self-hosted runtimes (Ollama, LM Studio, vLLM). Only use this for local servers — add cloud provider keys in YOUR KEYS above.
      </p>

      {/* Quick-fill runtime buttons */}
      <div className="flex flex-wrap gap-1.5">
        {LOCAL_RUNTIMES.map(rt => (
          <button
            key={rt.name}
            onClick={() => fillPreset(rt.name)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-lg border transition-all font-medium',
              runtimeName === rt.name
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {rt.name}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Base URL (include /v1)</Label>
        <Input
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
          placeholder={preset.endpoint}
          className="font-mono text-xs bg-muted/30"
          data-testid="input-self-hosted-url"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Model ID</Label>
          <button onClick={fetchModels} className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors">
            <RefreshCw className="w-3 h-3" />Fetch models
          </button>
        </div>
        {fetchedModels.length > 0 ? (
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger className="bg-muted/30 text-sm"><SelectValue placeholder="Select model" /></SelectTrigger>
            <SelectContent>{fetchedModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input value={modelId} onChange={e => setModelId(e.target.value)} placeholder="llama3.2:3b" className="font-mono text-xs bg-muted/30" data-testid="input-self-hosted-model" />
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Bearer Token (optional)</Label>
        <Input value={bearerToken} onChange={e => setBearerToken(e.target.value)} type="password" placeholder="Only if your server requires auth" className="font-mono text-xs bg-muted/30" />
      </div>

      <Button onClick={saveAndActivate} disabled={isTesting} className="w-full glow-primary" data-testid="btn-save-activate-self-hosted">
        {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Server className="w-4 h-4 mr-2" />}
        {isTesting ? 'Testing connection…' : 'Save & Activate'}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ON-DEVICE SECTION
═══════════════════════════════════════════════════════════ */
function OnDeviceSection() {
  const { addProvider, providers, updateSettings, settings, deleteProvider } = useApp();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [importRuntime, setImportRuntime] = useState('Ollama');
  const [importModelName, setImportModelName] = useState('');
  const [expanded, setExpanded] = useState(false);

  const importedProviders = providers.filter(p => p.mode === 'local' && p.name.startsWith('[Imported]'));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile({ name: file.name, size: file.size });
    setImportModelName(file.name.replace(/\.(gguf|bin|safetensors)$/i, '').toLowerCase().replace(/\s+/g, '-'));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const registerModel = () => {
    if (!importModelName.trim()) return;
    const rt = LOCAL_RUNTIMES.find(r => r.name === importRuntime);
    const provider: AIProviderConfig = {
      id: crypto.randomUUID(), name: `[Imported] ${importModelName.trim()}`, type: 'local-openai-compatible',
      mode: 'local', apiKey: '', baseUrl: rt?.endpoint || 'http://localhost:11434',
      selectedModel: importModelName.trim(), customModels: [], enabled: true, supportsStreaming: false,
      supportsSystemPrompt: true, status: 'not_configured', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addProvider(provider);
    toast({ title: 'Model registered!', description: `Use "Self-Hosted" section to test the connection.` });
    setSelectedFile(null); setImportModelName('');
  };

  return (
    <div className="space-y-2">
      {/* Registered imported models */}
      {importedProviders.map(p => (
        <div key={p.id} className="glass-card rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
            <FileArchive className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{p.name.replace('[Imported] ', '')}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{p.selectedModel}</p>
          </div>
          <StatusDot status={p.status} />
          {p.status === 'connected' && (
            <button onClick={() => { updateSettings({ activeProviderId: p.id }); toast({ title: 'Set as active' }); }}
              className={cn('text-xs px-2.5 py-1 rounded-full border shrink-0', settings.activeProviderId === p.id ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground')}>
              {settings.activeProviderId === p.id ? 'Active' : 'Set Active'}
            </button>
          )}
          <button onClick={() => deleteProvider(p.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Import from device */}
      <input ref={fileInputRef} type="file" accept=".gguf,.bin,.safetensors" onChange={handleFileSelect} className="hidden" />

      {!selectedFile ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all group"
          data-testid="btn-browse-model-file"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15">
            <FolderOpen className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Import from Device Storage</p>
            <p className="text-xs text-muted-foreground mt-0.5">.gguf · .bin · .safetensors</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </button>
      ) : (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <FileArchive className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-emerald-400 truncate">{selectedFile.name}</p>
              <p className="text-[11px] text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-muted-foreground/50 hover:text-foreground">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Model Name</Label>
              <Input value={importModelName} onChange={e => setImportModelName(e.target.value)} className="font-mono text-xs bg-muted/30 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Runtime</Label>
              <Select value={importRuntime} onValueChange={setImportRuntime}>
                <SelectTrigger className="text-xs h-9 bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>{LOCAL_RUNTIMES.map(r => <SelectItem key={r.name} value={r.name} className="text-xs">{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 text-xs">Change</Button>
            <Button size="sm" onClick={registerModel} disabled={!importModelName.trim()} className="flex-1 text-xs glow-primary" data-testid="btn-register-model">Register</Button>
          </div>
        </div>
      )}

      {/* Browse & Download toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500/12 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">Browse & Download Models</p>
          <p className="text-xs text-muted-foreground mt-0.5">Direct GGUF downloads + Ollama commands</p>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground/40" /> : <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
      </button>

      {expanded && <DownloadCatalog />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DOWNLOAD CATALOG
═══════════════════════════════════════════════════════════ */
function DownloadCatalog() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCmd = async (modelId: string, cmd: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopiedId(modelId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied!', description: cmd });
  };

  return (
    <div className="space-y-2.5">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-400">
        <Terminal className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Copy the Ollama command to download a model, or use the direct GGUF link to download the file to your device.</span>
      </div>
      {DOWNLOAD_CATALOG.map(m => (
        <div key={m.modelId} className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{m.name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {m.tags.map(t => <span key={t} className="text-[10px] bg-primary/8 border border-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">{t}</span>)}
                <span className="text-[10px] text-muted-foreground">RAM: {m.ram}</span>
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted/40 border border-border px-2 py-0.5 rounded-lg shrink-0">{m.size}</span>
          </div>

          {/* Ollama command row */}
          <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
            <code className="flex-1 text-[11px] font-mono text-muted-foreground truncate">{m.ollamaCmd}</code>
            <button onClick={() => copyCmd(m.modelId, m.ollamaCmd)} className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors" title="Copy command">
              {copiedId === m.modelId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Direct download */}
          <a
            href={m.hfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl px-3 py-2.5 transition-all group"
            data-testid={`btn-download-${m.modelId}`}
          >
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Download GGUF (HuggingFace)</span>
            </div>
            <Link2 className="w-3 h-3 text-primary/50 group-hover:text-primary transition-colors" />
          </a>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN AI MODELS PAGE
═══════════════════════════════════════════════════════════ */
function AIModelsContent() {
  const { providers, settings, updateSettings, deleteProvider } = useApp();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAddKey, setShowAddKey] = useState(false);

  const activeProvider = providers.find(p => p.id === settings.activeProviderId && p.enabled);

  // Cloud providers that have an API key configured
  const keyProviders = providers.filter(p => p.mode === 'online' && p.apiKey);

  // All models for the MODEL selector
  const allOnlineModels = keyProviders.flatMap(p =>
    [p.selectedModel, ...p.customModels].filter(Boolean).map(m => ({ label: `${p.name} / ${m}`, providerId: p.id, model: m }))
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-28 md:pb-10 space-y-0.5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setLocation('/settings')} className="w-8 h-8 rounded-xl glass-card flex items-center justify-center hover:border-primary/30 transition-all" data-testid="btn-back-settings">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-foreground">AI Provider</h1>
          <p className="text-xs text-muted-foreground">Configure models and runtime</p>
        </div>
      </div>

      {/* ── Active model ── */}
      <SectionLabel>Active</SectionLabel>
      {activeProvider ? (
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-accent/30 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm">{activeProvider.name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{activeProvider.selectedModel}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <StatusDot status={activeProvider.status} />
              <span className={cn('text-xs font-semibold', activeProvider.status === 'connected' ? 'text-emerald-400' : 'text-muted-foreground')}>
                {activeProvider.status === 'connected' ? 'Connected' : activeProvider.status}
              </span>
            </div>
            <span className={cn('text-[10px] font-medium', activeProvider.mode === 'local' ? 'text-cyan-400' : 'text-primary/70')}>
              {activeProvider.mode === 'local' ? 'Local' : 'Online'}
            </span>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3 border-dashed border-amber-500/20 bg-amber-500/5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400">No active model</p>
            <p className="text-xs text-muted-foreground">Add a key below or configure self-hosted</p>
          </div>
        </div>
      )}

      {/* ── YOUR KEYS ── */}
      <SectionLabel>Your Keys</SectionLabel>
      <div className="space-y-2">
        {keyProviders.length === 0 && (
          <p className="text-xs text-muted-foreground/60 px-1">No API keys saved yet.</p>
        )}
        {keyProviders.map(p => (
          <div key={p.id} className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/12 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-black text-amber-400">{p.name.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{'•'.repeat(8)}{p.apiKey?.slice(-4)}</p>
            </div>
            <StatusDot status={p.status} />
            {p.status === 'connected' && (
              <button
                onClick={() => { updateSettings({ activeProviderId: p.id, activeModelId: p.selectedModel }); toast({ title: `${p.name} set active` }); }}
                className={cn('text-xs px-2.5 py-1 rounded-full border shrink-0 transition-all', settings.activeProviderId === p.id ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-primary/30')}
              >
                {settings.activeProviderId === p.id ? 'Active' : 'Set Active'}
              </button>
            )}
            <button onClick={() => deleteProvider(p.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0" title="Remove">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* + Add Key */}
        {!showAddKey ? (
          <button
            onClick={() => setShowAddKey(true)}
            className="w-full glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:border-primary/30 transition-all group"
            data-testid="btn-add-key"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary">+ Add Key</span>
          </button>
        ) : (
          <AddKeyPanel onClose={() => setShowAddKey(false)} />
        )}
      </div>

      {/* ── ON-DEVICE ── */}
      <SectionLabel>On-Device</SectionLabel>
      <OnDeviceSection />

      {/* ── SELF-HOSTED ── */}
      <SectionLabel>Self-Hosted</SectionLabel>
      <SelfHostedForm />

      {/* ── MODEL SELECTOR ── */}
      {allOnlineModels.length > 0 && (
        <>
          <SectionLabel>Model</SectionLabel>
          <div className="glass-card rounded-2xl p-4 space-y-2">
            <Label className="text-xs text-muted-foreground">Active Model</Label>
            <Select
              value={activeProvider ? `${activeProvider.id}::${activeProvider.selectedModel}` : ''}
              onValueChange={val => {
                const [providerId, model] = val.split('::');
                updateSettings({ activeProviderId: providerId, activeModelId: model });
                toast({ title: 'Active model updated' });
              }}
            >
              <SelectTrigger className="bg-muted/30" data-testid="select-active-model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {allOnlineModels.map(({ label, providerId, model }) => (
                  <SelectItem key={`${providerId}::${model}`} value={`${providerId}::${model}`}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}

export default function AIModels() {
  return (
    <ErrorBoundary variant="ai-models">
      <AIModelsContent />
    </ErrorBoundary>
  );
}
