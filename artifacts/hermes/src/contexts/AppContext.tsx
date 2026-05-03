import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Conversation, Memory, Skill, AppSettings, AIProviderConfig, ThemeColor } from '../types';
import { StorageKeys, safeJsonParse, normalizeConversation, normalizeMemory, normalizeSkill, normalizeProvider, normalizeSettings, setStorageData } from '../lib/storage';
import { defaultMemories, defaultSkills } from '../lib/seedData';

interface AppContextType {
  conversations: Conversation[];
  memories: Memory[];
  skills: Skill[];
  settings: AppSettings;
  providers: AIProviderConfig[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  addMemory: (mem: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addProvider: (provider: AIProviderConfig) => void;
  updateProvider: (id: string, updates: Partial<AIProviderConfig>) => void;
  deleteProvider: (id: string) => void;
  clearAllData: () => void;
  clearAllApiKeys: () => void;
  exportData: (includeKeys?: boolean) => object;
  importData: (data: any) => void;
}

const AppContext = createContext<AppContextType | null>(null);

/* ── Colour palette lookup table (HSL triplets, no hsl() wrapper) ── */
type PaletteEntry = {
  light: { primary: string; ring: string; accent: string };
  dark:  { primary: string; ring: string; accent: string };
};

const COLOR_PALETTES: Record<ThemeColor, PaletteEntry> = {
  dynamic: {
    light: { primary: '200 80% 46%',  ring: '200 80% 46%',  accent: '185 70% 38%' },
    dark:  { primary: '200 85% 62%',  ring: '200 85% 62%',  accent: '185 75% 55%' },
  },
  ocean: {
    light: { primary: '185 68% 40%',  ring: '185 68% 40%',  accent: '195 70% 44%' },
    dark:  { primary: '185 72% 54%',  ring: '185 72% 54%',  accent: '195 72% 58%' },
  },
  purple: {
    light: { primary: '268 62% 52%',  ring: '268 62% 52%',  accent: '280 58% 56%' },
    dark:  { primary: '268 68% 66%',  ring: '268 68% 66%',  accent: '280 65% 70%' },
  },
  forest: {
    light: { primary: '148 55% 36%',  ring: '148 55% 36%',  accent: '158 52% 40%' },
    dark:  { primary: '148 58% 50%',  ring: '148 58% 50%',  accent: '158 55% 54%' },
  },
  slate: {
    light: { primary: '213 32% 44%',  ring: '213 32% 44%',  accent: '220 30% 48%' },
    dark:  { primary: '213 32% 62%',  ring: '213 32% 62%',  accent: '220 30% 66%' },
  },
  rose: {
    light: { primary: '348 70% 48%',  ring: '348 70% 48%',  accent: '355 65% 52%' },
    dark:  { primary: '348 75% 62%',  ring: '348 75% 62%',  accent: '355 70% 66%' },
  },
};

/* Apply / clear the active theme colour vars directly on <html> inline style */
function applyThemeColor(root: HTMLElement, color: ThemeColor, isDark: boolean) {
  const palette = COLOR_PALETTES[color] ?? COLOR_PALETTES.dynamic;
  const vars = isDark ? palette.dark : palette.light;

  const PROPS = ['--primary', '--ring', '--accent', '--sidebar-primary', '--sidebar-ring', '--chart-1'];
  const propMap: Record<string, string> = {
    '--primary': vars.primary,
    '--ring': vars.ring,
    '--accent': vars.accent,
    '--sidebar-primary': vars.primary,
    '--sidebar-ring': vars.ring,
    '--chart-1': vars.primary,
  };

  PROPS.forEach(p => root.style.setProperty(p, propMap[p]));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => normalizeSettings({}));
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const rawConvs = safeJsonParse<any[]>(localStorage.getItem(StorageKeys.CONVERSATIONS), []);
    setConversations(rawConvs.map(normalizeConversation));

    const rawMems = safeJsonParse<any[]>(localStorage.getItem(StorageKeys.MEMORIES), []);
    if (rawMems.length === 0) {
      setMemories(defaultMemories);
      setStorageData(StorageKeys.MEMORIES, defaultMemories);
    } else {
      setMemories(rawMems.map(normalizeMemory));
    }

    const rawSkills = safeJsonParse<any[]>(localStorage.getItem(StorageKeys.SKILLS), []);
    if (rawSkills.length === 0) {
      setSkills(defaultSkills);
      setStorageData(StorageKeys.SKILLS, defaultSkills);
    } else {
      setSkills(rawSkills.map(normalizeSkill));
    }

    const rawSettings = safeJsonParse<any>(localStorage.getItem(StorageKeys.SETTINGS), {});
    setSettings(normalizeSettings(rawSettings));

    const rawProviders = safeJsonParse<any[]>(localStorage.getItem(StorageKeys.PROVIDERS), []);
    setProviders(rawProviders.map(normalizeProvider));

    setInitialized(true);
  }, []);

  /* ── Apply all appearance classes/vars to <html> ── */
  useEffect(() => {
    if (!initialized) return;
    const root = document.documentElement;
    const { theme, themeColor, amoledBlack, systemFont, hackerMode } = settings;

    /* 1. Dark / light / system */
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark) || !!hackerMode;
    root.classList.toggle('dark', isDark);

    /* 2. Theme colour — inline style wins over any stylesheet rule */
    applyThemeColor(root, themeColor ?? 'dynamic', isDark);

    /* 3. AMOLED pure black */
    root.classList.toggle('amoled', !!amoledBlack);

    /* 4. System font override */
    root.classList.toggle('system-font', !!systemFont && !hackerMode);

    /* 5. Hacker terminal theme */
    root.classList.toggle('hacker', !!hackerMode);
  }, [settings.theme, settings.themeColor, settings.amoledBlack, settings.systemFont, settings.hackerMode, initialized]);

  const addConversation = useCallback((conv: Conversation) => {
    setConversations(prev => {
      const next = [conv, ...prev];
      setStorageData(StorageKeys.CONVERSATIONS, next);
      return next;
    });
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
      setStorageData(StorageKeys.CONVERSATIONS, next);
      return next;
    });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      setStorageData(StorageKeys.CONVERSATIONS, next);
      return next;
    });
    setActiveConversationId(prev => prev === id ? null : prev);
  }, []);

  const addMemory = useCallback((mem: Memory) => {
    setMemories(prev => {
      const next = [mem, ...prev];
      setStorageData(StorageKeys.MEMORIES, next);
      return next;
    });
  }, []);

  const updateMemory = useCallback((id: string, updates: Partial<Memory>) => {
    setMemories(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
      setStorageData(StorageKeys.MEMORIES, next);
      return next;
    });
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories(prev => {
      const next = prev.filter(m => m.id !== id);
      setStorageData(StorageKeys.MEMORIES, next);
      return next;
    });
  }, []);

  const addSkill = useCallback((skill: Skill) => {
    setSkills(prev => {
      const next = [skill, ...prev];
      setStorageData(StorageKeys.SKILLS, next);
      return next;
    });
  }, []);

  const updateSkill = useCallback((id: string, updates: Partial<Skill>) => {
    setSkills(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
      setStorageData(StorageKeys.SKILLS, next);
      return next;
    });
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setSkills(prev => {
      const next = prev.filter(s => s.id !== id);
      setStorageData(StorageKeys.SKILLS, next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(next));
      return next;
    });
  }, []);

  const addProvider = useCallback((provider: AIProviderConfig) => {
    setProviders(prev => {
      const next = [...prev, provider];
      setStorageData(StorageKeys.PROVIDERS, next);
      return next;
    });
  }, []);

  const updateProvider = useCallback((id: string, updates: Partial<AIProviderConfig>) => {
    setProviders(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
      setStorageData(StorageKeys.PROVIDERS, next);
      return next;
    });
  }, []);

  const deleteProvider = useCallback((id: string) => {
    setProviders(prev => {
      const next = prev.filter(p => p.id !== id);
      setStorageData(StorageKeys.PROVIDERS, next);
      return next;
    });
  }, []);

  const clearAllData = useCallback(() => {
    Object.values(StorageKeys).forEach(k => localStorage.removeItem(k));
    setConversations([]);
    setMemories(defaultMemories);
    setSkills(defaultSkills);
    setSettings(normalizeSettings({}));
    setProviders([]);
    setActiveConversationId(null);
    setStorageData(StorageKeys.MEMORIES, defaultMemories);
    setStorageData(StorageKeys.SKILLS, defaultSkills);
  }, []);

  const clearAllApiKeys = useCallback(() => {
    setProviders(prev => {
      const next = prev.map(p => ({ ...p, apiKey: '', status: 'not_configured' as const }));
      setStorageData(StorageKeys.PROVIDERS, next);
      return next;
    });
  }, []);

  const exportData = useCallback((includeKeys = false) => {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      conversations, memories, skills, settings,
      providers: includeKeys ? providers : providers.map(p => ({ ...p, apiKey: '' })),
    };
  }, [conversations, memories, skills, settings, providers]);

  const importData = useCallback((data: any) => {
    if (!data || typeof data !== 'object') return;
    if (Array.isArray(data.conversations)) {
      const convs = data.conversations.map(normalizeConversation);
      setConversations(convs);
      setStorageData(StorageKeys.CONVERSATIONS, convs);
    }
    if (Array.isArray(data.memories)) {
      const mems = data.memories.map(normalizeMemory);
      setMemories(mems);
      setStorageData(StorageKeys.MEMORIES, mems);
    }
    if (Array.isArray(data.skills)) {
      const sks = data.skills.map(normalizeSkill);
      setSkills(sks);
      setStorageData(StorageKeys.SKILLS, sks);
    }
    if (data.settings) {
      const s = normalizeSettings(data.settings);
      setSettings(s);
      localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(s));
    }
    if (Array.isArray(data.providers)) {
      const provs = data.providers.map(normalizeProvider);
      setProviders(provs);
      setStorageData(StorageKeys.PROVIDERS, provs);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      conversations, memories, skills, settings, providers,
      activeConversationId, setActiveConversationId,
      addConversation, updateConversation, deleteConversation,
      addMemory, updateMemory, deleteMemory,
      addSkill, updateSkill, deleteSkill,
      updateSettings,
      addProvider, updateProvider, deleteProvider,
      clearAllData, clearAllApiKeys, exportData, importData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
