import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { AIProviderConfig } from '@/types';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { testProviderConnection, fetchProviderModels } from '@/lib/ai/aiClient';
import { testLocalRuntimeConnection, fetchLocalModels } from '@/lib/ai/localRuntimeClient';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, RefreshCw, Loader2, Plus, Cpu, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, FolderOpen, FileArchive, Download, Copy, Check, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const ONLINE_PROVIDERS = [
  { name: 'OpenAI', type: 'openai-compatible' as const, baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'], description: 'GPT-4o, GPT-4 and GPT-3.5 models' },
  { name: 'Anthropic', type: 'anthropic' as const, baseUrl: 'https://api.anthropic.com/v1', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'], description: 'Claude 3.5, Claude 3 Opus and Haiku' },
  { name: 'Google Gemini', type: 'gemini' as const, baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-pro'], description: 'Gemini 1.5 Pro, Flash and experimental' },
  { name: 'Groq', type: 'openai-compatible' as const, baseUrl: 'https://api.groq.com/openai/v1', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'], description: 'Ultra-fast inference' },
  { name: 'Together AI', type: 'openai-compatible' as const, baseUrl: 'https://api.together.xyz/v1', models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1', 'google/gemma-2-27b-it'], description: 'Open-source models at scale' },
  { name: 'OpenRouter', type: 'openai-compatible' as const, baseUrl: 'https://openrouter.ai/api/v1', models: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5', 'meta-llama/llama-3.1-70b-instruct'], description: 'Access 200+ models via one API' },
  { name: 'Mistral AI', type: 'openai-compatible' as const, baseUrl: 'https://api.mistral.ai/v1', models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mixtral-8x22b'], description: 'European-made efficient models' },
  { name: 'Perplexity', type: 'openai-compatible' as const, baseUrl: 'https://api.perplexity.ai', models: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online', 'llama-3.1-70b-instruct'], description: 'Search-grounded AI responses' },
  { name: 'Cohere', type: 'openai-compatible' as const, baseUrl: 'https://api.cohere.ai/v1', models: ['command-r-plus', 'command-r', 'command'], description: 'Enterprise-grade language models' },
  { name: 'DeepSeek', type: 'openai-compatible' as const, baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'], description: 'High-performance open-source models' },
  { name: 'xAI', type: 'openai-compatible' as const, baseUrl: 'https://api.x.ai/v1', models: ['grok-beta', 'grok-vision-beta'], description: 'Grok models from xAI' },
  { name: 'Custom Endpoint', type: 'openai-compatible' as const, baseUrl: '', models: [], description: 'Any OpenAI-compatible endpoint' },
];

const LOCAL_RUNTIMES = [
  { name: 'Ollama', endpoint: 'http://localhost:11434', apiFormat: 'ollama-native' as const, description: 'Run models locally with Ollama' },
  { name: 'LM Studio', endpoint: 'http://localhost:1234/v1', apiFormat: 'openai-compatible' as const, description: 'LM Studio local server' },
  { name: 'GPT4All', endpoint: 'http://localhost:4891/v1', apiFormat: 'openai-compatible' as const, description: 'GPT4All local server' },
  { name: 'vLLM', endpoint: 'http://localhost:8000/v1', apiFormat: 'openai-compatible' as const, description: 'High-throughput inference server' },
  { name: 'llama.cpp', endpoint: 'http://localhost:8080/v1', apiFormat: 'openai-compatible' as const, description: 'llama.cpp server with API' },
  { name: 'MLC LLM', endpoint: 'http://localhost:8080/v1', apiFormat: 'openai-compatible' as const, description: 'MLC LLM local runtime' },
  { name: 'Custom', endpoint: '', apiFormat: 'openai-compatible' as const, description: 'Custom local endpoint' },
];

const LOCAL_MODEL_CATALOG = [
  { name: 'Llama 3.2 3B', family: 'Llama', modelId: 'llama3.2:3b', paramSize: '3B', format: 'GGUF', estSize: '~2GB', minRam: '4GB', runtimes: ['Ollama', 'llama.cpp', 'LM Studio'] },
  { name: 'Llama 3.1 8B', family: 'Llama', modelId: 'llama3.1:8b', paramSize: '8B', format: 'GGUF', estSize: '~5GB', minRam: '8GB', runtimes: ['Ollama', 'llama.cpp', 'LM Studio', 'vLLM'] },
  { name: 'Llama 3.1 70B', family: 'Llama', modelId: 'llama3.1:70b', paramSize: '70B', format: 'GGUF', estSize: '~40GB', minRam: '48GB', runtimes: ['Ollama', 'vLLM'] },
  { name: 'Gemma 3 4B', family: 'Gemma', modelId: 'gemma3:4b', paramSize: '4B', format: 'GGUF', estSize: '~2.5GB', minRam: '4GB', runtimes: ['Ollama', 'llama.cpp'] },
  { name: 'Gemma 3 12B', family: 'Gemma', modelId: 'gemma3:12b', paramSize: '12B', format: 'GGUF', estSize: '~7GB', minRam: '12GB', runtimes: ['Ollama', 'llama.cpp', 'LM Studio'] },
  { name: 'Mistral 7B', family: 'Mistral', modelId: 'mistral:7b', paramSize: '7B', format: 'GGUF', estSize: '~4GB', minRam: '8GB', runtimes: ['Ollama', 'llama.cpp', 'LM Studio', 'GPT4All'] },
  { name: 'Qwen2.5 7B', family: 'Qwen', modelId: 'qwen2.5:7b', paramSize: '7B', format: 'GGUF', estSize: '~4.5GB', minRam: '8GB', runtimes: ['Ollama', 'llama.cpp'] },
  { name: 'Phi-3.5 Mini', family: 'Phi', modelId: 'phi3.5:3.8b', paramSize: '3.8B', format: 'GGUF', estSize: '~2.2GB', minRam: '4GB', runtimes: ['Ollama', 'llama.cpp', 'LM Studio'] },
  { name: 'DeepSeek Coder 6.7B', family: 'DeepSeek', modelId: 'deepseek-coder:6.7b', paramSize: '6.7B', format: 'GGUF', estSize: '~4GB', minRam: '8GB', runtimes: ['Ollama', 'llama.cpp'] },
  { name: 'TinyLlama 1.1B', family: 'TinyLlama', modelId: 'tinyllama:1.1b', paramSize: '1.1B', format: 'GGUF', estSize: '~638MB', minRam: '2GB', runtimes: ['Ollama', 'llama.cpp', 'GPT4All'] },
];

function StatusBadge({ status }: { status: AIProviderConfig['status'] }) {
  const configs = {
    connected: { icon: CheckCircle, label: 'Connected', cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
    error: { icon: XCircle, label: 'Error', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
    testing: { icon: Loader2, label: 'Testing...', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    not_configured: { icon: AlertCircle, label: 'Not configured', cls: 'text-muted-foreground bg-muted/30 border-border' },
  };
  const { icon: Icon, label, cls } = configs[status] || configs.not_configured;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', cls)}>
      <Icon className={cn('w-3 h-3', status === 'testing' && 'animate-spin')} />
      {label}
    </span>
  );
}

function ProviderCard({ preset }: { preset: typeof ONLINE_PROVIDERS[0] }) {
  const { providers, addProvider, updateProvider, settings, updateSettings } = useApp();
  const { toast } = useToast();
  const existing = providers.find(p => p.name === preset.name && p.type === preset.type);
  const [apiKey, setApiKey] = useState(existing?.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || preset.baseUrl);
  const [model, setModel] = useState(existing?.selectedModel || preset.models[0] || '');
  const [customModel, setCustomModel] = useState('');
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const isSaved = !!existing;
  const isActive = settings.activeProviderId === existing?.id;

  const save = () => {
    const selectedModel = customModel || model;
    if (!selectedModel) { toast({ title: 'Select a model', variant: 'destructive' }); return; }
    const config: AIProviderConfig = {
      id: existing?.id || crypto.randomUUID(),
      name: preset.name,
      type: preset.type,
      mode: 'online',
      apiKey,
      baseUrl,
      selectedModel,
      customModels: fetchedModels,
      enabled: true,
      supportsStreaming: true,
      supportsSystemPrompt: true,
      status: 'not_configured',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existing) updateProvider(existing.id, config);
    else addProvider(config);
    toast({ title: `${preset.name} saved` });
  };

  const testConnection = async () => {
    if (!isSaved) { toast({ title: 'Save first', description: 'Save the provider before testing.', variant: 'destructive' }); return; }
    setIsTesting(true);
    if (existing) updateProvider(existing.id, { status: 'testing' });
    const cfg = { ...existing!, apiKey, baseUrl, selectedModel: customModel || model };
    const result = await testProviderConnection(cfg);
    const status: AIProviderConfig['status'] = result.success ? 'connected' : 'error';
    if (existing) updateProvider(existing.id, { status });
    toast({
      title: result.success ? 'Connected!' : 'Connection failed',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    setIsTesting(false);
  };

  const fetchModels = async () => {
    setIsFetching(true);
    const cfg = { ...existing!, apiKey, baseUrl, selectedModel: model } as AIProviderConfig;
    const models = await fetchProviderModels(cfg);
    if (models.length > 0) { setFetchedModels(models); toast({ title: `Fetched ${models.length} models` }); }
    else toast({ title: 'No models found', variant: 'destructive' });
    setIsFetching(false);
  };

  const allModels = [...new Set([...preset.models, ...fetchedModels])];

  return (
    <div className="glass-card rounded-xl p-4 space-y-3" data-testid={`provider-card-${preset.name}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{preset.name}</h3>
          <p className="text-xs text-muted-foreground">{preset.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={existing?.status || 'not_configured'} />
          {existing?.status === 'connected' && (
            <button
              onClick={() => {
                updateSettings({ activeProviderId: existing.id, activeModelId: existing.selectedModel });
                toast({ title: `${preset.name} set as active model` });
              }}
              className={cn('text-xs px-2 py-0.5 rounded-full border transition-all', isActive ? 'text-primary border-primary/40 bg-primary/10' : 'text-muted-foreground border-border hover:border-primary/30')}
            >
              {isActive ? 'Active' : 'Set Active'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">API Key</Label>
        <div className="relative">
          <Input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="pr-10 font-mono text-xs"
            data-testid={`input-api-key-${preset.name}`}
          />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {preset.name === 'Custom Endpoint' && (
        <div className="space-y-2">
          <Label className="text-xs">Base URL</Label>
          <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://your-endpoint.com/v1" data-testid={`input-base-url-${preset.name}`} />
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Model</Label>
          {allModels.length > 0 ? (
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-8 text-xs" data-testid={`select-model-${preset.name}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                {allModels.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="model-name" className="h-8 text-xs" />
          )}
        </div>
        <button onClick={fetchModels} disabled={isFetching} className="mt-5 h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all" title="Fetch models">
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={save} className="flex-1" data-testid={`btn-save-provider-${preset.name}`}>Save</Button>
        <Button size="sm" variant="outline" onClick={testConnection} disabled={isTesting || !isSaved} data-testid={`btn-test-provider-${preset.name}`}>
          {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Test'}
        </Button>
        {isSaved && (
          <Button size="sm" variant="ghost" onClick={() => { updateProvider(existing!.id, { apiKey: '', status: 'not_configured' }); setApiKey(''); }} className="text-destructive" title="Remove key">
            <XCircle className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function LocalRuntimeCard({ runtime }: { runtime: typeof LOCAL_RUNTIMES[0] }) {
  const { providers, addProvider, updateProvider, settings, updateSettings } = useApp();
  const { toast } = useToast();
  const existing = providers.find(p => p.name === runtime.name && p.mode === 'local');
  const [endpoint, setEndpoint] = useState(existing?.baseUrl || runtime.endpoint);
  const [localModel, setLocalModel] = useState(existing?.selectedModel || '');
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const isActive = settings.activeProviderId === existing?.id;

  const save = () => {
    const config: AIProviderConfig = {
      id: existing?.id || crypto.randomUUID(),
      name: runtime.name,
      type: 'local-openai-compatible',
      mode: 'local',
      apiKey: '',
      baseUrl: endpoint,
      selectedModel: localModel,
      customModels: fetchedModels,
      enabled: true,
      supportsStreaming: false,
      supportsSystemPrompt: true,
      status: 'not_configured',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existing) updateProvider(existing.id, config);
    else addProvider(config);
    toast({ title: `${runtime.name} saved` });
  };

  const test = async () => {
    if (!existing) { save(); return; }
    setIsTesting(true);
    const cfg = { ...existing, baseUrl: endpoint } as AIProviderConfig;
    const result = await testLocalRuntimeConnection(cfg);
    updateProvider(existing.id, { status: result.success ? 'connected' : 'error' });
    toast({ title: result.success ? 'Runtime reachable!' : 'Not reachable', description: result.message, variant: result.success ? 'default' : 'destructive' });
    setIsTesting(false);
  };

  const fetchMods = async () => {
    setIsFetching(true);
    const cfg = { ...(existing || {}), baseUrl: endpoint } as AIProviderConfig;
    const models = await fetchLocalModels(cfg);
    if (models.length > 0) { setFetchedModels(models); if (models[0]) setLocalModel(models[0]); toast({ title: `Found ${models.length} models` }); }
    else toast({ title: 'No models found. Is the runtime running?', variant: 'destructive' });
    setIsFetching(false);
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-3" data-testid={`local-runtime-${runtime.name}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-foreground">{runtime.name}</h3>
          <p className="text-xs text-muted-foreground">{runtime.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {existing ? (
            <span className={cn('flex items-center gap-1 text-xs', existing.status === 'connected' ? 'text-green-400' : 'text-muted-foreground')}>
              {existing.status === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {existing.status === 'connected' ? 'Reachable' : 'Offline'}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Endpoint URL</Label>
        <Input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="http://localhost:11434" className="font-mono text-xs" data-testid={`input-local-endpoint-${runtime.name}`} />
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Model Name</Label>
          {fetchedModels.length > 0 ? (
            <Select value={localModel} onValueChange={setLocalModel}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select model" /></SelectTrigger>
              <SelectContent>{fetchedModels.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Input value={localModel} onChange={e => setLocalModel(e.target.value)} placeholder="llama3.2:3b" className="h-8 text-xs font-mono" />
          )}
        </div>
        <button onClick={fetchMods} disabled={isFetching} className="mt-5 h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground" title="Fetch models">
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={save} className="flex-1">Save</Button>
        <Button size="sm" variant="outline" onClick={test} disabled={isTesting} data-testid={`btn-test-local-${runtime.name}`}>
          {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Test'}
        </Button>
        {existing?.status === 'connected' && (
          <Button size="sm" variant="outline" onClick={() => { updateSettings({ activeProviderId: existing.id }); toast({ title: `${runtime.name} set as active` }); }} className={isActive ? 'text-primary border-primary/40' : ''}>
            {isActive ? 'Active' : 'Set Active'}
          </Button>
        )}
      </div>
    </div>
  );
}

function ActiveModelPanel() {
  const { providers, settings, updateSettings } = useApp();
  const { toast } = useToast();
  const active = providers.find(p => p.id === settings.activeProviderId);
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2048]);

  if (!active) {
    return (
      <div className="glass-card rounded-xl p-6 text-center space-y-3">
        <Cpu className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="font-medium text-foreground">No active model</p>
        <p className="text-sm text-muted-foreground">Configure an online or local AI provider and set it as active.</p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-400">
          Demo Mode: Configure an AI model to enable real AI responses.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-foreground">{active.name}</div>
            <div className="text-sm text-muted-foreground font-mono">{active.selectedModel}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={active.status} />
            <span className={cn('text-xs', active.mode === 'local' ? 'text-cyan-400' : 'text-green-400')}>
              {active.mode === 'local' ? 'Local Mode' : 'Online Mode'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Temperature: {temperature[0]}</Label>
            <Slider value={temperature} onValueChange={setTemperature} min={0} max={2} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Max Tokens: {maxTokens[0]}</Label>
            <Slider value={maxTokens} onValueChange={setMaxTokens} min={256} max={8192} step={256} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { updateSettings({ activeProviderId: undefined }); toast({ title: 'Model cleared' }); }}>
            Change Model
          </Button>
        </div>
      </div>
    </div>
  );
}

function AIModelsContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">AI Models</h1>
        <p className="text-sm text-muted-foreground">Configure your AI providers and local runtimes</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="active">Active Model</TabsTrigger>
          <TabsTrigger value="online">Online Providers</TabsTrigger>
          <TabsTrigger value="local">Local AI</TabsTrigger>
          <TabsTrigger value="downloaded">Downloaded Models</TabsTrigger>
          <TabsTrigger value="custom">Custom Model</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <ActiveModelPanel />
        </TabsContent>

        <TabsContent value="online" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            {ONLINE_PROVIDERS.map(p => <ProviderCard key={p.name} preset={p} />)}
          </div>
        </TabsContent>

        <TabsContent value="local" className="mt-4 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-400">
            Local AI requires a running runtime on your device. Start the runtime first, then test the connection.
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {LOCAL_RUNTIMES.map(r => <LocalRuntimeCard key={r.name} runtime={r} />)}
          </div>
        </TabsContent>

        <TabsContent value="downloaded" className="mt-4">
          <DownloadedModelsTab />
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <CustomModelForm />
        </TabsContent>

        <TabsContent value="advanced" className="mt-4">
          <AdvancedSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DownloadedModelsTab() {
  const { addProvider, providers, updateSettings, settings } = useApp();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [importRuntime, setImportRuntime] = useState('Ollama');
  const [importModelName, setImportModelName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const importedProviders = providers.filter(p => p.mode === 'local' && p.name.startsWith('[Imported]'));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile({ name: file.name, size: file.size });
    const baseName = file.name.replace(/\.(gguf|bin|safetensors)$/i, '');
    setImportModelName(baseName.toLowerCase().replace(/\s+/g, '-'));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const registerModel = () => {
    if (!importModelName.trim()) { toast({ title: 'Enter a model name', variant: 'destructive' }); return; }
    const rt = LOCAL_RUNTIMES.find(r => r.name === importRuntime);
    const provider: AIProviderConfig = {
      id: crypto.randomUUID(),
      name: `[Imported] ${importModelName.trim()}`,
      type: 'local-openai-compatible',
      mode: 'local',
      apiKey: '',
      baseUrl: rt?.endpoint || 'http://localhost:11434',
      selectedModel: importModelName.trim(),
      customModels: [],
      enabled: true,
      supportsStreaming: false,
      supportsSystemPrompt: true,
      status: 'not_configured',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProvider(provider);
    toast({
      title: 'Model registered!',
      description: `"${importModelName}" saved for ${importRuntime}. Go to Local AI tab to test the connection.`,
    });
    setSelectedFile(null);
    setImportModelName('');
  };

  const copyCommand = async (modelId: string, cmd: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopiedId(modelId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied!', description: cmd });
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-400 leading-relaxed">
        Import a GGUF / safetensors model from your device storage, or copy an Ollama pull command to download a model. A local runtime (Ollama, llama.cpp, LM Studio) must be running to use any local model.
      </div>

      {/* ── Section: Import from device ── */}
      <div className="space-y-3">
        <p className="settings-section-header" style={{ marginTop: 0 }}>Import from Device Storage</p>

        <input ref={fileInputRef} type="file" accept=".gguf,.bin,.safetensors" onChange={handleFileSelect} className="hidden" />

        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border hover:border-primary/40 rounded-2xl p-8 text-center transition-all group"
            data-testid="btn-browse-model-file"
          >
            <FolderOpen className="w-9 h-9 text-muted-foreground/30 group-hover:text-primary/50 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Browse for model file</p>
            <p className="text-xs text-muted-foreground/40 mt-1">.gguf · .bin · .safetensors</p>
          </button>
        ) : (
          <div className="glass-card rounded-2xl p-4 space-y-3">
            {/* File info chip */}
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
              <FileArchive className="w-5 h-5 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-400 truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Model Name / ID</Label>
                <Input
                  value={importModelName}
                  onChange={e => setImportModelName(e.target.value)}
                  placeholder="e.g. llama3.2:3b"
                  className="font-mono text-xs"
                  data-testid="input-import-model-name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Run With</Label>
                <Select value={importRuntime} onValueChange={setImportRuntime}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCAL_RUNTIMES.filter(r => r.name !== 'Custom').map(r => (
                      <SelectItem key={r.name} value={r.name} className="text-xs">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
              After registering, start {importRuntime} and load the model file, then use the <strong>Local AI</strong> tab to test the connection.
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1">
                Change File
              </Button>
              <Button size="sm" onClick={registerModel} disabled={!importModelName.trim()} className="flex-1 glow-primary" data-testid="btn-register-model">
                Register Model
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Section: Registered imported models ── */}
      {importedProviders.length > 0 && (
        <div className="space-y-2">
          <p className="settings-section-header" style={{ marginTop: 0 }}>Registered Local Models</p>
          {importedProviders.map(p => (
            <div key={p.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
              <FileArchive className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name.replace('[Imported] ', '')}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{p.selectedModel} · {p.baseUrl}</p>
              </div>
              <StatusBadge status={p.status} />
              {p.status === 'connected' && (
                <button
                  onClick={() => { updateSettings({ activeProviderId: p.id }); toast({ title: 'Active model set!' }); }}
                  className={cn('text-xs px-2.5 py-1 rounded-full border transition-all shrink-0',
                    settings.activeProviderId === p.id
                      ? 'text-primary border-primary/40 bg-primary/10'
                      : 'text-muted-foreground border-border hover:border-primary/30'
                  )}
                >
                  {settings.activeProviderId === p.id ? 'Active' : 'Set Active'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Section: Ollama pull catalog ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="settings-section-header" style={{ marginTop: 0 }}>Download via Ollama</p>
          <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer"
             className="text-xs text-primary/60 hover:text-primary transition-colors">ollama.ai ↗</a>
        </div>

        <div className="bg-muted/30 border border-border rounded-xl p-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Terminal className="w-4 h-4 shrink-0 mt-0.5 text-primary/60" />
          <span>Copy the pull command and run it in your terminal. Then configure the Ollama runtime in the <strong>Local AI</strong> tab.</span>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {LOCAL_MODEL_CATALOG.map(m => (
            <div key={m.modelId} className="glass-card rounded-xl p-4 space-y-2.5 relative overflow-hidden" data-testid={`model-catalog-${m.modelId}`}>
              {/* Size badge */}
              <div className="absolute top-3 right-3">
                <span className="text-xs font-mono bg-foreground/8 border border-border rounded-lg px-2 py-0.5 text-muted-foreground">{m.estSize}</span>
              </div>

              <div>
                <p className="font-semibold text-sm text-foreground pr-12">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.family} · {m.paramSize} · {m.format} · Min RAM: {m.minRam}</p>
              </div>

              {/* Compatible runtimes */}
              <div className="flex flex-wrap gap-1">
                {m.runtimes.map(r => (
                  <span key={r} className="text-[11px] bg-primary/8 border border-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">{r}</span>
                ))}
              </div>

              {/* Command + copy */}
              <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                <code className="flex-1 text-[11px] font-mono text-muted-foreground truncate">ollama pull {m.modelId}</code>
                <button
                  onClick={() => copyCommand(m.modelId, `ollama pull ${m.modelId}`)}
                  data-testid={`btn-copy-ollama-${m.modelId}`}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors shrink-0"
                  title="Copy command"
                >
                  {copiedId === m.modelId
                    ? <Check className="w-3.5 h-3.5 text-green-400" />
                    : <Copy className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomModelForm() {
  const { addProvider } = useApp();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', type: 'openai-compatible', apiKey: '', baseUrl: '', modelId: '', headers: '{}', temperature: '0.7', maxTokens: '2048', streaming: false, systemPrompt: true });

  const save = () => {
    if (!form.name || !form.baseUrl || !form.modelId) { toast({ title: 'Fill required fields', variant: 'destructive' }); return; }
    const provider: AIProviderConfig = {
      id: crypto.randomUUID(),
      name: form.name,
      type: form.type as any,
      mode: form.type === 'local-openai-compatible' ? 'local' : 'online',
      apiKey: form.apiKey,
      baseUrl: form.baseUrl,
      selectedModel: form.modelId,
      customModels: [],
      enabled: true,
      supportsStreaming: form.streaming,
      supportsSystemPrompt: form.systemPrompt,
      status: 'not_configured',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProvider(provider);
    toast({ title: 'Custom model saved' });
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-4 max-w-xl">
      <h3 className="font-semibold text-foreground">Add Custom Model</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Display Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="My Custom Model" data-testid="input-custom-name" /></div>
        <div className="space-y-1">
          <Label className="text-xs">Provider Type</Label>
          <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="openai-compatible">OpenAI-compatible</SelectItem>
              <SelectItem value="anthropic">Anthropic-compatible</SelectItem>
              <SelectItem value="gemini">Gemini-compatible</SelectItem>
              <SelectItem value="local-openai-compatible">Local OpenAI-compatible</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">API Key</Label><Input type="password" value={form.apiKey} onChange={e => setForm(f => ({...f, apiKey: e.target.value}))} placeholder="sk-..." /></div>
        <div className="space-y-1"><Label className="text-xs">Base URL *</Label><Input value={form.baseUrl} onChange={e => setForm(f => ({...f, baseUrl: e.target.value}))} placeholder="https://api.example.com/v1" /></div>
        <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Model ID *</Label><Input value={form.modelId} onChange={e => setForm(f => ({...f, modelId: e.target.value}))} placeholder="gpt-4o" className="font-mono" /></div>
        <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Extra Headers (JSON)</Label><Textarea value={form.headers} onChange={e => setForm(f => ({...f, headers: e.target.value}))} rows={2} className="font-mono text-xs" /></div>
        <div className="space-y-1"><Label className="text-xs">Temperature</Label><Input type="number" value={form.temperature} onChange={e => setForm(f => ({...f, temperature: e.target.value}))} min="0" max="2" step="0.1" /></div>
        <div className="space-y-1"><Label className="text-xs">Max Tokens</Label><Input type="number" value={form.maxTokens} onChange={e => setForm(f => ({...f, maxTokens: e.target.value}))} /></div>
        <div className="flex items-center gap-2"><Switch checked={form.streaming} onCheckedChange={v => setForm(f => ({...f, streaming: v}))} /><Label className="text-xs">Streaming</Label></div>
        <div className="flex items-center gap-2"><Switch checked={form.systemPrompt} onCheckedChange={v => setForm(f => ({...f, systemPrompt: v}))} /><Label className="text-xs">System Prompt</Label></div>
      </div>
      <Button onClick={save} data-testid="btn-save-custom-model"><Plus className="w-4 h-4 mr-1.5" />Save Custom Model</Button>
    </div>
  );
}

function AdvancedSettings() {
  const [temp, setTemp] = useState([0.7]);
  const [tokens, setTokens] = useState([2048]);
  const [topP, setTopP] = useState([0.9]);
  const [timeout, setTimeout2] = useState([30]);
  const [sysPrompt, setSysPrompt] = useState("You are Hermes AI Agent, a professional autonomous assistant. Use relevant memories and enabled skills only when they genuinely improve the answer. Do not force memory or skills into casual messages. Be clear, practical, and concise unless the user requests detail.");

  return (
    <div className="glass-card rounded-xl p-5 space-y-5 max-w-xl">
      <h3 className="font-semibold text-foreground">Advanced Settings</h3>
      <div className="space-y-2"><Label className="text-xs">Default Temperature: {temp[0]}</Label><Slider value={temp} onValueChange={setTemp} min={0} max={2} step={0.1} /></div>
      <div className="space-y-2"><Label className="text-xs">Default Max Tokens: {tokens[0]}</Label><Slider value={tokens} onValueChange={setTokens} min={256} max={8192} step={256} /></div>
      <div className="space-y-2"><Label className="text-xs">Top-P: {topP[0]}</Label><Slider value={topP} onValueChange={setTopP} min={0} max={1} step={0.05} /></div>
      <div className="space-y-2"><Label className="text-xs">Request Timeout: {timeout[0]}s</Label><Slider value={timeout} onValueChange={setTimeout2} min={5} max={120} step={5} /></div>
      <div className="space-y-2"><Label className="text-xs">System Prompt Override</Label><Textarea value={sysPrompt} onChange={e => setSysPrompt(e.target.value)} rows={4} className="text-xs" /></div>
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
