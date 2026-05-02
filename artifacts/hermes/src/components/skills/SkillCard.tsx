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
      className={cn(
        'bg-card border border-card-border rounded-xl p-4 transition-all',
        !skill.enabled && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap className={cn('w-4 h-4 shrink-0', skill.enabled ? 'text-primary' : 'text-muted-foreground')} />
            <h3 className="font-semibold text-sm text-foreground">{skill.name}</h3>
            <Badge variant="outline" className="text-xs py-0 px-1.5 ml-auto shrink-0">{skill.category}</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{skill.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {skill.triggerKeywords.slice(0, 5).map(kw => (
              <span key={kw} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{kw}</span>
            ))}
            {skill.triggerKeywords.length > 5 && (
              <span className="text-xs text-muted-foreground">+{skill.triggerKeywords.length - 5} more</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {skill.usageCount > 0 && <span>{skill.usageCount}x triggered</span>}
            {skill.lastUsedAt && <span>Last used {formatDistanceToNow(new Date(skill.lastUsedAt), { addSuffix: true })}</span>}
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
              <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`btn-skill-menu-${skill.id}`}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(skill)} data-testid={`btn-edit-skill-${skill.id}`}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(skill.id)} className="text-destructive" data-testid={`btn-delete-skill-${skill.id}`}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
