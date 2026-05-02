import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skill } from '@/types';

const CATEGORIES = ['Research', 'Coding', 'Android Development', 'Writing', 'Summarization', 'Task Planning', 'Debugging', 'Data Analysis', 'Productivity', 'Automation', 'AI Model Setup', 'General'];

const schema = z.object({
  name: z.string().min(1, 'Name required').max(80),
  description: z.string().min(1, 'Description required'),
  category: z.string().min(1),
  triggerKeywords: z.string().min(1, 'At least one keyword required'),
  instructionPrompt: z.string().min(1, 'Instruction prompt required'),
});

type FormData = z.infer<typeof schema>;

interface SkillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (skill: Skill) => void;
  initialData?: Skill | null;
}

export function SkillForm({ open, onOpenChange, onSave, initialData }: SkillFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || 'General',
      triggerKeywords: initialData?.triggerKeywords?.join(', ') || '',
      instructionPrompt: initialData?.instructionPrompt || '',
    },
  });

  const onSubmit = (data: FormData) => {
    const now = new Date().toISOString();
    const skill: Skill = {
      id: initialData?.id || crypto.randomUUID(),
      name: data.name,
      description: data.description,
      category: data.category,
      triggerKeywords: data.triggerKeywords.split(',').map(k => k.trim()).filter(Boolean),
      instructionPrompt: data.instructionPrompt,
      enabled: initialData?.enabled ?? true,
      usageCount: initialData?.usageCount ?? 0,
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
      lastUsedAt: initialData?.lastUsedAt,
    };
    onSave(skill);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Skill' : 'Create Skill'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input placeholder="Research Assistant" data-testid="input-skill-name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="What does this skill do?" rows={2} data-testid="input-skill-description" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger data-testid="select-skill-category"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="triggerKeywords" render={({ field }) => (
              <FormItem>
                <FormLabel>Trigger Keywords (comma-separated)</FormLabel>
                <FormControl><Input placeholder="research, investigate, compare" data-testid="input-skill-keywords" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="instructionPrompt" render={({ field }) => (
              <FormItem>
                <FormLabel>Instruction Prompt</FormLabel>
                <FormControl><Textarea placeholder="Instructions added to the AI when this skill activates..." rows={3} data-testid="input-skill-prompt" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" data-testid="btn-save-skill">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
