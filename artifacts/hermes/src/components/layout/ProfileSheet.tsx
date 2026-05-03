import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Cpu, Settings, Brain, Zap, Camera, Check, X,
  ChevronRight, Shield, Download, Trash2, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { settings, updateSettings, memories, skills, providers } = useApp();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(settings.agentName);

  const activeProvider = providers.find(
    p => p.id === settings.activeProviderId && p.enabled && p.status === 'connected'
  );
  const activeMemories = memories.filter(m => m.active).length;
  const enabledSkills  = skills.filter(s => s.enabled).length;

  const navigate = (path: string) => {
    onOpenChange(false);
    setTimeout(() => setLocation(path), 160);
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
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* ── Nav items (Gemini "More from Gemini" style) ── */
  const navItems = [
    {
      label: 'Memory',
      desc: `${activeMemories} active`,
      path: '/memory',
      icon: Brain,
      iconBg: 'bg-cyan-500/15',
      iconColor: 'text-cyan-400',
    },
    {
      label: 'Skills',
      desc: `${enabledSkills} enabled`,
      path: '/skills',
      icon: Zap,
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
    },
    {
      label: 'AI Provider',
      desc: activeProvider ? `${activeProvider.name} · ${activeProvider.selectedModel}` : 'Not configured',
      path: '/ai-models',
      icon: Cpu,
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
    },
    {
      label: 'Settings',
      desc: 'Appearance, behaviour, data',
      path: '/settings',
      icon: Settings,
      iconBg: 'bg-foreground/8',
      iconColor: 'text-foreground/60',
    },
  ];

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border-x-0 border-b-0 p-0 overflow-hidden profile-sheet-bg"
          style={{ maxHeight: '92vh', overflowY: 'auto' }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Profile</SheetTitle>
          </SheetHeader>

          {/* ── Top row: email + Done ── */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="text-xs text-foreground/45 font-medium">
              {settings.agentName.toLowerCase().replace(/\s+/g, '.')}@agent.local
            </span>
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-1"
            >
              Done
            </button>
          </div>

          {/* ── Avatar section ── */}
          <div className="flex flex-col items-center gap-3 px-6 py-4">
            <div className="relative">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-[88px] h-[88px] rounded-full overflow-hidden focus:outline-none active:scale-95 transition-transform ring-[3px] ring-foreground/10"
              >
                {settings.profileImage ? (
                  <img src={settings.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                    <span className="text-white font-black text-3xl select-none"
                      style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                      {initials || 'R'}
                    </span>
                  </div>
                )}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-1 right-0 w-7 h-7 rounded-full bg-foreground/80 border-2 border-background flex items-center justify-center shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 text-background" />
              </button>
            </div>

            {/* Name */}
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="text-center font-bold text-lg h-10 w-44 glass-input"
                  autoFocus
                />
                <button onClick={saveName}><Check className="w-4 h-4 text-emerald-500" /></button>
                <button onClick={() => setEditingName(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            ) : (
              <button
                onClick={() => { setNameVal(settings.agentName); setEditingName(true); }}
                className="text-xl font-bold text-foreground hover:text-primary transition-colors"
              >
                Hi, {settings.agentName}!
              </button>
            )}

            {/* AI status chip */}
            <div className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border',
              activeProvider
                ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/12 text-amber-400 border-amber-500/20'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', activeProvider ? 'bg-emerald-400' : 'bg-amber-400')} />
              {activeProvider ? `${activeProvider.name} connected` : 'Demo Mode — no AI key'}
            </div>

            {/* Manage Agent button */}
            <button
              onClick={() => navigate('/settings')}
              className="w-full max-w-[260px] border border-foreground/15 rounded-full py-2.5 text-sm font-semibold text-foreground/80 hover:bg-foreground/[0.05] transition-colors"
            >
              Manage Agent Settings
            </button>
          </div>

          <Separator className="opacity-20" />

          {/* ── "More from Mr. Robot" label ── */}
          <p className="text-xs text-foreground/40 font-semibold px-5 pt-4 pb-2">
            More from {settings.agentName}
          </p>

          {/* ── Nav items list ── */}
          <div className="px-3 pb-2">
            {navItems.map(({ label, desc, path, icon: Icon, iconBg, iconColor }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-2xl hover:bg-foreground/[0.05] active:bg-foreground/[0.08] transition-colors text-left"
              >
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', iconBg)}>
                  <Icon className={cn('w-4.5 h-4.5', iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/20 shrink-0" />
              </button>
            ))}
          </div>

          <Separator className="opacity-20 mx-4" />

          {/* ── Bottom utility links ── */}
          <div className="px-3 py-2 pb-safe space-y-0.5">
            {[
              { label: 'Privacy & Security', icon: Shield,   action: () => navigate('/settings') },
              { label: 'Export Data',         icon: Download, action: () => navigate('/settings') },
              { label: 'About Mr. Robot',     icon: Bot,      action: () => navigate('/settings') },
            ].map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-foreground/[0.04] transition-colors"
              >
                <Icon className="w-4 h-4 text-foreground/35 shrink-0" />
                <span className="text-sm text-foreground/60">{label}</span>
              </button>
            ))}
          </div>

          {/* Safe-area spacer */}
          <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
        </SheetContent>
      </Sheet>
    </>
  );
}
