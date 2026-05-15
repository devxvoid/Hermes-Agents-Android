import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react';

import { AIProvider, AppSettings, Conversation, Memory, Message } from '@/types';

const KEYS = {
  CONVERSATIONS: 'mrrobot_conversations',
  MEMORIES: 'mrrobot_memories',
  SETTINGS: 'mrrobot_settings',
  PROVIDERS: 'mrrobot_providers',
  ACTIVE_CONV: 'mrrobot_active_conv',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  agentName: 'Mr. Robot',
  theme: 'dark',
  amoledBlack: true,
  hackerMode: false,
  streamingEnabled: true,
  responseStyle: 'balanced',
};

const DEFAULT_MEMORIES: Memory[] = [
  {
    id: 'm1',
    title: 'Identity',
    content: 'I am an advanced AI operating system. I help with coding, security, research, and complex problem solving.',
    category: 'system',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm2',
    title: 'Communication Style',
    content: 'Be direct and precise. Avoid filler words. Prioritize accuracy over brevity when dealing with technical topics.',
    category: 'behavior',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface AppContextType {
  conversations: Conversation[];
  memories: Memory[];
  settings: AppSettings;
  providers: AIProvider[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  addConversation: (conv: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  addMessage: (convId: string, msg: Message) => void;
  updateMessage: (convId: string, msgId: string, updates: Partial<Message>) => void;
  addMemory: (mem: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addProvider: (provider: AIProvider) => void;
  updateProvider: (id: string, updates: Partial<AIProvider>) => void;
  deleteProvider: (id: string) => void;
  activeProvider: AIProvider | null;
  isLoaded: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

async function save(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memories, setMemories] = useState<Memory[]>(DEFAULT_MEMORIES);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [convs, mems, setts, provs, activeId] = await Promise.all([
        load<Conversation[]>(KEYS.CONVERSATIONS, []),
        load<Memory[]>(KEYS.MEMORIES, DEFAULT_MEMORIES),
        load<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS),
        load<AIProvider[]>(KEYS.PROVIDERS, []),
        load<string | null>(KEYS.ACTIVE_CONV, null),
      ]);
      setConversations(convs);
      setMemories(mems.length ? mems : DEFAULT_MEMORIES);
      setSettings({ ...DEFAULT_SETTINGS, ...setts });
      setProviders(provs);
      if (activeId && convs.some(c => c.id === activeId)) {
        setActiveConversationIdState(activeId);
      }
      setIsLoaded(true);
    })();
  }, []);

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id);
    save(KEYS.ACTIVE_CONV, id);
  }, []);

  const addConversation = useCallback((conv: Conversation) => {
    setConversations(prev => {
      const next = [conv, ...prev];
      save(KEYS.CONVERSATIONS, next);
      return next;
    });
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations(prev => {
      const next = prev.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );
      save(KEYS.CONVERSATIONS, next);
      return next;
    });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      save(KEYS.CONVERSATIONS, next);
      return next;
    });
    setActiveConversationIdState(prev => {
      if (prev === id) {
        save(KEYS.ACTIVE_CONV, null);
        return null;
      }
      return prev;
    });
  }, []);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    save(KEYS.CONVERSATIONS, []);
    setActiveConversationIdState(null);
    save(KEYS.ACTIVE_CONV, null);
  }, []);

  const addMessage = useCallback((convId: string, msg: Message) => {
    setConversations(prev => {
      const next = prev.map(c =>
        c.id === convId
          ? { ...c, messages: [...c.messages, msg], updatedAt: new Date().toISOString() }
          : c
      );
      save(KEYS.CONVERSATIONS, next);
      return next;
    });
  }, []);

  const updateMessage = useCallback((convId: string, msgId: string, updates: Partial<Message>) => {
    setConversations(prev => {
      const next = prev.map(c =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map(m => (m.id === msgId ? { ...m, ...updates } : m)),
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      save(KEYS.CONVERSATIONS, next);
      return next;
    });
  }, []);

  const addMemory = useCallback((mem: Memory) => {
    setMemories(prev => {
      const next = [mem, ...prev];
      save(KEYS.MEMORIES, next);
      return next;
    });
  }, []);

  const updateMemory = useCallback((id: string, updates: Partial<Memory>) => {
    setMemories(prev => {
      const next = prev.map(m =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      );
      save(KEYS.MEMORIES, next);
      return next;
    });
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories(prev => {
      const next = prev.filter(m => m.id !== id);
      save(KEYS.MEMORIES, next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      save(KEYS.SETTINGS, next);
      return next;
    });
  }, []);

  const addProvider = useCallback((provider: AIProvider) => {
    setProviders(prev => {
      const next = [...prev, provider];
      save(KEYS.PROVIDERS, next);
      return next;
    });
  }, []);

  const updateProvider = useCallback((id: string, updates: Partial<AIProvider>) => {
    setProviders(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      save(KEYS.PROVIDERS, next);
      return next;
    });
  }, []);

  const deleteProvider = useCallback((id: string) => {
    setProviders(prev => {
      const next = prev.filter(p => p.id !== id);
      save(KEYS.PROVIDERS, next);
      return next;
    });
    setSettings(prev => {
      if (prev.activeProviderId === id) {
        const next = { ...prev, activeProviderId: undefined, activeModelId: undefined };
        save(KEYS.SETTINGS, next);
        return next;
      }
      return prev;
    });
  }, []);

  const activeProvider =
    providers.find(p => p.id === settings.activeProviderId && p.enabled) ?? null;

  return (
    <AppContext.Provider
      value={{
        conversations, memories, settings, providers,
        activeConversationId, setActiveConversationId,
        addConversation, updateConversation, deleteConversation, clearAllConversations,
        addMessage, updateMessage,
        addMemory, updateMemory, deleteMemory,
        updateSettings,
        addProvider, updateProvider, deleteProvider,
        activeProvider,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
