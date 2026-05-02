import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Memory } from '@/types';

const CATEGORIES = ['Personal preference', 'Project', 'App idea', 'Coding', 'Workflow', 'Contact', 'General'];

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.string(),
});

type FormData = z.infer<typeof schema>;

interface MemoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memory: Memory) => void;
  initialData?: Memory | null;
}

export function MemoryForm({ open, onOpenChange, onSave, initialData }: MemoryFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      category: initialData?.category || 'General',
      tags: initialData?.tags?.join(', ') || '',
    },
  });

  const onSubmit = (data: FormData) => {
    const now = new Date().toISOString();
    const memory: Memory = {
      id: initialData?.id || crypto.randomUUID(),
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      active: initialData?.active ?? true,
      usageCount: initialData?.usageCount ?? 0,
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
      lastUsedAt: initialData?.lastUsedAt,
    };
    onSave(memory);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Memory' : 'Add Memory'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="Memory title" data-testid="input-memory-title" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl><Textarea placeholder="What should Hermes remember?" rows={3} data-testid="input-memory-content" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger data-testid="select-memory-category"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="tags" render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma-separated)</FormLabel>
                <FormControl><Input placeholder="android, kotlin, workflow" data-testid="input-memory-tags" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" data-testid="btn-save-memory">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
