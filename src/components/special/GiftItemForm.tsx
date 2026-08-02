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
import { Image as ImageIcon, ImageOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { extractImagesFromHtml, extractImagesFromMarkdown, sanitizeImageUrls } from '@/lib/extractImages';

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
  const [fetchingImages, setFetchingImages] = useState(false);
  const [fetchedImages, setFetchedImages] = useState<string[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '');
      setImageUrl(item?.image_url ?? '');
      setDescription(item?.description ?? '');
      setFetchedImages([]);
      setFailedImages(new Set());
      setFetchError(null);
    }
  }, [open, item]);

  const markFailedImage = (url: string) => {
    setFailedImages(prev => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const fetchImagesViaProxy = async (url: string): Promise<string[]> => {
    const strategies: { label: string; run: () => Promise<string[] | null> }[] = [
      {
        label: 'jina',
        run: async () => {
          const res = await fetch(`https://r.jina.ai/${url}`);
          if (!res.ok) return null;
          const text = await res.text();
          const images = extractImagesFromMarkdown(text, url);
          return images.length ? images : null;
        },
      },
      {
        label: 'allorigins',
        run: async () => {
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
          if (!res.ok) return null;
          const html = await res.text();
          const images = extractImagesFromHtml(html, url);
          return images.length ? images : null;
        },
      },
      {
        label: 'corsproxy',
        run: async () => {
          const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
          if (!res.ok) return null;
          const html = await res.text();
          const images = extractImagesFromHtml(html, url);
          return images.length ? images : null;
        },
      },
    ];

    for (const strategy of strategies) {
      try {
        const images = await strategy.run();
        if (images && images.length) return images;
      } catch {
        // try next strategy
      }
    }
    return [];
  };

  const handleFetchImages = async () => {
    const marketplaceUrl = description.trim();
    if (!marketplaceUrl) {
      toast.error('Please fill the marketplace URL first');
      return;
    }

    setFetchingImages(true);
    setFetchError(null);
    setFetchedImages([]);

    let images: string[] = [];

    try {
      const { data, error } = await supabase.functions.invoke('fetch-images', {
        body: { url: marketplaceUrl },
      });
      if (error) throw new Error(error.message);
      if (Array.isArray(data?.images)) images = sanitizeImageUrls(data.images);
    } catch {
      images = await fetchImagesViaProxy(marketplaceUrl);
    }

    setFetchingImages(false);

    if (!images.length) {
      setFetchError('No images found — the marketplace page may block image extraction');
      return;
    }

    setFetchedImages(images);
    if (images.length === 1) {
      setImageUrl(images[0]);
      toast.success('Image fetched from marketplace');
    } else {
      toast.success(`${images.length} images found — pick one`);
    }
  };

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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleFetchImages}
                disabled={fetchingImages || !description.trim()}
              >
                <ImageIcon className="mr-1 h-4 w-4" />
                {fetchingImages ? 'Fetching images…' : 'Fetch image from marketplace URL'}
              </Button>
              {fetchError && <p className="text-xs text-red-500">{fetchError}</p>}
              {fetchedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {fetchedImages.map((u, idx) => {
                    const failed = failedImages.has(u);
                    return (
                      <button
                        key={`${u}-${idx}`}
                        type="button"
                        onClick={() => setImageUrl(u)}
                        title={u}
                        className={`aspect-square rounded-md overflow-hidden border-2 transition bg-muted flex items-center justify-center ${
                          imageUrl === u ? 'border-pink-500' : 'border-transparent hover:border-muted'
                        }`}
                      >
                        {failed ? (
                          <div className="flex flex-col items-center gap-1 p-1 text-muted-foreground">
                            <ImageOff size={16} />
                            <span className="text-[9px] leading-tight line-clamp-3 break-all">{u}</span>
                          </div>
                        ) : (
                          <img
                            src={u}
                            alt={`option ${idx + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={() => markFailedImage(u)}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
