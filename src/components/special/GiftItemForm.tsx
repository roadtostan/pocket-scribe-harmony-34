import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type GiftItem = {
  id: string;
  category_id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  display_order: number;
};

interface GiftItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  item?: GiftItem | null;
  onSaved: (item: GiftItem) => void;
  onDeleted?: (id: string) => void;
}

const GiftItemForm = ({ open, onOpenChange, categoryId, item, onSaved, onDeleted }: GiftItemFormProps) => {
  const editing = !!item;
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '');
      setImageUrl(item?.image_url ?? '');
      setDescription(item?.description ?? '');
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please fill the gift name');
      return;
    }
    setSubmitting(true);

    if (editing && item) {
      const { data, error } = await supabase
        .from('gift_items')
        .update({
          name: name.trim(),
          image_url: imageUrl.trim() || null,
          description: description.trim() || null,
        })
        .eq('id', item.id)
        .select()
        .single();
      setSubmitting(false);

      if (error) {
        toast.error('Failed to update gift');
        return;
      }

      onSaved(data as GiftItem);
      onOpenChange(false);
      toast.success('Gift updated');
      return;
    }

    const { data: last } = await supabase
      .from('gift_items')
      .select('display_order')
      .eq('category_id', categoryId)
      .order('display_order', { ascending: false })
      .limit(1);
    const displayOrder = (last?.[0]?.display_order ?? 0) + 1;

    const { data, error } = await supabase
      .from('gift_items')
      .insert({
        category_id: categoryId,
        name: name.trim(),
        image_url: imageUrl.trim() || null,
        description: description.trim() || null,
        display_order: displayOrder,
      })
      .select()
      .single();
    setSubmitting(false);

    if (error) {
      toast.error('Failed to add gift');
      return;
    }

    onSaved(data as GiftItem);
    onOpenChange(false);
    toast.success('Gift added');
  };

  const handleDelete = async () => {
    if (!item) return;
    const { error } = await supabase.from('gift_items').delete().eq('id', item.id);
    if (error) {
      toast.error('Failed to delete gift');
      return;
    }
    setDeleteOpen(false);
    onOpenChange(false);
    onDeleted?.(item.id);
    toast.success('Gift deleted');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="gift-name">Name</Label>
              <Input
                id="gift-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Gift name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-image-url">Image URL</Label>
              <Input
                id="gift-image-url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift-description">Marketplace URL</Label>
              <Textarea
                id="gift-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="https://shopee.co.id/…"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              {editing && onDeleted && (
                <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              )}
              <Button type="submit" size="sm" className="flex-1" disabled={submitting}>
                {submitting ? 'Saving…' : editing ? 'Save' : 'Add Item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{item?.name}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GiftItemForm;
