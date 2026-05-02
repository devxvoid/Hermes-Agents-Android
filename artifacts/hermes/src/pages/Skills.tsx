import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Skill } from '@/types';
import { Plus, Search, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkillCard } from '@/components/skills/SkillCard';
import { SkillForm } from '@/components/skills/SkillForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';

const CATEGORIES = ['All', 'Research', 'Coding', 'Android Development', 'Writing', 'Summarization', 'Task Planning', 'Debugging', 'Data Analysis', 'Productivity', 'Automation', 'AI Model Setup', 'General'];

export default function Skills() {
  const { skills, addSkill, updateSkill, deleteSkill } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Skill | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = skills
    .filter(s => category === 'All' || s.category === category)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (skill: Skill) => {
    if (editItem) updateSkill(skill.id, skill);
    else addSkill(skill);
    setEditItem(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Skills</h1>
          <p className="text-sm text-muted-foreground">
            {skills.filter(s => s.enabled).length} active · {skills.length} total
          </p>
        </div>
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} size="sm" className="glow-primary" data-testid="btn-create-skill">
          <Plus className="w-4 h-4 mr-1.5" />Create Skill
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 glass-input"
            data-testid="input-search-skills"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40 glass-input" data-testid="select-skills-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No skills found"
          description={search || category !== 'All' ? 'Try adjusting your filters.' : 'Create your first skill to enhance Hermes.'}
          action={{ label: 'Create Skill', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggle={(id, enabled) => updateSkill(id, { enabled })}
              onEdit={s => { setEditItem(s); setFormOpen(true); }}
              onDelete={id => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <SkillForm
        open={formOpen}
        onOpenChange={open => { setFormOpen(open); if (!open) setEditItem(null); }}
        onSave={handleSave}
        initialData={editItem}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete Skill"
        description="This skill will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteSkill(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}
