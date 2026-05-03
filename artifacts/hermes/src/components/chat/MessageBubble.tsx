import { Message, Memory, Skill } from '@/types';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Brain, Zap, Download, Copy, Check, FileText } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  memories?: Memory[];
  skills?: Skill[];
}

/* ── File download helper ─────────────────────────────────────── */
function downloadFile(filename: string, content: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || 'txt';
  const mimeMap: Record<string, string> = {
    ts: 'text/typescript', tsx: 'text/typescript', js: 'text/javascript',
    jsx: 'text/javascript', py: 'text/x-python', json: 'application/json',
    html: 'text/html', css: 'text/css', md: 'text/markdown',
    sh: 'text/x-sh', kt: 'text/plain', swift: 'text/plain',
    java: 'text/plain', sql: 'text/plain', xml: 'text/xml',
    yaml: 'text/yaml', yml: 'text/yaml', csv: 'text/csv',
    txt: 'text/plain',
  };
  const mime = mimeMap[ext] || 'text/plain';
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ── Content parser ───────────────────────────────────────────── */
type Segment =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; filename?: string; content: string }
  | { type: 'file'; filename: string; content: string };

function parseContent(raw: string): Segment[] {
  const segments: Segment[] = [];
  let remaining = raw;

  // Match [FILE: name] ... [/FILE] blocks and code fences alternately
  const BLOCK_RE = /(\[FILE:\s*([^\]]+)\]\n([\s\S]*?)\[\/FILE\]|```([a-zA-Z0-9._\-/]*)\s*([^\n]*)?\n([\s\S]*?)```)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = BLOCK_RE.exec(remaining)) !== null) {
    const before = remaining.slice(lastIndex, match.index);
    if (before) segments.push({ type: 'text', content: before });

    if (match[1].startsWith('[FILE:')) {
      // [FILE: filename]\ncontent\n[/FILE]
      segments.push({ type: 'file', filename: match[2].trim(), content: match[3] });
    } else {
      // Code block — extract filename from lang specifier or first-line comment
      let lang = match[4] || '';
      const hint = match[5]?.trim() || '';
      const codeBody = match[6] || '';

      // Lang may contain a filename e.g. "typescript src/App.tsx" or "python"
      let filename: string | undefined;
      if (lang.includes('/') || lang.includes('.')) {
        filename = lang;
        lang = guessLangFromFilename(filename);
      } else if (hint && (hint.includes('/') || hint.includes('.'))) {
        filename = hint;
      } else if (hint && !hint.includes(' ')) {
        // single-word hint without extension treated as filename if looks like one
        filename = hint || undefined;
      }

      // Also check first line for "// filename.ext" or "# filename.ext"
      if (!filename) {
        const firstLine = codeBody.split('\n')[0].trim();
        const commentMatch = firstLine.match(/^(?:\/\/|#|--|\/\*)\s+([\w.\-/]+\.\w+)$/);
        if (commentMatch) filename = commentMatch[1];
      }

      segments.push({ type: 'code', lang, filename, content: codeBody });
    }
    lastIndex = match.index + match[0].length;
  }

  const tail = remaining.slice(lastIndex);
  if (tail) segments.push({ type: 'text', content: tail });

  return segments.length > 0 ? segments : [{ type: 'text', content: raw }];
}

function guessLangFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', py: 'python', sh: 'bash', kt: 'kotlin', swift: 'swift', java: 'java', json: 'json', html: 'html', css: 'css', md: 'markdown', sql: 'sql', yaml: 'yaml', yml: 'yaml' };
  return map[ext] || ext || 'text';
}

/* ── Code block renderer ──────────────────────────────────────── */
function CodeBlock({ lang, filename, content }: { lang: string; filename?: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(content.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [content]);

  const displayLang = filename || lang || 'code';

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 text-[12.5px] my-1.5">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-muted/60 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <span className="text-[11px] text-muted-foreground font-mono font-medium">{displayLang}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {filename && (
            <button
              onClick={() => downloadFile(filename, content.trim())}
              title={`Download ${filename}`}
              className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-primary/10"
            >
              <Download className="w-3 h-3" />
              <span>Save</span>
            </button>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-foreground/10"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      {/* Code */}
      <pre className="overflow-x-auto p-3.5 bg-muted/30">
        <code className="font-mono text-[12.5px] leading-relaxed text-foreground/90 whitespace-pre break-normal">
          {content.trim()}
        </code>
      </pre>
    </div>
  );
}

/* ── File block renderer ──────────────────────────────────────── */
function FileBlock({ filename, content }: { filename: string; content: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden border border-green-500/25 bg-green-500/8 my-1.5">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-green-500/10 border-b border-green-500/20">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[12px] text-green-400 font-medium font-mono">{filename}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(content.trim());
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors px-1.5 py-0.5 rounded"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={() => downloadFile(filename, content.trim())}
            className="flex items-center gap-1 text-[11px] bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors px-2.5 py-1 rounded-lg font-semibold"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-3.5 max-h-48">
        <code className="font-mono text-[12px] leading-relaxed text-foreground/80 whitespace-pre break-normal">
          {content.trim()}
        </code>
      </pre>
    </div>
  );
}

