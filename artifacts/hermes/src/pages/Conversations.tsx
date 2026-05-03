import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useLocation } from 'wouter';
import { Conversation, Message } from '@/types';
import {
  Search, Pin, Archive, Trash2, Edit2, MessageSquare, MoreHorizontal,
  Clock, X, User, Bot, FileSearch, SlidersHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'pinned' | 'archived';

/* ── Search helpers ─────────────────────────────────────────── */
interface MessageMatch {
  message: Message;
  snippet: string;
}
interface SearchResult {
  conversation: Conversation;
  titleMatch: boolean;
  messageMatches: MessageMatch[];
  totalMatches: number;
}

function getSnippet(content: string, query: string, radius = 55): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, radius * 2) + (content.length > radius * 2 ? '…' : '');
  const start = Math.max(0, idx - radius);
  const end   = Math.min(content.length, idx + query.length + radius);
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5 not-italic font-semibold">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

function fullTextSearch(conversations: Conversation[], query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.trim();

  return conversations
    .map(conv => {
      const titleMatch = conv.title.toLowerCase().includes(q.toLowerCase());
      const messageMatches: MessageMatch[] = conv.messages
        .filter(m => m.content.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 3) // cap at 3 per conversation for perf
        .map(m => ({ message: m, snippet: getSnippet(m.content, q) }));

      if (!titleMatch && messageMatches.length === 0) return null;
      return {
        conversation: conv,
        titleMatch,
        messageMatches,
        totalMatches: (titleMatch ? 1 : 0) + conv.messages.filter(m => m.content.toLowerCase().includes(q.toLowerCase())).length,
      };
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => b.totalMatches - a.totalMatches);
}

/* ── Conversation card ──────────────────────────────────────── */
function ConvCard({
  conv,
  onOpen,
  onRename,
  onDelete,
  onUpdate,
  searchQuery = '',
}: {
  conv: Conversation;
  onOpen: () => void;
  onRename: (c: Conversation) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Conversation>) => void;
  searchQuery?: string;
}) {
  const lastMsg = conv.messages[conv.messages.length - 1];

  return (
    <div
      data-testid={`conversation-${conv.id}`}
      className="group glass-card rounded-2xl p-4 cursor-pointer hover:border-primary/20 transition-all"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/12 border border-primary/18 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {conv.pinned && <Pin className="w-3 h-3 text-primary/80 shrink-0" />}
            <span className="font-semibold text-foreground text-sm leading-snug">
              {searchQuery
                ? <Highlight text={conv.title} query={searchQuery} />
                : conv.title}
            </span>
            {conv.archived && (
              <span className="text-[10px] text-muted-foreground/60 bg-muted/50 border border-border px-1.5 py-0.5 rounded shrink-0 ml-1">Archived</span>
            )}
          </div>
          {lastMsg && (
            <p className="text-xs text-muted-foreground truncate leading-relaxed">
              {lastMsg.role === 'assistant' ? '🤖 ' : '👤 '}{lastMsg.content.slice(0, 80)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
            </span>
            <span>{conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0" data-testid={`btn-conv-menu-${conv.id}`}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={e => e.stopPropagation()} className="glass-card">
            <DropdownMenuItem onClick={() => onRename(conv)}><Edit2 className="w-4 h-4 mr-2" />Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate(conv.id, { pinned: !conv.pinned })}><Pin className="w-4 h-4 mr-2" />{conv.pinned ? 'Unpin' : 'Pin'}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate(conv.id, { archived: !conv.archived })}><Archive className="w-4 h-4 mr-2" />{conv.archived ? 'Unarchive' : 'Archive'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(conv.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ── Search result card ─────────────────────────────────────── */
function SearchResultCard({
  result,
  query,
  onOpen,
}: {
  result: SearchResult;
  query: string;
  onOpen: () => void;
}) {
  const conv = result.conversation;

  return (
    <div
      data-testid={`search-result-${conv.id}`}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:border-primary/25 transition-all"
      onClick={onOpen}
    >
      {/* Conversation header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5 border-b border-border/40">
        <div className="w-7 h-7 rounded-lg bg-primary/12 flex items-center justify-center shrink-0">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">
            <Highlight text={conv.title} query={query} />
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            {conv.messages.length} messages · {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
          </p>
        </div>
        <span className="text-[10px] font-semibold bg-primary/12 border border-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0">
          {result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Message snippets */}
      {result.messageMatches.length > 0 && (
        <div className="divide-y divide-border/30">
          {result.messageMatches.map(({ message, snippet }) => (
            <div key={message.id} className="flex items-start gap-2.5 px-4 py-3">
              <div className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                message.role === 'assistant' ? 'bg-accent/20' : 'bg-foreground/10'
              )}>
                {message.role === 'assistant'
                  ? <Bot className="w-2.5 h-2.5 text-primary/70" />
                  : <User className="w-2.5 h-2.5 text-foreground/60" />
                }
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1 min-w-0">
                <Highlight text={snippet} query={query} />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function Conversations() {
  const { conversations, updateConversation, deleteConversation } = useApp();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isSearching = search.trim().length > 0;

  /* Normal filtered list */
  const filtered = useMemo(() => conversations
    .filter(c => {
      if (filter === 'pinned')   return c.pinned && !c.archived;
      if (filter === 'archived') return c.archived;
      return !c.archived;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }),
    [conversations, filter]
  );

  /* Full-text search results */
  const searchResults = useMemo(
    () => fullTextSearch(conversations, search),
    [conversations, search]
  );

  const totalMatchCount = useMemo(
    () => searchResults.reduce((sum, r) => sum + r.totalMatches, 0),
    [searchResults]
  );

  const openRename = (conv: Conversation) => { setRenameId(conv.id); setRenameValue(conv.title); };
  const submitRename = () => {
    if (renameId && renameValue.trim()) updateConversation(renameId, { title: renameValue.trim() });
    setRenameId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-28 md:pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Conversations</h1>
          <p className="text-sm text-muted-foreground">
            {isSearching
              ? `${totalMatchCount} match${totalMatchCount !== 1 ? 'es' : ''} in ${searchResults.length} conversation${searchResults.length !== 1 ? 's' : ''}`
              : `${conversations.filter(c => !c.archived).length} active`}
          </p>
        </div>
        <Button size="sm" onClick={() => setLocation('/chat')} className="glow-primary">
          <MessageSquare className="w-4 h-4 mr-1.5" />New Chat
        </Button>
      </div>

      {/* ── Search bar ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
        <Input
          ref={searchRef}
          placeholder="Search titles and messages…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-10 glass-input"
          data-testid="input-search-conversations"
        />
        {isSearching && (
          <button
            onClick={() => { setSearch(''); searchRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Search mode ── */}
      {isSearching ? (
        searchResults.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No results found"
            description={`No conversations or messages match "${search}".`}
            action={{ label: 'Clear Search', onClick: () => setSearch('') }}
          />
        ) : (
          <div className="space-y-2.5">
            {/* Scope hint */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 px-1">
              <SlidersHorizontal className="w-3 h-3" />
              Searching titles + message content across all conversations
            </div>
            {searchResults.map(result => (
              <SearchResultCard
                key={result.conversation.id}
                result={result}
                query={search}
                onOpen={() => setLocation(`/chat/${result.conversation.id}`)}
              />
            ))}
          </div>
        )
      ) : (
        /* ── Normal mode ── */
        <>
          <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all">
                All
                <span className="ml-1.5 text-[10px] bg-muted/60 text-muted-foreground rounded-full px-1.5 py-0.5">
                  {conversations.filter(c => !c.archived).length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pinned" data-testid="tab-pinned">
                Pinned
                {conversations.filter(c => c.pinned && !c.archived).length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5">
                    {conversations.filter(c => c.pinned && !c.archived).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" data-testid="tab-archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>

          {filtered.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={filter === 'pinned' ? 'No pinned conversations' : filter === 'archived' ? 'Nothing archived' : 'No conversations yet'}
              description="Start chatting to see your conversations here."
              action={{ label: 'Start New Chat', onClick: () => setLocation('/chat') }}
            />
          ) : (
            <div className="space-y-2">
              {filtered.map(conv => (
                <ConvCard
                  key={conv.id}
                  conv={conv}
                  onOpen={() => setLocation(`/chat/${conv.id}`)}
                  onRename={openRename}
                  onDelete={id => setDeleteId(id)}
                  onUpdate={updateConversation}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Rename dialog ── */}
      <Dialog open={!!renameId} onOpenChange={open => !open && setRenameId(null)}>
        <DialogContent className="sm:max-w-sm glass-strong">
          <DialogHeader><DialogTitle>Rename Conversation</DialogTitle></DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitRename()}
            className="glass-input"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setRenameId(null)}>Cancel</Button>
            <Button onClick={submitRename}>Rename</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete Conversation"
        description="This permanently deletes this conversation and all its messages."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteConversation(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}
