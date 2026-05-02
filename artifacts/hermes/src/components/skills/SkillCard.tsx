import { Skill } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Zap, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORY_META: Record<string, { chip: string; accentBg: string }> = {
  'Research':            { chip: 'bg-cyan-500/12 text-cyan-400 border-cyan-500/20',          accentBg: 'bg-cyan-500'    },
  'Coding':              { chip: 'bg-green-500/12 text-green-400 border-green-500/20',        accentBg: 'bg-green-500'   },
  'Android Development': { chip: 'bg-teal-500/12 text-teal-400 border-teal-500/20',          accentBg: 'bg-teal-500'    },
  'Writing':             { chip: 'bg-rose-500/12 text-rose-400 border-rose-500/20',           accentBg: 'bg-rose-500'    },
  'Summarization':       { chip: 'bg-blue-500/12 text-blue-400 border-blue-500/20',           accentBg: 'bg-blue-500'    },
  'Task Planning':       { chip: 'bg-violet-500/12 text-violet-400 border-violet-500/20',     accentBg: 'bg-violet-500'  },
  'Debugging':           { chip: 'bg-red-500/12 text-red-400 border-red-500/20',              accentBg: 'bg-red-500'     },
  'Data Analysis':       { chip: 'bg-amber-500/12 text-amber-400 border-amber-500/20',        accentBg: 'bg-amber-500'   },
  'Productivity':        { chip: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20',  accentBg: 'bg-emerald-500' },
  'Automation':          { chip: 'bg-pink-500/12 text-pink-400 border-pink-500/20',           accentBg: 'bg-pink-500'    },
  'AI Model Setup':      { chip: 'bg-primary/12 text-primary border-primary/20',              accentBg: 'bg-primary'     },
  'General':             { chip: 'bg-slate-500/12 text-slate-400 border-slate-500/20',        accentBg: 'bg-slate-500'   },
};

const DEFAULT_META = { chip: 'bg-slate-500/12 text-slate-400 border-slate-500/20', accentBg: 'bg-slate-500' };

interface SkillCardProps {
  skill: Skill;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
}

export function SkillCard({ skill, onToggle, onEdit, onDelete }: SkillCardProps) {
  const meta = CATEGORY_META[skill.category] ?? DEFAULT_META;

  return (
    <div
      data-testid={`skill-card-${skill.id}`}
      className={cn(
        'glass-card rounded-2xl transition-all overflow-hidden relative',
        !skill.enabled && 'opacity-45 grayscale-[30%]'
      )}
    >
      {/* Category colour accent strip */}
      <div className={cn('absolute left-0 inset-y-0 w-[3px] opacity-80', meta.accentBg)} />
      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Zap icon badge */}
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
            skill.enabled ? 'bg-violet-500/15 border border-violet-500/20' : 'bg-muted/40 border border-border/50'
          )}>
            <Zap className={cn('w-4 h-4', skill.enabled ? 'text-violet-400' : 'text-muted-foreground')} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title + category badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-[14px] text-foreground leading-snug">{skill.name}</h3>
              <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-semibold leading-none shrink-0', meta.chip)}>
                {skill.category}
              </span>
            </div>

            {/* Description */}
            <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{skill.description}</p>

            {/* Trigger keywords */}
            {skill.triggerKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {skill.triggerKeywords.slice(0, 5).map(kw => (
                  <span key={kw} className="text-[11px] bg-primary/8 border border-primary/16 text-primary/80 px-1.5 py-0.5 rounded-md font-medium">
                    {kw}
                  </span>
                ))}
                {skill.triggerKeywords.length > 5 && (
                  <span className="text-[11px] text-muted-foreground/50 self-center">+{skill.triggerKeywords.length - 5}</span>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2">
              {skill.usageCount > 0 && (
                <span className="text-[11px] text-muted-foreground/50">{skill.usageCount}× triggered</span>
              )}
              {skill.lastUsedAt && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(skill.lastUsedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1 mt-0.5">
            <Switch
              checked={skill.enabled}
              onCheckedChange={v => onToggle(skill.id, v)}
              data-testid={`toggle-skill-${skill.id}`}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg opacity-60 hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(skill)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(skill.id)} className="text-destructive focus:text-destructive">
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