/* ── Rendered message content ─────────────────────────────────── */
function MessageContent({ content }: { content: string }) {
  const segments = parseContent(content);

  return (
    <div>
      {segments.map((seg, i) => {
        if (seg.type === 'code') {
          return <CodeBlock key={i} lang={seg.lang} filename={seg.filename} content={seg.content} />;
        }
        if (seg.type === 'file') {
          return <FileBlock key={i} filename={seg.filename} content={seg.content} />;
        }
        // Text — render with line breaks preserved
        return (
          <span key={i} className="whitespace-pre-wrap break-words">
            {seg.content}
          </span>
        );
      })}
    </div>
  );
}

/* ── Main MessageBubble ───────────────────────────────────────── */
export function MessageBubble({ message, memories = [], skills = [] }: MessageBubbleProps) {
  const [metaOpen, setMetaOpen] = useState(false);
  const isUser = message.role === 'user';
  const usedMems   = memories.filter(m => message.usedMemoryIds?.includes(m.id));
  const usedSkills = skills.filter(s => message.triggeredSkillIds?.includes(s.id));
  const hasMeta    = !!message.metadata || usedMems.length > 0 || usedSkills.length > 0;

  return (
    <div
      data-testid={`message-${message.id}`}
      className={cn('flex gap-2.5 group', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <span className="text-white text-xs font-black select-none">H</span>
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[86%] md:max-w-[72%]', isUser && 'items-end')}>
        {/* Bubble */}
        <div className={cn(
          'px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-[6px] shadow-sm'
            : 'glass-bubble-ai text-foreground rounded-bl-[6px]'
        )}>
          {isUser
            ? <span className="whitespace-pre-wrap break-words">{message.content}</span>
            : <MessageContent content={message.content} />
          }
        </div>

        {/* Context chips */}
        {!isUser && (usedMems.length > 0 || usedSkills.length > 0) && (
          <div className="flex flex-wrap gap-1 px-1">
            {usedMems.map(m => (
              <span key={m.id} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/15 text-cyan-500 font-medium">
                <Brain className="w-2.5 h-2.5" />{m.title}
              </span>
            ))}
            {usedSkills.map(s => (
              <span key={s.id} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-400 font-medium">
                <Zap className="w-2.5 h-2.5" />{s.name}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp + meta toggle */}
        <div className={cn('flex items-center gap-2 px-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-[10px] text-muted-foreground/35 opacity-0 group-hover:opacity-100 transition-opacity">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {!isUser && hasMeta && (
            <button
              onClick={() => setMetaOpen(o => !o)}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              {metaOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              {message.metadata?.mode === 'demo' ? 'demo' : (message.metadata?.model?.split('/').pop() || 'detail')}
            </button>
          )}
        </div>

        {/* Expanded metadata */}
        {!isUser && hasMeta && metaOpen && (
          <div className="glass-card rounded-xl p-3 text-xs space-y-1.5 w-full max-w-[260px]">
            {message.metadata && (
              <>
                <MetaRow label="Provider" value={message.metadata.providerName} />
                <MetaRow label="Model"    value={message.metadata.model} truncate />
                <MetaRow label="Mode"     value={message.metadata.mode}
                  valueClass={
                    message.metadata.mode === 'demo'  ? 'text-amber-400' :
                    message.metadata.mode === 'local' ? 'text-cyan-400'  : 'text-emerald-400'
                  } />
                {message.metadata.latencyMs && <MetaRow label="Latency" value={`${message.metadata.latencyMs}ms`} />}
              </>
            )}
            {usedMems.length > 0   && <MetaRow label="Memories" value={usedMems.map(m => m.title).join(', ')}   valueClass="text-cyan-400"   />}
            {usedSkills.length > 0 && <MetaRow label="Skills"   value={usedSkills.map(s => s.name).join(', ')} valueClass="text-violet-400" />}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-[10px] bg-foreground/10 border border-border flex items-center justify-center shrink-0 mt-1">
          <span className="text-foreground/80 text-xs font-bold select-none">U</span>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value, valueClass = 'text-foreground/80', truncate }: { label: string; value: string; valueClass?: string; truncate?: boolean }) {
  return (
    <div className="flex justify-between gap-2 items-baseline">
      <span className="text-muted-foreground/60 shrink-0 text-[11px]">{label}</span>
      <span className={cn(valueClass, 'text-[11px]', truncate && 'truncate max-w-[140px]')}>{value}</span>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5" data-testid="typing-indicator">
      <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-primary/80 to-accent/70 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-white text-xs font-black select-none">H</span>
      </div>
      <div className="glass-bubble-ai px-4 py-3 rounded-2xl rounded-bl-[6px] flex items-center gap-1.5">
        {[0,1,2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
