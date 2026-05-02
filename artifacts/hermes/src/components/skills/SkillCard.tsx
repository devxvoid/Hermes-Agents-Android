import { Skill } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SkillCardProps {
  skill: Skill;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
}

export function SkillCard({ skill, onToggle, onEdit, onDelete }: SkillCardProps) {
  return (
    <div
      data-testid={`skill-card-${skill.id}`}
      className={cn('glass-card rounded-2xl p-4 transition-all', !skill.enabled && 'opacity-50')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
              skill.enabled ? 'bg-violet-500/20' : 'bg-muted/40')}>
              <Zap className={cn('w-3.5 h-3.5', skill.enabled ? 'text-violet-400' : 'text-muted-foreground')} />
            </div>
            <h3 className="font-semibold text-sm text-foreground">{skill.name}</h3>
            <Badge variant="outline" className="text-xs py-0 px-1.5 glass border-white/10 ml-auto shrink-0">
              {skill.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{skill.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {skill.triggerKeywords.slice(0, 5).map(kw => (
              <span key={kw} className="text-xs glass border-primary/20 text-primary/80 px-1.5 py-0.5 rounded-md">{kw}</span>
            ))}
            {skill.triggerKeywords.length > 5 && (
              <span className="text-xs text-muted-foreground">+{skill.triggerKeywords.length - 5}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/70">
            {skill.usageCount > 0 && <span>{skill.usageCount}× triggered</span>}
            {skill.lastUsedAt && <span>Last {formatDistanceToNow(new Date(skill.lastUsedAt), { addSuffix: true })}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={skill.enabled}
            onCheckedChange={v => onToggle(skill.id, v)}
            data-testid={`toggle-skill-${skill.id}`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 glass rounded-lg">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-white/10">
              <DropdownMenuItem onClick={() => onEdit(skill)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(skill.id)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
