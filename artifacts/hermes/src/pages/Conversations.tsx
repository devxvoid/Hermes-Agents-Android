import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useLocation } from 'wouter';
import { Conversation } from '@/types';
import { Search, Pin, Archive, Trash2, Edit2, MessageSquare, MoreHorizontal, Clock } from 'lucide-react';
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

export default function Conversations() {
  const { conversations, updateConversation, deleteConversation } = useApp();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = conversations
    .filter(c => {
      if (filter === 'pinned') return c.pinned && !c.archived;
      if (filter === 'archived') return c.archived;
      return !c.archived;
    })
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const openRename = (conv: Conversation) => {
    setRenameId(conv.id);
    setRenameValue(conv.title);
  };

  const submitRename = () => {
    if (renameId && renameValue.trim()) {
      updateConversation(renameId, { title: renameValue.trim() });
    }
    setRenameId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Conversations</h1>
          <p className="text-sm text-muted-foreground">{conversations.filter(c => !c.archived).length} active conversations</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-conversations"
          />
        </div>
      </div>

      <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="pinned" data-testid="tab-pinned">Pinned</TabsTrigger>
          <TabsTrigger value="archived" data-testid="tab-archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations found"
          description={search ? 'Try a different search term.' : 'Start chatting to see your conversations here.'}
          action={{ label: 'Start New Chat', onClick: () => setLocation('/chat') }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(conv => (
            <div
              key={conv.id}
              data-testid={`conversation-${conv.id}`}
              className="group bg-card border border-card-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => setLocation(`/chat/${conv.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {conv.pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                    <span className="font-medium text-foreground text-sm truncate">{conv.title}</span>
                    {conv.archived && (
                      <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded shrink-0">Archived</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}</span>
                    <span>{conv.messages.length} messages</span>
                    {conv.tags.length > 0 && <span>{conv.tags.slice(0, 2).join(', ')}</span>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0" data-testid={`btn-conv-menu-${conv.id}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => openRename(conv)} data-testid={`btn-rename-${conv.id}`}>
                      <Edit2 className="w-4 h-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateConversation(conv.id, { pinned: !conv.pinned })} data-testid={`btn-pin-${conv.id}`}>
                      <Pin className="w-4 h-4 mr-2" /> {conv.pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateConversation(conv.id, { archived: !conv.archived })}>
                      <Archive className="w-4 h-4 mr-2" /> {conv.archived ? 'Unarchive' : 'Archive'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteId(conv.id)} className="text-destructive" data-testid={`btn-delete-conv-${conv.id}`}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!renameId} onOpenChange={open => !open && setRenameId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename Conversation</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitRename()} data-testid="input-rename-conv" autoFocus />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setRenameId(null)}>Cancel</Button>
            <Button onClick={submitRename} data-testid="btn-confirm-rename">Rename</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete Conversation"
        description="This will permanently delete this conversation and all its messages."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteConversation(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}
