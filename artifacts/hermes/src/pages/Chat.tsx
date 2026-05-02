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

function ConversationNotFound({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
        <MessageSquare className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Conversation not found</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          This chat may have been deleted or the saved data may be outdated.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <Button onClick={() => setLocation('/conversations')} variant="outline" size="sm">Go to Chats</Button>
        <Button onClick={() => setLocation('/chat')} size="sm">Start New Chat</Button>
      </div>
    </div>
  );
}

function ChatContent() {
  const [match, params] = useRoute('/chat/:conversationId');
  const [, setLocation] = useLocation();
  const { conversations, memories, skills, settings, providers, addConversation, updateConversation, setActiveConversationId } = useApp();
  const { toast } = useToast();
  const [isTyping, setIsTyping] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const urlConvId = match ? params?.conversationId : null;

  useEffect(() => {
    if (urlConvId) {
      const exists = conversations.find(c => c.id === urlConvId);
      if (exists) {
        setActiveConvId(urlConvId);
        setActiveConversationId(urlConvId);
      }
    }
  }, [urlConvId, conversations, setActiveConversationId]);

  const activeConv = activeConvId ? conversations.find(c => c.id === activeConvId) : null;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages?.length, isTyping, scrollToBottom]);

  const createNewConversation = useCallback(() => {
    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      archived: false,
      tags: [],
    };
    addConversation(conv);
    setActiveConvId(id);
    setActiveConversationId(id);
    setLocation(`/chat/${id}`);
  }, [addConversation, setActiveConversationId, setLocation]);

  const handleSend = useCallback(async (text: string) => {
    let convId = activeConvId;
    let conv = convId ? conversations.find(c => c.id === convId) : null;

    if (!conv) {
      const id = crypto.randomUUID();
      const newConv: Conversation = {
        id,
        title: text.slice(0, 50) || 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
        archived: false,
        tags: [],
      };
      addConversation(newConv);
      setActiveConvId(id);
      setActiveConversationId(id);
      convId = id;
      conv = newConv;
      setLocation(`/chat/${id}`);
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      usedMemoryIds: [],
      triggeredSkillIds: [],
    };

    const updatedMessages = [...(conv.messages || []), userMsg];
    const title = conv.messages.length === 0 ? text.slice(0, 60) : conv.title;
    updateConversation(convId, { messages: updatedMessages, title, updatedAt: new Date().toISOString() });

    setIsTyping(true);
    scrollToBottom();

    try {
      const intent = classifyMessageIntent(text);
      const activeMemories = memories.filter(m => m.active);
      const activeSkills = skills.filter(s => s.enabled);
      const useMemory = settings.useMemoryByDefault && shouldUseMemory(text, activeMemories);
      const usedMems = useMemory ? activeMemories.filter(m => {
        const words = text.toLowerCase().split(/\s+/);
        const memWords = m.content.toLowerCase().split(/\s+/);
        return words.some(w => w.length > 3 && memWords.includes(w));
      }) : [];
      const triggeredSkillsCheck = settings.activateSkillsByDefault && shouldTriggerSkill(text, activeSkills);
      const triggeredSkills = triggeredSkillsCheck ? activeSkills.filter(s =>
        s.triggerKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))
      ) : [];

      const activeProvider = providers.find(p => p.id === settings.activeProviderId && p.enabled && p.status === 'connected');
      const startTime = Date.now();
      let responseText = '';
      let mode: 'online' | 'local' | 'demo' = 'demo';
      let providerName = 'Demo';
      let model = 'Demo';

      if (activeProvider) {
        const systemPrompt = buildSystemPrompt(usedMems, triggeredSkills);
        const msgHistory = updatedMessages.map(m => ({ role: m.role, content: m.content }));
        responseText = await sendAIMessage(msgHistory, systemPrompt, activeProvider, {});
        mode = activeProvider.mode as 'online' | 'local';
        providerName = activeProvider.name;
        model = activeProvider.selectedModel;
      } else {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
        responseText = generateDemoResponse(intent, text, usedMems, triggeredSkills, settings);
        mode = 'demo';
      }

      const latencyMs = Date.now() - startTime;
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseText,
        createdAt: new Date().toISOString(),
        usedMemoryIds: usedMems.map(m => m.id),
        triggeredSkillIds: triggeredSkills.map(s => s.id),
        metadata: {
          providerId: activeProvider?.id || 'demo',
          providerName,
          model,
          mode,
          latencyMs,
          usedMemoryIds: usedMems.map(m => m.id),
          triggeredSkillIds: triggeredSkills.map(s => s.id),
          streaming: false,
        },
      };

      updateConversation(convId, {
        messages: [...updatedMessages, assistantMsg],
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${err.message || 'Something went wrong. Check your AI provider settings.'}`,
        createdAt: new Date().toISOString(),
        usedMemoryIds: [],
        triggeredSkillIds: [],
        metadata: {
          providerId: 'error',
          providerName: 'Error',
          model: 'N/A',
          mode: 'demo',
          usedMemoryIds: [],
          triggeredSkillIds: [],
          streaming: false,
          error: err.message,
        },
      };
      updateConversation(convId, { messages: [...updatedMessages, errMsg], updatedAt: new Date().toISOString() });
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }, [activeConvId, conversations, memories, skills, settings, providers, addConversation, updateConversation, setActiveConversationId, setLocation, scrollToBottom, toast]);

  function buildSystemPrompt(usedMems: typeof memories, triggeredSkills: typeof skills): string {
    let prompt = `You are Hermes AI Agent, a professional autonomous assistant. Use relevant memories and enabled skills only when they genuinely improve the answer. Be clear, practical, and concise unless the user requests detail.`;
    if (settings.responseStyle === 'concise') prompt += ' Keep responses concise and to the point.';
    if (settings.responseStyle === 'detailed') prompt += ' Provide detailed and thorough responses.';
    if (usedMems.length > 0) {
      prompt += '\n\nRelevant user memory:\n' + usedMems.map(m => `- ${m.content}`).join('\n');
    }
    if (triggeredSkills.length > 0) {
      prompt += '\n\nActivated skills:\n' + triggeredSkills.map(s => `- ${s.name}: ${s.instructionPrompt}`).join('\n');
    }
    return prompt;
  }

  if (urlConvId && !conversations.find(c => c.id === urlConvId)) {
    return <ConversationNotFound id={urlConvId} />;
  }

  const activeProvider = providers.find(p => p.id === settings.activeProviderId && p.status === 'connected');
  const messages = activeConv?.messages || [];

  return (
    /* Full-height flex column — fills the space between the sidebar header and bottom */
    <div className="flex flex-col h-screen" data-testid="chat-page">

      {/* ── Top bar ── */}
      <div className="glass-nav border-t-0 border-b border-white/[0.07] px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <h1 className="text-sm font-semibold text-foreground truncate">
          {activeConv?.title || 'New Chat'}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full border font-medium',
            activeProvider
              ? 'bg-green-500/15 text-green-400 border-green-500/20'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
          )}>
            {activeProvider ? activeProvider.selectedModel : 'Demo'}
          </span>
          {memories.some(m => m.active) && (
            <span className="text-xs px-1.5 py-0.5 rounded border glass text-cyan-400 border-cyan-500/20 flex items-center gap-1">
              <Brain className="w-3 h-3" />
            </span>
          )}
          {skills.some(s => s.enabled) && (
            <span className="text-xs px-1.5 py-0.5 rounded border glass text-violet-400 border-violet-500/20 flex items-center gap-1">
              <Zap className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* ── Messages scroll area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4
          pb-[calc(80px+env(safe-area-inset-bottom))]
          md:pb-[72px]"
        data-testid="chat-messages"
      >
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center min-h-full gap-6 py-8">
            <div className="w-16 h-16 rounded-2xl glass-strong glass-shine flex items-center justify-center">
              <span className="text-primary font-bold text-2xl">H</span>
            </div>
            <div className="text-center px-4">
              <h2 className="text-lg font-semibold text-foreground">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeProvider
                  ? `Connected to ${activeProvider.name}`
                  : 'Demo Mode — configure an AI model for real responses'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl px-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-sm glass-card rounded-xl px-4 py-3 text-muted-foreground hover:text-foreground transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} memories={memories} skills={skills} />
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {/* ── Chat input — sits above mobile nav, flush with sidebar on desktop ── */}
      <div className="
        fixed bottom-[64px] left-0 right-0 z-40
        md:bottom-0 md:left-60
      ">
        <ChatInput
          onSend={handleSend}
          onNewChat={createNewConversation}
          disabled={isTyping}
        />
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
