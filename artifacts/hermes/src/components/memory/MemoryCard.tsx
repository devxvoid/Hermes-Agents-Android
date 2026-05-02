import { Memory } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  'Personal preference': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Project': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'App idea': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Coding': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Workflow': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Contact': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'General': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

interface MemoryCardProps {
  memory: Memory;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
}

export function MemoryCard({ memory, onToggle, onEdit, onDelete }: MemoryCardProps) {
  const colorClass = CATEGORY_COLORS[memory.category] || CATEGORY_COLORS['General'];

  return (
    <div
      data-testid={`memory-card-${memory.id}`}
      className={cn('glass-card rounded-2xl p-4 transition-all', !memory.active && 'opacity-50')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', colorClass)}>
              {memory.category}
            </span>
            {memory.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5 glass border-white/10">{tag}</Badge>
            ))}
          </div>
          <h3 className="font-semibold text-sm text-foreground">{memory.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{memory.content}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/70">
            {memory.lastUsedAt && (
              <span>Used {formatDistanceToNow(new Date(memory.lastUsedAt), { addSuffix: true })}</span>
            )}
            {memory.usageCount > 0 && <span>{memory.usageCount}× used</span>}
            <span>Added {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={memory.active}
            onCheckedChange={v => onToggle(memory.id, v)}
            data-testid={`toggle-memory-${memory.id}`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 glass rounded-lg">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-white/10">
              <DropdownMenuItem onClick={() => onEdit(memory)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(memory.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
