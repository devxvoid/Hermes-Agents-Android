import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Message, Conversation } from '@/types';
import { MessageBubble, TypingIndicator } from '@/components/chat/MessageBubble';
import { AttachmentMenu } from '@/components/ui/AttachmentMenu';
import { classifyMessageIntent, shouldUseMemory, shouldTriggerSkill, generateDemoResponse } from '@/lib/agentEngine';
import { sendAIMessage } from '@/lib/ai/aiClient';
import { useToast } from '@/hooks/use-toast';
import {
  Mic, BarChart2, Plus, SlidersHorizontal,
  Sparkles, Send, Paperclip, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Suggestion chips shown when conversation is empty ── */
const SUGGESTIONS = [
  { emoji: '💬', label: 'Start a new chat'      },
  { emoji: '🧠', label: 'Search my memories'    },
  { emoji: '📝', label: 'Write anything'         },
  { emoji: '✨', label: 'Boost my day'            },
];

interface AttachedFile { name: string; content: string; type: string; }

export default function Dashboard() {
  const {
    settings, memories, skills, providers,
    conversations, addConversation, updateConversation,
  } = useApp();
  const { toast } = useToast();

  /* ── Local state ── */
  const [convId,       setConvId]       = useState<string | null>(null);
  const [isTyping,     setIsTyping]     = useState(false);
  const [inputValue,   setInputValue]   = useState('');
  const [attachments,  setAttachments]  = useState<AttachedFile[]>([]);
  const [attachOpen,   setAttachOpen]   = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);

  /* ── Derived ── */
  const activeConv = convId ? conversations.find(c => c.id === convId) : null;
  const messages   = activeConv?.messages ?? [];
  const isEmpty    = messages.length === 0 && !isTyping;
  const activeProvider = providers.find(
    p => p.id === settings.activeProviderId && p.enabled && p.status === 'connected'
  );

  /* ── Pick up chip pre-fill from navigation ── */
  useEffect(() => {
    const pre = sessionStorage.getItem('chat_prefill');
    if (pre) { sessionStorage.removeItem('chat_prefill'); setInputValue(pre); }
  }, []);

  /* ── Listen for "New chat" signal from drawer ── */
  useEffect(() => {
    const reset = () => {
      setConvId(null);
      setInputValue('');
      setAttachments([]);
      setIsTyping(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };
    window.addEventListener('mr-robot-new-chat', reset);
    return () => window.removeEventListener('mr-robot-new-chat', reset);
  }, []);

  /* ── Auto-scroll ── */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages.length, isTyping, scrollToBottom]);

  /* ── Textarea auto-resize ── */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  /* ── File processing ── */
  const processFile = useCallback(async (file: File) => {
    try {
      const content = file.type.startsWith('image/')
        ? await readAsDataURL(file)
        : await readAsText(file);
      setAttachments(prev => [...prev, { name: file.name, content, type: file.type }].slice(0, 5));
    } catch {
      setAttachments(prev => [...prev, { name: file.name, content: `[Binary file]`, type: file.type }].slice(0, 5));
    }
  }, []);

  /* ── Send message ── */
  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    /* Create conversation if needed */
    let cid = convId;
    let conv = cid ? conversations.find(c => c.id === cid) : null;
    if (!conv) {
      const id = crypto.randomUUID();
      const newConv: Conversation = {
        id, title: trimmed.slice(0, 50) || 'New Chat', messages: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        pinned: false, archived: false, tags: [],
      };
      addConversation(newConv);
      setConvId(id);
      cid = id; conv = newConv;
    }

    /* Build message text (embed attachments) */
    let msgText = trimmed;
    if (attachments.length > 0) {
      const parts = attachments.map(f =>
        f.type.startsWith('image/')
          ? `[Image: ${f.name}]`
          : `[File: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``
      ).join('\n\n');
      msgText = msgText ? `${msgText}\n\n${parts}` : parts;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(), role: 'user', content: msgText,
      createdAt: new Date().toISOString(), usedMemoryIds: [], triggeredSkillIds: [],
    };
    const updated = [...(conv.messages ?? []), userMsg];
    const title   = conv.messages.length === 0 ? trimmed.slice(0, 60) : conv.title;
    updateConversation(cid!, { messages: updated, title, updatedAt: new Date().toISOString() });

    setInputValue('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);
    scrollToBottom();

    try {
      const activeMems   = memories.filter(m => m.active);
      const activeSkills = skills.filter(s => s.enabled);
      const useMem = settings.useMemoryByDefault && shouldUseMemory(trimmed, activeMems);
      const usedMems = useMem
        ? activeMems.filter(m => m.content.toLowerCase().split(/\s+/).some(w => trimmed.toLowerCase().split(/\s+/).includes(w) && w.length > 3))
        : [];
      const triggered = settings.activateSkillsByDefault && shouldTriggerSkill(trimmed, activeSkills)
        ? activeSkills.filter(s => s.triggerKeywords.some(kw => trimmed.toLowerCase().includes(kw.toLowerCase())))
        : [];

      const t0 = Date.now();
      let responseText = '';
      let mode: 'online' | 'local' | 'demo' = 'demo';
      let providerName = 'Demo';
      let model = 'Demo';

      if (activeProvider) {
        const sysp = buildSystemPrompt(usedMems, triggered);
        responseText = await sendAIMessage(
          updated.map(m => ({ role: m.role, content: m.content })),
          sysp, activeProvider, {}
        );
        mode = activeProvider.mode as 'online' | 'local';
        providerName = activeProvider.name;
        model = activeProvider.selectedModel;
      } else {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
        responseText = generateDemoResponse(classifyMessageIntent(trimmed), trimmed, usedMems, triggered, settings);
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(), role: 'assistant', content: responseText,
        createdAt: new Date().toISOString(),
        usedMemoryIds: usedMems.map(m => m.id),
        triggeredSkillIds: triggered.map(s => s.id),
        metadata: {
          providerId: activeProvider?.id ?? 'demo', providerName, model, mode,
          latencyMs: Date.now() - t0, streaming: false,
          usedMemoryIds: usedMems.map(m => m.id),
          triggeredSkillIds: triggered.map(s => s.id),
        },
      };
      updateConversation(cid!, { messages: [...updated, assistantMsg], updatedAt: new Date().toISOString() });
    } catch (err: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(), role: 'assistant',
        content: `Error: ${err.message ?? 'Something went wrong.'}`,
        createdAt: new Date().toISOString(), usedMemoryIds: [], triggeredSkillIds: [],
        metadata: { providerId: 'error', providerName: 'Error', model: 'N/A', mode: 'demo', streaming: false, usedMemoryIds: [], triggeredSkillIds: [], error: err.message },
      };
      updateConversation(cid!, { messages: [...updated, errMsg], updatedAt: new Date().toISOString() });
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId, conversations, memories, skills, settings, providers, attachments, addConversation, updateConversation, scrollToBottom, toast]);

  function buildSystemPrompt(usedMems: typeof memories, triggered: typeof skills) {
    let p = `You are ${settings.agentName}, a professional autonomous AI assistant. Be clear, practical, and concise.`;
    if (settings.responseStyle === 'concise') p += ' Keep responses brief.';
    if (settings.responseStyle === 'detailed') p += ' Provide detailed responses.';
    if (usedMems.length  > 0) p += '\n\nUser memory:\n'  + usedMems.map(m => `- ${m.content}`).join('\n');
    if (triggered.length > 0) p += '\n\nActive skills:\n' + triggered.map(s => `- ${s.name}: ${s.instructionPrompt}`).join('\n');
    return p;
  }

  /* ── Bottom bar height estimate for scroll padding ── */
  const BOTTOM_BAR_H = attachments.length > 0 ? 160 : 128;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ══════ Greeting (empty state) ══════ */}
      {isEmpty ? (
        <div className="flex-1 px-6 pt-10 md:pt-16" style={{ paddingBottom: BOTTOM_BAR_H + 16 }}>
          <div className="mb-10">
            <p className="text-base text-foreground/55 font-medium mb-1">
              Hi {settings.agentName}
            </p>
            <h1 className="text-[32px] md:text-[40px] font-bold text-foreground leading-tight tracking-tight">
              Where should we start?
            </h1>
          </div>

          <div className="flex flex-col gap-3 max-w-sm">
            {SUGGESTIONS.map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => { setInputValue(label); setTimeout(() => textareaRef.current?.focus(), 50); }}
                className="gemini-chip flex items-center gap-3 px-5 py-3.5 rounded-full text-left w-fit"
              >
                <span className="text-xl leading-none select-none">{emoji}</span>
                <span className="text-[15px] font-medium text-foreground/90">{label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ══════ Messages area ══════ */
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 space-y-4"
          style={{ paddingBottom: BOTTOM_BAR_H + 16 }}
        >
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} memories={memories} skills={skills} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      )}

      {/* ══════ Fixed bottom input bar ══════ */}
      <div
        className="fixed bottom-0 left-0 right-0 md:left-[220px] px-4 pt-3 gemini-bottom-bar"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 px-1">
            {attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1 text-xs font-medium text-primary"
              >
                {file.type.startsWith('image/') ? (
                  <img src={file.content} alt={file.name} className="w-5 h-5 rounded object-cover" />
                ) : (
                  <Paperclip className="w-3 h-3 shrink-0" />
                )}
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                  <X className="w-3 h-3 text-primary/60 hover:text-primary" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input pill — real textarea inside */}
        <div
          className="gemini-input-pill w-full px-4 pt-3.5 pb-3 mb-3 flex items-end gap-2"
          onClick={() => textareaRef.current?.focus()}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); autoResize(); }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(inputValue); }
            }}
            placeholder={`Ask ${settings.agentName}…`}
            rows={1}
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-foreground/35 outline-none resize-none leading-relaxed self-center"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />

          {/* Send button — appears when there is content */}
          {(inputValue.trim() || attachments.length > 0) && (
            <button
              onClick={() => handleSend(inputValue)}
              className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 active:scale-90 transition-all"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-1">
          {/* Left: attach + tools */}
          <div className="flex items-center gap-5">
            <button
              className="text-foreground/50 hover:text-foreground/80 transition-colors active:scale-90"
              onClick={e => { e.stopPropagation(); setAttachOpen(v => !v); }}
            >
              <Plus className="w-[22px] h-[22px]" strokeWidth={1.8} />
            </button>
            <button className="text-foreground/50 hover:text-foreground/80 transition-colors active:scale-90">
              <SlidersHorizontal className="w-[20px] h-[20px]" strokeWidth={1.8} />
            </button>
          </div>

          {/* Right: model badge + mic + analyze */}
          <div className="flex items-center gap-4">
            <div className="gemini-speed-badge flex items-center gap-1.5 px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-foreground/60" />
              <span className="text-[13px] font-medium text-foreground/70">
                {activeProvider ? (activeProvider.selectedModel.split('/').pop()?.slice(0, 8) ?? 'AI') : 'Demo'}
              </span>
            </div>
            <button className="text-foreground/55 hover:text-foreground/80 transition-colors active:scale-90">
              <Mic className="w-[22px] h-[22px]" strokeWidth={1.8} />
            </button>
            <button className="text-foreground/55 hover:text-foreground/80 transition-colors active:scale-90">
              <BarChart2 className="w-[22px] h-[22px]" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* Attachment menu */}
      <AttachmentMenu
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        onFile={processFile}
        bottomOffset={130}
      />
    </div>
  );
}

/* ── File utilities ── */
function readAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target?.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}
function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target?.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
