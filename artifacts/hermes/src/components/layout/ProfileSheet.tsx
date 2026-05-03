import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Cpu, Settings, Zap, Brain, Camera, Check, X,
  Moon, Sun, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { settings, updateSettings, providers } = useApp();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(settings.agentName);

  const activeProvider = providers.find(
    p => p.id === settings.activeProviderId && p.enabled && p.status === 'connected'
  );

  const navigate = (path: string) => {
    onOpenChange(false);
    setTimeout(() => setLocation(path), 180);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Max 3 MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      updateSettings({ profileImage: ev.target?.result as string });
      toast({ title: 'Profile photo updated' });
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const saveName = () => {
    if (nameVal.trim()) updateSettings({ agentName: nameVal.trim() });
    setEditingName(false);
  };

  const initials = settings.agentName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navItems = [
    { label: 'AI Provider',    path: '/ai-models',    icon: Cpu,      iconCls: 'bg-violet-500/15 text-violet-400' },
    { label: 'Memory',         path: '/memory',        icon: Brain,    iconCls: 'bg-cyan-500/15 text-cyan-400' },
    { label: 'Skills',         path: '/skills',        icon: Zap,      iconCls: 'bg-amber-500/15 text-amber-400' },
    { label: 'Settings',       path: '/settings',      icon: Settings, iconCls: 'bg-primary/15 text-primary' },
  ];

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border-x-0 border-b-0 p-0 overflow-hidden liquid-glass-sheet"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Profile</SheetTitle>
          </SheetHeader>

          {/* ── Drag handle ── */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-foreground/20" />
          </div>

          {/* ── Avatar + name ── */}
          <div className="flex flex-col items-center gap-3 px-6 pt-3 pb-5">
            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-primary/20 focus:outline-none active:scale-95 transition-transform"
              >
                {settings.profileImage ? (
                  <img
                    src={settings.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                    <span className="text-white font-black text-2xl select-none"
                      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                      {initials || 'R'}
                    </span>
                  </div>
                )}
              </button>
              {/* Camera badge */}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-foreground/90 dark:bg-white/90 flex items-center justify-center shadow-md border-2 border-background"
              >
                <Camera className="w-3.5 h-3.5 text-background dark:text-zinc-900" />
              </button>
            </div>

            {/* Name */}
            {editingName ? (
              <div className="flex items-center gap-2 w-full max-w-[200px]">
                <Input
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="text-center font-bold text-base h-9 glass-input"
                  autoFocus
                />
                <button onClick={saveName} className="text-emerald-500"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button
                onClick={() => { setNameVal(settings.agentName); setEditingName(true); }}
                className="text-base font-bold text-foreground hover:text-primary transition-colors"
              >
                {settings.agentName}
              </button>
            )}

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'w-2 h-2 rounded-full',
                activeProvider
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]'
              )} />
              <span className={cn('text-xs font-semibold', activeProvider ? 'text-emerald-400' : 'text-amber-400')}>
                {activeProvider ? `${activeProvider.name} · ${activeProvider.selectedModel}` : 'Demo Mode'}
              </span>
            </div>

            {/* Quick theme toggle */}
            <div className="flex items-center gap-1 bg-muted/40 rounded-full p-1 mt-1">
              {(['light', 'dark', 'system'] as const).map(t => {
                const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Settings;
                const active = settings.theme === t;
                return (
                  <button
                    key={t}
                    onClick={() => updateSettings({ theme: t })}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="opacity-40" />

          {/* ── Nav links ── */}
          <div className="px-4 py-3 space-y-1 pb-8">
            {navItems.map(({ label, path, icon: Icon, iconCls }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-foreground/[0.05] active:bg-foreground/[0.09] transition-colors text-left"
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconCls)}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
