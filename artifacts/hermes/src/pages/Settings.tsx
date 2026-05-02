import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Trash2, Key, RotateCcw, Shield, Moon, Sun, Monitor } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, clearAllData, clearAllApiKeys, exportData, importData } = useApp();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [keysConfirm, setKeysConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [exportIncludeKeys, setExportIncludeKeys] = useState(false);
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
        const data = JSON.parse(ev.target?.result as string);
        importData(data);
        toast({ title: 'Data imported successfully' });
      } catch {
        toast({ title: 'Import failed', description: 'Invalid JSON file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const themeOptions = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure Hermes AI Agent</p>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-5">
        <h2 className="font-semibold text-foreground">General</h2>

        <div className="space-y-2">
          <Label>Agent Name</Label>
          <Input
            value={settings.agentName}
            onChange={e => updateSettings({ agentName: e.target.value })}
            placeholder="Hermes"
            data-testid="input-agent-name"
          />
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateSettings({ theme: value as 'dark' | 'light' | 'system' })}
                data-testid={`btn-theme-${value}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  settings.theme === value
                    ? 'bg-primary/15 border-primary/50 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Response Style</Label>
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

      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground">AI Behavior</h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Use Memory by Default</div>
            <div className="text-xs text-muted-foreground">Inject relevant memories into AI context</div>
          </div>
          <Switch checked={settings.useMemoryByDefault} onCheckedChange={v => updateSettings({ useMemoryByDefault: v })} data-testid="toggle-use-memory" />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Activate Skills by Default</div>
            <div className="text-xs text-muted-foreground">Trigger matching skills automatically</div>
          </div>
          <Switch checked={settings.activateSkillsByDefault} onCheckedChange={v => updateSettings({ activateSkillsByDefault: v })} data-testid="toggle-activate-skills" />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Streaming</div>
            <div className="text-xs text-muted-foreground">Stream responses when provider supports it</div>
          </div>
          <Switch checked={settings.streamingEnabled} onCheckedChange={v => updateSettings({ streamingEnabled: v })} data-testid="toggle-streaming" />
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Data & Export</h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => handleExport(false)} className="flex-1" data-testid="btn-export-data">
            <Download className="w-4 h-4 mr-2" />Export Data (no keys)
          </Button>
          <Button variant="outline" onClick={() => setExportKeyConfirm(true)} className="flex-1" data-testid="btn-export-with-keys">
            <Key className="w-4 h-4 mr-2" />Export with Keys
          </Button>
        </div>

        <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full" data-testid="btn-import-data">
          <Upload className="w-4 h-4 mr-2" />Import Data from JSON
        </Button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      <div className="glass-card rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Privacy & Security</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          All data including conversations, memories, skills, and settings is stored locally in your browser using localStorage. API keys are stored locally and never transmitted to Hermes servers. Online AI requests are sent directly to your configured providers. Local AI requests stay on your local network.
        </p>
        <p className="text-xs text-amber-500 mt-2">
          Browser localStorage is not a secure vault. Do not store highly sensitive credentials.
        </p>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-destructive">Danger Zone</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setKeysConfirm(true)} className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5" data-testid="btn-clear-keys">
            <Key className="w-4 h-4 mr-2" />Clear All API Keys
          </Button>
          <Button variant="outline" onClick={() => setResetConfirm(true)} className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5" data-testid="btn-reset-defaults">
            <RotateCcw className="w-4 h-4 mr-2" />Reset to Defaults
          </Button>
        </div>
        <Button variant="destructive" onClick={() => setClearConfirm(true)} className="w-full" data-testid="btn-clear-all-data">
          <Trash2 className="w-4 h-4 mr-2" />Clear All Data
        </Button>
      </div>

      <ConfirmDialog open={clearConfirm} onOpenChange={setClearConfirm} title="Clear All Data" description="This will permanently delete all conversations, memories, skills, and settings. This cannot be undone." confirmLabel="Clear Everything" variant="destructive" onConfirm={() => { clearAllData(); toast({ title: 'All data cleared' }); }} />
      <ConfirmDialog open={keysConfirm} onOpenChange={setKeysConfirm} title="Clear All API Keys" description="All saved API keys will be removed. Your other data will remain." confirmLabel="Clear Keys" variant="destructive" onConfirm={() => { clearAllApiKeys(); toast({ title: 'All API keys cleared' }); }} />
      <ConfirmDialog open={resetConfirm} onOpenChange={setResetConfirm} title="Reset to Defaults" description="This will clear all your data and restore the default memories, skills, and settings." confirmLabel="Reset" variant="destructive" onConfirm={() => { clearAllData(); toast({ title: 'Reset to defaults' }); }} />
      <ConfirmDialog open={exportKeyConfirm} onOpenChange={setExportKeyConfirm} title="Export with API Keys" description="This will include your API keys in the export file. Keep it secure. Do not share this file." confirmLabel="Export with Keys" onConfirm={() => { handleExport(true); setExportKeyConfirm(false); }} />
    </div>
  );
}
