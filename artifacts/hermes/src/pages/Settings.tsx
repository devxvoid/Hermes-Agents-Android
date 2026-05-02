import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ThemeColor } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Trash2, Key, RotateCcw, Shield, Moon, Sun, Monitor, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Theme colour swatches ────────────────────────────── */
const THEME_COLORS: { id: ThemeColor; label: string; swatch: string }[] = [
  { id: 'dynamic', label: 'Dynamic', swatch: 'bg-[hsl(200,80%,46%)]' },
  { id: 'ocean',   label: 'Ocean',   swatch: 'bg-[hsl(185,68%,40%)]' },
  { id: 'purple',  label: 'Purple',  swatch: 'bg-[hsl(268,62%,52%)]' },
  { id: 'forest',  label: 'Forest',  swatch: 'bg-[hsl(148,55%,36%)]' },
  { id: 'slate',   label: 'Slate',   swatch: 'bg-[hsl(213,32%,44%)]' },
  { id: 'rose',    label: 'Rose',    swatch: 'bg-[hsl(348,70%,48%)]' },
];

const THEME_MODES = [
  { value: 'light',  label: 'Light',  icon: Sun   },
  { value: 'dark',   label: 'Dark',   icon: Moon  },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

/* ── Re-usable toggle row ─────────────────────────────── */
function ToggleRow({
  title, description, checked, onCheckedChange, testId,
}: { title: string; description?: string; checked: boolean; onCheckedChange: (v: boolean) => void; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} data-testid={testId} className="shrink-0" />
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, clearAllData, clearAllApiKeys, exportData, importData } = useApp();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [keysConfirm, setKeysConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [exportKeyConfirm, setExportKeyConfirm] = useState(false);

  const handleExport = (includeKeys = false) => {
    const data = exportData(includeKeys);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hermes-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Data exported', description: includeKeys ? 'Includes API keys.' : 'API keys excluded.' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importData(JSON.parse(ev.target?.result as string));
        toast({ title: 'Data imported successfully' });
      } catch {
        toast({ title: 'Import failed', description: 'Invalid JSON file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-1 pb-28 md:pb-8">

      {/* ── Page title ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure Hermes AI Agent</p>
      </div>

      {/* ══════════════════════════════════════
          APPEARANCE
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Appearance</p>

      {/* Theme mode tiles */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {THEME_MODES.map(({ value, label, icon: Icon }) => {
            const active = settings.theme === value;
            return (
              <button
                key={value}
                onClick={() => updateSettings({ theme: value })}
                data-testid={`btn-theme-${value}`}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-2xl py-4 transition-all border',
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme colour */}
      <div className="glass-card rounded-2xl p-4">
        <p className="text-sm font-semibold text-foreground mb-3">Theme Color</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {THEME_COLORS.map(({ id, label, swatch }) => {
            const active = settings.themeColor === id;
            return (
              <button
                key={id}
                onClick={() => updateSettings({ themeColor: id })}
                data-testid={`btn-color-${id}`}
                className="flex flex-col items-center gap-2 shrink-0 outline-none focus-visible:outline-none"
              >
                {/*
                  Two-layer approach: outer ring wrapper (transparent or visible border)
                  + inner filled circle. No ring-offset, no scale — avoids all clipping bugs.
                */}
                <div className={cn(
                  'w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-200',
                  active
                    ? 'border-[2.5px] border-foreground/60'
                    : 'border-[2.5px] border-transparent'
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-opacity duration-200',
                    swatch,
                    !active && 'opacity-75 hover:opacity-100'
                  )}>
                    {active && (
                      <Check className="w-4.5 h-4.5 text-white drop-shadow-sm" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <span className={cn(
                  'text-[11px] font-semibold leading-none transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AMOLED */}
      <div className="glass-card rounded-2xl px-4 py-3.5">
        <ToggleRow
          title="AMOLED Black Theme"
          description="Pure black background for dark mode"
          checked={settings.amoledBlack}
          onCheckedChange={v => updateSettings({ amoledBlack: v })}
          testId="toggle-amoled"
        />
      </div>

      {/* System Font */}
      <div className="glass-card rounded-2xl px-4 py-3.5">
        <ToggleRow
          title="System Font"
          description="Match your device's font for better readability"
          checked={settings.systemFont}
          onCheckedChange={v => updateSettings({ systemFont: v })}
          testId="toggle-system-font"
        />
      </div>

      {/* ══════════════════════════════════════
          GENERAL
      ══════════════════════════════════════ */}
      <p className="settings-section-header">General</p>

      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Agent Name</Label>
          <Input
            value={settings.agentName}
            onChange={e => updateSettings({ agentName: e.target.value })}
            placeholder="Hermes"
            data-testid="input-agent-name"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Response Style</Label>
          <Select value={settings.responseStyle} onValueChange={v => updateSettings({ responseStyle: v as any })}>
            <SelectTrigger data-testid="select-response-style"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ══════════════════════════════════════
          AI BEHAVIOUR
      ══════════════════════════════════════ */}
      <p className="settings-section-header">AI Behaviour</p>

      <div className="glass-card rounded-2xl px-4 divide-y divide-border/50">
        <div className="py-3.5">
          <ToggleRow
            title="Use Memory by Default"
            description="Inject relevant memories into AI context"
            checked={settings.useMemoryByDefault}
            onCheckedChange={v => updateSettings({ useMemoryByDefault: v })}
            testId="toggle-use-memory"
          />
        </div>
        <div className="py-3.5">
          <ToggleRow
            title="Activate Skills by Default"
            description="Trigger matching skills automatically"
            checked={settings.activateSkillsByDefault}
            onCheckedChange={v => updateSettings({ activateSkillsByDefault: v })}
            testId="toggle-activate-skills"
          />
        </div>
        <div className="py-3.5">
          <ToggleRow
            title="Streaming"
            description="Stream responses when provider supports it"
            checked={settings.streamingEnabled}
            onCheckedChange={v => updateSettings({ streamingEnabled: v })}
            testId="toggle-streaming"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════
          DATA
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Data & Export</p>

      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => handleExport(false)} data-testid="btn-export-data" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />Export (no keys)
          </Button>
          <Button variant="outline" onClick={() => setExportKeyConfirm(true)} data-testid="btn-export-with-keys" className="text-xs">
            <Key className="w-3.5 h-3.5 mr-1.5" />Export with Keys
          </Button>
        </div>
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full text-xs" data-testid="btn-import-data">
          <Upload className="w-3.5 h-3.5 mr-1.5" />Import Data from JSON
        </Button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {/* ══════════════════════════════════════
          PRIVACY
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Privacy</p>

      <div className="glass-card rounded-2xl p-4 space-y-2">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            All data is stored locally in your browser. API keys are never sent to Hermes servers — only directly to your configured AI providers.
          </p>
        </div>
        <p className="text-xs text-amber-500 leading-snug">
          Browser localStorage is not a secure vault. Do not store highly sensitive credentials.
        </p>
      </div>

      {/* ══════════════════════════════════════
          DANGER ZONE
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Danger Zone</p>

      <div className="glass-card rounded-2xl p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setKeysConfirm(true)} className="border-destructive/30 text-destructive hover:bg-destructive/5 text-xs" data-testid="btn-clear-keys">
            <Key className="w-3.5 h-3.5 mr-1.5" />Clear API Keys
          </Button>
          <Button variant="outline" onClick={() => setResetConfirm(true)} className="border-destructive/30 text-destructive hover:bg-destructive/5 text-xs" data-testid="btn-reset-defaults">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Reset Defaults
          </Button>
        </div>
        <Button variant="destructive" onClick={() => setClearConfirm(true)} className="w-full text-xs" data-testid="btn-clear-all-data">
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />Clear All Data
        </Button>
      </div>

      <ConfirmDialog open={clearConfirm} onOpenChange={setClearConfirm} title="Clear All Data" description="This will permanently delete all conversations, memories, skills, and settings. This cannot be undone." confirmLabel="Clear Everything" variant="destructive" onConfirm={() => { clearAllData(); toast({ title: 'All data cleared' }); }} />
      <ConfirmDialog open={keysConfirm} onOpenChange={setKeysConfirm} title="Clear All API Keys" description="All saved API keys will be removed. Your other data will remain." confirmLabel="Clear Keys" variant="destructive" onConfirm={() => { clearAllApiKeys(); toast({ title: 'All API keys cleared' }); }} />
      <ConfirmDialog open={resetConfirm} onOpenChange={setResetConfirm} title="Reset to Defaults" description="This will clear all your data and restore the default memories, skills, and settings." confirmLabel="Reset" variant="destructive" onConfirm={() => { clearAllData(); toast({ title: 'Reset to defaults' }); }} />
      <ConfirmDialog open={exportKeyConfirm} onOpenChange={setExportKeyConfirm} title="Export with API Keys" description="This will include your API keys in the export file. Keep it secure — do not share this file." confirmLabel="Export with Keys" onConfirm={() => { handleExport(true); setExportKeyConfirm(false); }} />
    </div>
  );
}
