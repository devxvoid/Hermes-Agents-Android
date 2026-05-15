import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Memory } from '@/types';
import { Plus, Search, Brain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';

const CATEGORIES = ['All', 'Personal preference', 'Project', 'App idea', 'Coding', 'Workflow', 'Contact', 'General'];

export default function MemoryPage() {
  const { memories, addMemory, updateMemory, deleteMemory } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Memory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = memories
    .filter(m => category === 'All' || m.category === category)
    .filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (mem: Memory) => {
    if (editItem) updateMemory(mem.id, mem);
    else addMemory(mem);
    setEditItem(null);
  };

  const handleEdit = (mem: Memory) => { setEditItem(mem); setFormOpen(true); };
  const handleOpenNew = () => { setEditItem(null); setFormOpen(true); };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Memory</h1>
          <p className="text-sm text-muted-foreground">
            {memories.filter(m => m.active).length} active · {memories.length} total
          </p>
        </div>
        <Button onClick={handleOpenNew} size="sm" className="glow-primary" data-testid="btn-add-memory">
          <Plus className="w-4 h-4 mr-1.5" />Add Memory
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 glass-input"
            data-testid="input-search-memory"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40 glass-input" data-testid="select-memory-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No memories found"
          description={search || category !== 'All' ? 'Try adjusting your filters.' : 'Add your first memory to personalize Hermes.'}
          action={{ label: 'Add Memory', onClick: handleOpenNew }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(mem => (
            <MemoryCard
              key={mem.id}
              memory={mem}
              onToggle={(id, active) => updateMemory(id, { active })}
              onEdit={handleEdit}
              onDelete={id => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <MemoryForm
        open={formOpen}
        onOpenChange={open => { setFormOpen(open); if (!open) setEditItem(null); }}
        onSave={handleSave}
        initialData={editItem}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete Memory"
        description="This memory will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteMemory(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}
