import { Memory } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORY_META: Record<string, { label: string; chip: string; accentBg: string }> = {
  'Personal preference': { label: 'Personal preference', chip: 'bg-violet-500/12 text-violet-400 border-violet-500/20', accentBg: 'bg-violet-500' },
  'Project':             { label: 'Project',             chip: 'bg-blue-500/12 text-blue-400 border-blue-500/20',     accentBg: 'bg-blue-500'   },
  'App idea':            { label: 'App idea',            chip: 'bg-cyan-500/12 text-cyan-400 border-cyan-500/20',     accentBg: 'bg-cyan-500'   },
  'Coding':              { label: 'Coding',              chip: 'bg-green-500/12 text-green-400 border-green-500/20',  accentBg: 'bg-green-500'  },
  'Workflow':            { label: 'Workflow',            chip: 'bg-amber-500/12 text-amber-400 border-amber-500/20',  accentBg: 'bg-amber-500'  },
  'Contact':             { label: 'Contact',             chip: 'bg-pink-500/12 text-pink-400 border-pink-500/20',     accentBg: 'bg-pink-500'   },
  'General':             { label: 'General',             chip: 'bg-slate-500/12 text-slate-400 border-slate-500/20',  accentBg: 'bg-slate-500'  },
};

const DEFAULT_META = { label: 'General', chip: 'bg-slate-500/12 text-slate-400 border-slate-500/20', accentBg: 'bg-slate-500' };

interface MemoryCardProps {
  memory: Memory;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
}

export function MemoryCard({ memory, onToggle, onEdit, onDelete }: MemoryCardProps) {
  const meta = CATEGORY_META[memory.category] ?? DEFAULT_META;

  return (
    <div
      data-testid={`memory-card-${memory.id}`}
      className={cn(
        'glass-card rounded-2xl transition-all overflow-hidden relative',
        !memory.active && 'opacity-45 grayscale-[30%]'
      )}
    >
      {/* Category colour accent strip */}
      <div className={cn('absolute left-0 inset-y-0 w-[3px] opacity-80', meta.accentBg)} />
      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Category + tags row */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-semibold leading-none', meta.chip)}>
                {memory.category}
              </span>
              {memory.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[11px] px-1.5 py-0.5 rounded-md bg-foreground/[0.06] text-muted-foreground font-medium">
                  {tag}
                </span>
              ))}
              {memory.tags.length > 3 && (
                <span className="text-[11px] text-muted-foreground/60">+{memory.tags.length - 3}</span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-[14px] text-foreground leading-snug">{memory.title}</h3>
            {/* Body */}
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{memory.content}</p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2.5">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
              </span>
              {memory.usageCount > 0 && (
                <span className="text-[11px] text-muted-foreground/50">{memory.usageCount}× used</span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <Switch
              checked={memory.active}
              onCheckedChange={v => onToggle(memory.id, v)}
              data-testid={`toggle-memory-${memory.id}`}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg opacity-60 hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(memory)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(memory.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
