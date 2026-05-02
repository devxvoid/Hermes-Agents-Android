import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-2">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      </div>
      {(action || secondaryAction) && (
        <div className="flex gap-2 mt-2">
          {action && (
            <Button size="sm" onClick={action.onClick} data-testid="btn-empty-action">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button size="sm" variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
