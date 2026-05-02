import { Conversation, Message, Memory, Skill, AppSettings, AIProviderConfig } from '../types';

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function normalizeMessage(raw: Partial<Message>): Message {
  return {
    id: raw.id || crypto.randomUUID(),
    role: raw.role === "assistant" ? "assistant" : "user",
    content: raw.content || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    usedMemoryIds: Array.isArray(raw.usedMemoryIds) ? raw.usedMemoryIds : [],
    triggeredSkillIds: Array.isArray(raw.triggeredSkillIds) ? raw.triggeredSkillIds : [],
    metadata: raw.metadata
  };
}

export function normalizeConversation(raw: Partial<Conversation>): Conversation {
  return {
    id: raw.id || crypto.randomUUID(),
    title: raw.title || "New Conversation",
    messages: Array.isArray(raw.messages) ? raw.messages.map(normalizeMessage) : [],
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    tags: Array.isArray(raw.tags) ? raw.tags : []
  };
}

export function normalizeMemory(raw: Partial<Memory>): Memory {
  return {
    id: raw.id || crypto.randomUUID(),
    title: raw.title || "",
    content: raw.content || "",
    category: raw.category || "General",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    active: raw.active !== undefined ? Boolean(raw.active) : true,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    lastUsedAt: raw.lastUsedAt,
    usageCount: Number(raw.usageCount) || 0
  };
}

export function normalizeSkill(raw: Partial<Skill>): Skill {
  return {
    id: raw.id || crypto.randomUUID(),
    name: raw.name || "",
    description: raw.description || "",
    category: raw.category || "General",
    triggerKeywords: Array.isArray(raw.triggerKeywords) ? raw.triggerKeywords : [],
    instructionPrompt: raw.instructionPrompt || "",
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : true,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    lastUsedAt: raw.lastUsedAt,
    usageCount: Number(raw.usageCount) || 0
  };
}

export function normalizeProvider(raw: Partial<AIProviderConfig>): AIProviderConfig {
  return {
    id: raw.id || crypto.randomUUID(),
    name: raw.name || "Unknown",
    type: raw.type || "openai-compatible",
    mode: raw.mode || "online",
    apiKey: raw.apiKey || "",
    baseUrl: raw.baseUrl || "",
    selectedModel: raw.selectedModel || "",
    customModels: Array.isArray(raw.customModels) ? raw.customModels : [],
    enabled: Boolean(raw.enabled),
    supportsStreaming: Boolean(raw.supportsStreaming),
    supportsSystemPrompt: raw.supportsSystemPrompt !== undefined ? Boolean(raw.supportsSystemPrompt) : true,
    status: raw.status || "not_configured",
    lastTestedAt: raw.lastTestedAt,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString()
  };
}

export function normalizeSettings(raw: Partial<AppSettings>): AppSettings {
  return {
    agentName: raw.agentName || "Hermes",
    responseStyle: ["concise", "balanced", "detailed"].includes(raw.responseStyle as string) ? raw.responseStyle as any : "balanced",
    useMemoryByDefault: raw.useMemoryByDefault !== undefined ? Boolean(raw.useMemoryByDefault) : true,
    activateSkillsByDefault: raw.activateSkillsByDefault !== undefined ? Boolean(raw.activateSkillsByDefault) : true,
    theme: ["dark", "light", "system"].includes(raw.theme as string) ? raw.theme as any : "dark",
    streamingEnabled: raw.streamingEnabled !== undefined ? Boolean(raw.streamingEnabled) : true,
    activeProviderId: raw.activeProviderId,
    activeModelId: raw.activeModelId
  };
}

export const StorageKeys = {
  CONVERSATIONS: "hermes_conversations",
  MEMORIES: "hermes_memories",
  SKILLS: "hermes_skills",
  PROVIDERS: "hermes_providers",
  SETTINGS: "hermes_settings"
};

export function getStorageData<T>(key: string, normalizer: (item: any) => any, defaultIfEmpty: T[] = []): T[] {
  const data = safeJsonParse<any[]>(localStorage.getItem(key), []);
  return Array.isArray(data) && data.length > 0 ? data.map(normalizer) : defaultIfEmpty;
}

export function setStorageData<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}
