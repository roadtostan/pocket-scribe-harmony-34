import { Button } from '@/components/ui/button';
import { ShoppingCart, X } from 'lucide-react';

export type CartSelection = { category_id: string; gift_item_id: string; user_id: string };
export type CartCategory = { id: string; name: string; icon: string | null };
export type CartItem = { id: string; category_id: string; name: string; image_url: string | null; description: string | null };

interface GiftCartProps {
  selections: CartSelection[];
  categories: CartCategory[];
  items: CartItem[];
  locked?: boolean;
  onRemove?: (itemId: string) => void;
}

const GiftCart = ({ selections, categories, items, locked = false, onRemove }: GiftCartProps) => {
  if (selections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
        <ShoppingCart size={28} />
        Cart is empty
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {selections.map(s => {
        const item = items.find(i => i.id === s.gift_item_id);
        if (!item) return null;
        const cat = categories.find(c => c.id === s.category_id);
        return (
          <div key={s.gift_item_id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
            <a
              href={item.description ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => {
                if (!item.description) e.preventDefault();
              }}
              className="w-12 h-12 rounded-md bg-muted overflow-hidden shrink-0"
            >
              {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />}
            </a>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {cat?.icon} {cat?.name}
              </div>
            </div>
            {!locked && onRemove && (
              <Button size="icon" variant="ghost" className="shrink-0" onClick={() => onRemove(item.id)}>
                <X size={16} />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GiftCart;
