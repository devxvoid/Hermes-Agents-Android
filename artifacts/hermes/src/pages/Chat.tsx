import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { Conversation, Message } from '@/types';
import { MessageBubble, TypingIndicator } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { classifyMessageIntent, shouldUseMemory, shouldTriggerSkill, generateDemoResponse } from '@/lib/agentEngine';
import { sendAIMessage } from '@/lib/ai/aiClient';
import { Button } from '@/components/ui/button';
import { MessageSquare, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const STARTER_PROMPTS = [
  'Summarize my current project plan.',
  'Use my memory and help me plan today.',
  'Which skills can help me build an Android app?',
  'Create a launch checklist for my product.',
  'Analyze my saved notes and suggest next actions.',
  'Configure a local AI model for offline use.',
];

function ConversationNotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center">
        <MessageSquare className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Conversation not found</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">This chat may have been deleted or the link is outdated.</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <Button onClick={() => setLocation('/conversations')} variant="outline" size="sm" className="rounded-full">Go to Chats</Button>
        <Button onClick={() => setLocation('/chat')} size="sm" className="rounded-full">Start New Chat</Button>
      </div>
    </div>
  );
}

function ChatContent() {
  const [match, params] = useRoute('/chat/:conversationId');
  const [, setLocation] = useLocation();
  const { conversations, memories, skills, settings, providers,
          addConversation, updateConversation, setActiveConversationId } = useApp();
  const { toast } = useToast();
  const [isTyping, setIsTyping] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const urlConvId = match ? params?.conversationId : null;

  useEffect(() => {
    if (urlConvId) {
      const exists = conversations.find(c => c.id === urlConvId);
      if (exists) { setActiveConvId(urlConvId); setActiveConversationId(urlConvId); }
    }
  }, [urlConvId, conversations, setActiveConversationId]);

  const activeConv = activeConvId ? conversations.find(c => c.id === activeConvId) : null;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [activeConv?.messages?.length, isTyping, scrollToBottom]);

  const createNewConversation = useCallback(() => {
    const id = crypto.randomUUID();
    const conv: Conversation = { id, title: 'New Chat', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), pinned: false, archived: false, tags: [] };
    addConversation(conv); setActiveConvId(id); setActiveConversationId(id); setLocation(`/chat/${id}`);
  }, [addConversation, setActiveConversationId, setLocation]);

  const handleSend = useCallback(async (text: string) => {
    let convId = activeConvId;
    let conv = convId ? conversations.find(c => c.id === convId) : null;

    if (!conv) {
      const id = crypto.randomUUID();
      const newConv: Conversation = { id, title: text.slice(0, 50) || 'New Chat', messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), pinned: false, archived: false, tags: [] };
      addConversation(newConv); setActiveConvId(id); setActiveConversationId(id); convId = id; conv = newConv; setLocation(`/chat/${id}`);
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, createdAt: new Date().toISOString(), usedMemoryIds: [], triggeredSkillIds: [] };
    const updatedMessages = [...(conv.messages || []), userMsg];
    const title = conv.messages.length === 0 ? text.slice(0, 60) : conv.title;
    updateConversation(convId, { messages: updatedMessages, title, updatedAt: new Date().toISOString() });
    setIsTyping(true); scrollToBottom();

    try {
      const activeMemories = memories.filter(m => m.active);
      const activeSkills = skills.filter(s => s.enabled);
      const useMemory = settings.useMemoryByDefault && shouldUseMemory(text, activeMemories);
      const usedMems = useMemory ? activeMemories.filter(m => m.content.toLowerCase().split(/\s+/).some(w => text.toLowerCase().split(/\s+/).includes(w) && w.length > 3)) : [];
      const triggeredSkills = settings.activateSkillsByDefault && shouldTriggerSkill(text, activeSkills)
        ? activeSkills.filter(s => s.triggerKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) : [];

      const activeProvider = providers.find(p => p.id === settings.activeProviderId && p.enabled && p.status === 'connected');
      const startTime = Date.now();
      let responseText = ''; let mode: 'online' | 'local' | 'demo' = 'demo'; let providerName = 'Demo'; let model = 'Demo';

      if (activeProvider) {
        const sysp = buildSystemPrompt(usedMems, triggeredSkills);
        responseText = await sendAIMessage(updatedMessages.map(m => ({ role: m.role, content: m.content })), sysp, activeProvider, {});
        mode = activeProvider.mode as 'online' | 'local'; providerName = activeProvider.name; model = activeProvider.selectedModel;
      } else {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
        responseText = generateDemoResponse(classifyMessageIntent(text), text, usedMems, triggeredSkills, settings);
      }

      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: responseText, createdAt: new Date().toISOString(), usedMemoryIds: usedMems.map(m => m.id), triggeredSkillIds: triggeredSkills.map(s => s.id), metadata: { providerId: activeProvider?.id || 'demo', providerName, model, mode, latencyMs: Date.now() - startTime, streaming: false, usedMemoryIds: usedMems.map(m => m.id), triggeredSkillIds: triggeredSkills.map(s => s.id) } };
      updateConversation(convId, { messages: [...updatedMessages, assistantMsg], updatedAt: new Date().toISOString() });
    } catch (err: any) {
      const errMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${err.message || 'Something went wrong.'}`, createdAt: new Date().toISOString(), usedMemoryIds: [], triggeredSkillIds: [], metadata: { providerId: 'error', providerName: 'Error', model: 'N/A', mode: 'demo', streaming: false, usedMemoryIds: [], triggeredSkillIds: [], error: err.message } };
      updateConversation(convId, { messages: [...updatedMessages, errMsg], updatedAt: new Date().toISOString() });
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally { setIsTyping(false); scrollToBottom(); }
  }, [activeConvId, conversations, memories, skills, settings, providers, addConversation, updateConversation, setActiveConversationId, setLocation, scrollToBottom, toast]);

  function buildSystemPrompt(usedMems: typeof memories, triggeredSkills: typeof skills) {
    let p = `You are Hermes AI Agent, a professional autonomous assistant. Be clear, practical, and concise.`;
    if (settings.responseStyle === 'concise') p += ' Keep responses brief.';
    if (settings.responseStyle === 'detailed') p += ' Provide detailed responses.';
    p += `\n\nFILE CREATION: When the user asks you to create, write, or generate any file (code file, document, config, script, etc.), always include the file content using this exact format so the user gets a download button:\n\`\`\`typescript src/example.ts\n// file content here\n\`\`\`\nFor the code fence, put the language and filename together on the opening line like: \`\`\`typescript src/App.tsx\nFor non-code text files use: [FILE: filename.md]\ncontent here\n[/FILE]\nAlways use a real filename that makes sense for the content.`;
    if (usedMems.length > 0) p += '\n\nUser memory:\n' + usedMems.map(m => `- ${m.content}`).join('\n');
    if (triggeredSkills.length > 0) p += '\n\nActive skills:\n' + triggeredSkills.map(s => `- ${s.name}: ${s.instructionPrompt}`).join('\n');
    return p;
  }

  if (urlConvId && !conversations.find(c => c.id === urlConvId)) return <ConversationNotFound />;

  const activeProvider = providers.find(p => p.id === settings.activeProviderId && p.status === 'connected');
  const messages = activeConv?.messages || [];

  return (
    <div className="flex flex-col h-screen" data-testid="chat-page">

      {/* ── Top bar ── */}
      <div className="glass-bar border-t-0 border-b border-border/50 px-4 py-2.5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[8px] bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black select-none">H</span>
          </div>
          <h1 className="text-sm font-semibold truncate text-foreground">{activeConv?.title || 'New Chat'}</h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {memories.some(m => m.active) && (
            <span title="Memory active" className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Brain className="w-3 h-3 text-cyan-400" />
            </span>
          )}
          {skills.some(s => s.enabled) && (
            <span title="Skills active" className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-violet-400" />
            </span>
          )}
          <span className={cn(
            'text-[11px] px-2.5 py-1 rounded-full border font-semibold',
            activeProvider
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/18'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/18'
          )}>
            {activeProvider ? activeProvider.selectedModel.split('/').pop() : 'Demo'}
          </span>
        </div>
      </div>

      {/* ── Messages scroll area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4"
        data-testid="chat-messages"
        style={{
          /* mobile: input bar (~80px) + pill nav + gap (20+64+12=96) = ~176px total; desktop: just input bar */
          paddingBottom: 'calc(80px + 96px + env(safe-area-inset-bottom))',
        }}
      >
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center min-h-full gap-6 py-8">
            <div className="w-16 h-16 rounded-2xl glass-strong relative overflow-hidden glass-shine flex items-center justify-center">
              <span className="text-primary font-bold text-2xl relative z-10">H</span>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeProvider ? `Connected to ${activeProvider.name}` : 'Demo Mode — configure an AI model for real responses'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl px-2">
              {STARTER_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => handleSend(prompt)}
                  className="text-left text-sm glass-card rounded-2xl px-4 py-3 text-muted-foreground hover:text-foreground transition-all">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} memories={memories} skills={skills} />)}
        {isTyping && <TypingIndicator />}
      </div>

      {/*
        ── Input bar ──
        Mobile: fixed at bottom-[96px] so it floats ABOVE the pill nav
                (pill nav is at bottom-5=20px, ~64px tall → top of nav = 84px from bottom)
                input sits at 96px from bottom, so there's ~12px gap between input and nav
        Desktop: fixed at bottom-0, left-60 (sidebar width)
      */}
      <div className="fixed bottom-[96px] left-0 right-0 z-40 md:bottom-0 md:left-60">
        <ChatInput onSend={handleSend} onNewChat={createNewConversation} disabled={isTyping} />
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <ErrorBoundary variant="chat">
      <ChatContent />
    </ErrorBoundary>
  );
}
