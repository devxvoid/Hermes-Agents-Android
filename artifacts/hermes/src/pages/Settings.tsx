import { useState, useRef, useEffect } from 'react';
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
import { useLocation } from 'wouter';
import {
  Download, Upload, Trash2, Key, RotateCcw, Shield, Moon, Sun, Monitor, Check,
  Cpu, Bell, Mic, HardDrive, ChevronRight, Bot, Zap, Palette, Database, Info,
  AlertTriangle, BrainCircuit, Settings2, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Theme data ─────────────────────────────────────────────── */
const THEME_COLORS: { id: ThemeColor; label: string; hex: string }[] = [
  { id: 'dynamic', label: 'Dynamic', hex: '#2196b8' },
  { id: 'ocean',   label: 'Ocean',   hex: '#1a9c97' },
  { id: 'purple',  label: 'Purple',  hex: '#7c45c6' },
  { id: 'forest',  label: 'Forest',  hex: '#2d8a54' },
  { id: 'slate',   label: 'Slate',   hex: '#4b6480' },
  { id: 'rose',    label: 'Rose',    hex: '#cc2b4c' },
];

const THEME_MODES = [
  { value: 'light',  label: 'Light',  icon: Sun    },
  { value: 'dark',   label: 'Dark',   icon: Moon   },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

/* ── Permission state helper ────────────────────────────────── */
type PermStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

function PermBadge({ status }: { status: PermStatus }) {
  const cfg = {
    granted:     { label: 'Granted',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    denied:      { label: 'Denied',    cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
    prompt:      { label: 'Not set',   cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    unsupported: { label: 'N/A',       cls: 'bg-muted/40 text-muted-foreground border-border' },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', cls)}>
      {label}
    </span>
  );
}

/* ── Reusable row components ────────────────────────────────── */
function SettingsRow({
  icon: Icon, iconCls = 'bg-primary/15 text-primary', title, description, children, onClick, rightArrow,
}: {
  icon: React.ElementType; iconCls?: string; title: string; description?: string;
  children?: React.ReactNode; onClick?: () => void; rightArrow?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 w-full text-left',
        onClick && 'hover:bg-foreground/[0.04] active:bg-foreground/[0.07] transition-colors cursor-pointer'
      )}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconCls)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
      {rightArrow && !children && <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
    </Tag>
  );
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('glass-card rounded-2xl overflow-hidden divide-y divide-border/50', className)}>
      {children}
    </div>
  );
}

/* ── Main Settings page ─────────────────────────────────────── */
export default function Settings() {
  const { settings, updateSettings, clearAllData, clearAllApiKeys, exportData, importData, providers } = useApp();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [keysConfirm, setKeysConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [exportKeyConfirm, setExportKeyConfirm] = useState(false);

  /* permissions */
  const [notifPerm, setNotifPerm] = useState<PermStatus>('prompt');
  const [micPerm, setMicPerm] = useState<PermStatus>('prompt');

  useEffect(() => {
    // Notifications
    if (!('Notification' in window)) setNotifPerm('unsupported');
    else if (Notification.permission === 'granted') setNotifPerm('granted');
    else if (Notification.permission === 'denied') setNotifPerm('denied');

    // Microphone via Permissions API
    navigator.permissions?.query({ name: 'microphone' as PermissionName }).then(r => {
      setMicPerm(r.state as PermStatus);
      r.onchange = () => setMicPerm(r.state as PermStatus);
    }).catch(() => {});
  }, []);

  const requestNotifications = async () => {
    if (!('Notification' in window)) { toast({ title: 'Not supported in this browser', variant: 'destructive' }); return; }
    const result = await Notification.requestPermission();
    setNotifPerm(result as PermStatus);
    if (result === 'granted') {
      toast({ title: 'Notifications enabled' });
    } else {
      toast({ title: 'Permission denied', description: 'Enable in browser/device settings.', variant: 'destructive' });
    }
  };

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicPerm('granted');
      toast({ title: 'Microphone access granted' });
    } catch {
      setMicPerm('denied');
      toast({ title: 'Microphone denied', description: 'Enable in browser/device settings.', variant: 'destructive' });
    }
  };

  const handleExport = (includeKeys = false) => {
    const data = exportData(includeKeys);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mr-robot-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export complete', description: includeKeys ? 'Includes API keys.' : 'API keys excluded.' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        importData(JSON.parse(ev.target?.result as string));
        toast({ title: 'Import successful' });
      } catch {
        toast({ title: 'Import failed', description: 'Invalid JSON.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const activeProvider = providers.find(p => p.id === settings.activeProviderId && p.enabled);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-3 pb-28 md:pb-10">

      {/* ── Header brand card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/30 via-primary/15 to-accent/10 border border-primary/20 p-5 mb-6">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-primary/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-black text-2xl select-none" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>R</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">{settings.agentName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">AI Agent Console</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={cn(
                'w-2 h-2 rounded-full',
                activeProvider ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]'
              )} />
              <span className={cn('text-xs font-semibold', activeProvider ? 'text-emerald-400' : 'text-amber-400')}>
                {activeProvider ? `${activeProvider.name} — ${activeProvider.selectedModel}` : 'Demo Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          AI MODEL
      ══════════════════════════════════════ */}
      <p className="settings-section-header">AI Model</p>
      <SectionCard>
        <SettingsRow
          icon={Cpu}
          iconCls="bg-violet-500/15 text-violet-400"
          title="AI Provider"
          description={activeProvider ? `${activeProvider.name} · ${activeProvider.selectedModel}` : 'Configure your AI model'}
          onClick={() => setLocation('/ai-models')}
          rightArrow
        />
      </SectionCard>

      {/* ══════════════════════════════════════
          PERMISSIONS
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Permissions</p>
      <SectionCard>
        <SettingsRow
          icon={Bell}
          iconCls="bg-blue-500/15 text-blue-400"
          title="Notifications"
          description="Alerts for AI responses and tasks"
          onClick={notifPerm !== 'granted' ? requestNotifications : undefined}
        >
          <PermBadge status={notifPerm} />
        </SettingsRow>

        <SettingsRow
          icon={Mic}
          iconCls="bg-red-500/15 text-red-400"
          title="Microphone"
          description="Required for voice input in chat"
          onClick={micPerm !== 'granted' ? requestMicrophone : undefined}
        >
          <PermBadge status={micPerm} />
        </SettingsRow>

        <SettingsRow
          icon={HardDrive}
          iconCls="bg-emerald-500/15 text-emerald-400"
          title="File Storage"
          description="Upload files and import GGUF models"
        >
          <PermBadge status="granted" />
        </SettingsRow>
      </SectionCard>

      {/* ══════════════════════════════════════
          APPEARANCE
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Appearance</p>

      {/* Theme mode */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Theme Mode</p>
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
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                    : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            );
          })}
        </div>

        <Separator className="opacity-50" />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Accent Color</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {THEME_COLORS.map(({ id, label, hex }) => {
              const active = settings.themeColor === id;
              return (
                <button
                  key={id}
                  onClick={() => updateSettings({ themeColor: id })}
                  data-testid={`btn-color-${id}`}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border-[3px]',
                    active ? 'border-foreground/70 scale-110' : 'border-transparent scale-100'
                  )} style={{ backgroundColor: hex }}>
                    {active && <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={3} />}
                  </div>
                  <span className={cn('text-[10px] font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <SectionCard>
        <div className="px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/60 text-zinc-300 flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">AMOLED Black</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pure black for OLED displays</p>
            </div>
          </div>
          <Switch checked={settings.amoledBlack} onCheckedChange={v => updateSettings({ amoledBlack: v })} data-testid="toggle-amoled" />
        </div>
        <div className="px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-500/15 text-slate-400 flex items-center justify-center shrink-0">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">System Font</p>
              <p className="text-xs text-muted-foreground mt-0.5">Use your device's default font</p>
            </div>
          </div>
          <Switch checked={settings.systemFont} onCheckedChange={v => updateSettings({ systemFont: v })} data-testid="toggle-system-font" />
        </div>

        {/* ── Hacker Mode ── */}
        <div
          className={cn(
            'px-4 py-3.5 flex items-center justify-between gap-4 transition-colors duration-300',
            settings.hackerMode && 'bg-[rgba(0,255,65,0.04)]'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
              settings.hackerMode
                ? 'bg-[rgba(0,255,65,0.15)] text-[#00FF41] shadow-[0_0_12px_rgba(0,255,65,0.4)]'
                : 'bg-emerald-900/30 text-emerald-400'
            )}>
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <p className={cn(
                'text-sm font-semibold transition-colors duration-300',
                settings.hackerMode && 'text-[#00FF41]'
              )}>
                {settings.hackerMode ? 'HACKER MODE: ON' : 'Hacker Mode'}
              </p>
              <p className={cn(
                'text-xs mt-0.5 leading-snug transition-colors duration-300',
                settings.hackerMode ? 'text-[rgba(0,255,65,0.55)]' : 'text-muted-foreground'
              )}>
                {settings.hackerMode
                  ? '// root@fsociety — terminal theme active'
                  : 'Transform into a hacking terminal'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.hackerMode}
            onCheckedChange={v => updateSettings({ hackerMode: v })}
            data-testid="toggle-hacker-mode"
          />
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════
          GENERAL
      ══════════════════════════════════════ */}
      <p className="settings-section-header">General</p>
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent Name</Label>
          <Input
            value={settings.agentName}
            onChange={e => updateSettings({ agentName: e.target.value })}
            placeholder="Mr. Robot"
            data-testid="input-agent-name"
            className="bg-muted/30"
          />
        </div>
        <Separator className="opacity-50" />
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Response Style</Label>
          <Select value={settings.responseStyle} onValueChange={v => updateSettings({ responseStyle: v as any })}>
            <SelectTrigger data-testid="select-response-style" className="bg-muted/30"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="concise">Concise — short answers</SelectItem>
              <SelectItem value="balanced">Balanced — default</SelectItem>
              <SelectItem value="detailed">Detailed — thorough</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ══════════════════════════════════════
          AI BEHAVIOUR
      ══════════════════════════════════════ */}
      <p className="settings-section-header">AI Behaviour</p>
      <SectionCard>
        {[
          { title: 'Memory Injection', desc: 'Use relevant memories in AI context', key: 'useMemoryByDefault', icon: BrainCircuit, iconCls: 'bg-cyan-500/15 text-cyan-400', testId: 'toggle-use-memory' },
          { title: 'Auto-activate Skills', desc: 'Trigger matching skills automatically', key: 'activateSkillsByDefault', icon: Zap, iconCls: 'bg-amber-500/15 text-amber-400', testId: 'toggle-activate-skills' },
          { title: 'Response Streaming', desc: 'Stream tokens when provider supports it', key: 'streamingEnabled', icon: Bot, iconCls: 'bg-emerald-500/15 text-emerald-400', testId: 'toggle-streaming' },
        ].map(row => (
          <div key={row.key} className="px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', row.iconCls)}>
                <row.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{row.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{row.desc}</p>
              </div>
            </div>
            <Switch
              checked={settings[row.key as keyof typeof settings] as boolean}
              onCheckedChange={v => updateSettings({ [row.key]: v })}
              data-testid={row.testId}
            />
          </div>
        ))}
      </SectionCard>

      {/* ══════════════════════════════════════
          DATA & EXPORT
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Data & Export</p>
      <SectionCard>
        <SettingsRow
          icon={Download}
          iconCls="bg-primary/15 text-primary"
          title="Export Data"
          description="Save conversations, memories and skills"
          onClick={() => handleExport(false)}
        />
        <SettingsRow
          icon={Key}
          iconCls="bg-amber-500/15 text-amber-400"
          title="Export with API Keys"
          description="Includes all provider credentials"
          onClick={() => setExportKeyConfirm(true)}
        />
        <SettingsRow
          icon={Upload}
          iconCls="bg-teal-500/15 text-teal-400"
          title="Import from JSON"
          description="Restore from a previous export"
          onClick={() => fileRef.current?.click()}
        />
      </SectionCard>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

      {/* ══════════════════════════════════════
          PRIVACY
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Privacy & Security</p>
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">100% Local Storage</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              All data lives in your browser. API keys go directly to your configured providers — never through Mr. Robot servers.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-400/90 leading-relaxed">
            Browser localStorage is not a secure vault. Avoid storing highly sensitive credentials.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ABOUT
      ══════════════════════════════════════ */}
      <p className="settings-section-header">About</p>
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white font-black text-sm">R</span>
          </div>
          <div>
            <p className="font-bold text-foreground">Mr. Robot</p>
            <p className="text-xs text-muted-foreground">AI Operating Console · v1.0</p>
          </div>
        </div>
        <Separator className="my-3 opacity-50" />
        <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Personal AI agent with local model support, memory, skills, and voice input. Supports Ollama, LM Studio, and all major cloud providers.</span>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DANGER ZONE
      ══════════════════════════════════════ */}
      <p className="settings-section-header">Danger Zone</p>
      <div className="glass-card rounded-2xl p-4 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setKeysConfirm(true)} className="border-destructive/30 text-destructive hover:bg-destructive/5 text-xs" data-testid="btn-clear-keys">
            <Key className="w-3.5 h-3.5 mr-1.5" />Clear API Keys
          </Button>
          <Button variant="outline" size="sm" onClick={() => setResetConfirm(true)} className="border-destructive/30 text-destructive hover:bg-destructive/5 text-xs" data-testid="btn-reset-defaults">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Reset Defaults
          </Button>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setClearConfirm(true)} className="w-full text-xs" data-testid="btn-clear-all-data">
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />Clear All Data
        </Button>
      </div>

      {/* ── Dialogs ── */}
      <ConfirmDialog open={clearConfirm} onOpenChange={setClearConfirm} title="Clear All Data" description="This will permanently delete all conversations, memories, skills, and settings. Cannot be undone." confirmLabel="Clear Everything" variant="destructive" onConfirm={() => { clearAllData(); toast({ title: 'All data cleared' }); }} />
      <ConfirmDialog open={keysConfirm} onOpenChange={setKeysConfirm} title="Clear All API Keys" description="All saved API keys will be removed. Your other data stays." confirmLabel="Clear Keys" variant="destructive" onConfirm={() => { clearAllApiKeys(); toast({ title: 'API keys cleared' }); }} />
      <ConfirmDialog open={resetConfirm} onOpenChange={setResetConfirm} title="Reset to Defaults" description="Clears all data and restores factory defaults." confirmLabel="Reset" variant="destructive" onConfirm={() => { clearAllData(); toast({ title: 'Reset complete' }); }} />
      <ConfirmDialog open={exportKeyConfirm} onOpenChange={setExportKeyConfirm} title="Export with Keys" description="This file will contain your API keys. Keep it secure." confirmLabel="Export" onConfirm={() => { handleExport(true); setExportKeyConfirm(false); }} />
    </div>
  );
}
