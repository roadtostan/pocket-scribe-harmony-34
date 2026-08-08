import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_KEY, useEventConfig, useNow } from '@/hooks/useEventConfig';
import { getEventState, getNextMilestone } from '@/lib/specialEvent';
import CountdownDisplay from '@/components/special/CountdownDisplay';
import BirthdaySurprise from '@/components/special/BirthdaySurprise';
import GiftItemForm, { type GiftItem } from '@/components/special/GiftItemForm';
import GiftCart from '@/components/special/GiftCart';
import { toast } from 'sonner';
import { ArrowLeft, Check, Gift, Lock, Mail, Pencil, Plus, ShoppingCart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '@/context/FinanceContext';
import type { EventState } from '@/lib/specialEvent';

const EVENT_STATES: EventState[] = ['COUNTDOWN', 'GIFT_SELECTION', 'GIFT_CLOSED', 'LETTER', 'HAPPY_BIRTHDAY'];

type Category = { id: string; name: string; icon: string | null; display_order: number };
type Item = { id: string; category_id: string; name: string; image_url: string | null; description: string | null; display_order: number };
type Selection = { category_id: string; gift_item_id: string; user_id: string };

export default function SpecialEvent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { config, loading } = useEventConfig();
  const now = useNow(1000);
  const { user } = useFinance();

  const urlState = searchParams.get('state');
  const [overrideState, setOverrideState] = useState<EventState | null>(
    urlState && (EVENT_STATES as string[]).includes(urlState) ? (urlState as EventState) : null
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const state = config ? (overrideState ?? getEventState(config, now)) : null;
  const locked = state === 'GIFT_CLOSED' || state === 'LETTER' || state === 'HAPPY_BIRTHDAY';

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: its }, { data: sels }] = await Promise.all([
        supabase.from('gift_categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('gift_items').select('*').eq('is_active', true).order('display_order'),
        supabase.from('gift_selections').select('category_id, gift_item_id, user_id'),
      ]);
      setCategories((cats as Category[]) ?? []);
      setItems((its as Item[]) ?? []);
      setSelections((sels as Selection[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (state === 'HAPPY_BIRTHDAY') {
      const end = Date.now() + 2000;
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [state]);

  const mySelections = useMemo(
    () => (user ? selections.filter(s => s.user_id === user.id) : []),
    [selections, user]
  );

  const selectedIds = useMemo(() => new Set(mySelections.map(s => s.gift_item_id)), [mySelections]);

  const handleAddToCart = async (item: Item) => {
    if (!user || locked) return;
    const { error } = await supabase.from('gift_selections').upsert(
      { user_id: user.id, category_id: item.category_id, gift_item_id: item.id, event_key: EVENT_KEY },
      { onConflict: 'user_id,gift_item_id,event_key' }
    );
    if (error) { toast.error('Failed to save'); return; }
    setSelections(prev => [...prev, { user_id: user.id, category_id: item.category_id, gift_item_id: item.id }]);
    toast.success(`Added to cart: ${item.name}`);
  };

  const handleRemoveFromCart = async (itemId: string) => {
    if (!user || locked) return;
    const { error } = await supabase
      .from('gift_selections')
      .delete()
      .eq('user_id', user.id)
      .eq('gift_item_id', itemId)
      .eq('event_key', EVENT_KEY);
    if (error) { toast.error('Failed to remove'); return; }
    setSelections(prev => prev.filter(s => !(s.user_id === user.id && s.gift_item_id === itemId)));
    toast.success('Removed from cart');
  };

  if (loading || !config) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Loading…</div>
      </Layout>
    );
  }

  const milestone = getNextMilestone(config, now);

  return (
    <Layout>
      <div className="pb-24">
        {state === 'HAPPY_BIRTHDAY' ? (
          <BirthdaySurprise onBack={() => navigate('/')} onReadLetter={() => setLetterOpen(true)} />
        ) : (
          <>
            {/* Hero */}
            <div className="bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 text-white px-4 pt-4 pb-6">
              <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm opacity-90 mb-3">
                <ArrowLeft size={16} /> Back
              </button>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles /> <h1 className="text-xl font-bold">Special Event</h1>
              </div>

              <CountdownDisplay target={milestone.target} label={milestone.label} />
            </div>

            <div className="p-4 space-y-4">
          {state === 'COUNTDOWN' && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Sesuatu yang spesial sedang dipersiapkan… Pemilihan hadiah akan segera dibuka.
                </p>
              </CardContent>
            </Card>
          )}

          {(state === 'GIFT_SELECTION' || state === 'GIFT_CLOSED') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gift size={18} /> Gift Selection
                </h3>
                {locked && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>

              {!locked && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(c => {
                    const count = mySelections.filter(s => s.category_id === c.id).length;
                    return (
                      <Card key={c.id} className="cursor-pointer active:scale-95 transition" onClick={() => setActiveCategory(c)}>
                        <CardContent className="p-3 text-center">
                          <div className="text-3xl mb-1">{c.icon}</div>
                          <div className="font-medium text-sm">{c.name}</div>
                          <div className="text-xs mt-1">
                            {count > 0 ? (
                              <span className="text-green-600 flex items-center justify-center gap-1">
                                <Check size={12} /> {count} selected
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not selected</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {locked && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ShoppingCart size={16} /> Your Cart ({mySelections.length})
                      </h4>
                    </div>
                    <GiftCart selections={mySelections} categories={categories} items={items} locked />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {state === 'LETTER' && (
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="mx-auto mb-3 text-pink-500" size={40} />
                <h3 className="font-semibold text-lg mb-1">Ada surat untukmu</h3>
                <p className="text-sm text-muted-foreground mb-4">Sebuah pesan yang ditulis khusus untuk hari esokmu.</p>
                <Button onClick={() => setLetterOpen(true)} className="bg-pink-500 hover:bg-pink-600">
                  Buka Surat 💌
                </Button>
              </CardContent>
            </Card>
          )}
            </div>
          </>
        )}

        {/* Category items dialog */}
        <Dialog open={!!activeCategory} onOpenChange={o => !o && setActiveCategory(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {activeCategory?.icon} {activeCategory?.name}
              </DialogTitle>
            </DialogHeader>
            {locked && (
              <div className="text-xs bg-muted rounded-md p-2 flex items-center gap-2">
                <Lock size={12} /> Pemilihan sudah ditutup
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {items.filter(i => i.category_id === activeCategory?.id).map(i => {
                const isSelected = selectedIds.has(i.id);
                return (
                  <Card key={i.id} className={`relative ${isSelected ? 'ring-2 ring-pink-500' : ''}`}>
                    {!locked && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setEditingItem(i);
                          setFormOpen(true);
                        }}
                        className="absolute top-1.5 right-1.5 z-10 bg-white/80 dark:bg-black/60 rounded-full p-1.5 shadow hover:bg-white dark:hover:bg-black"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    <CardContent className="p-2">
                      <a
                        href={i.description ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => {
                          if (!i.description) e.preventDefault();
                        }}
                        className="block aspect-square bg-muted rounded-md overflow-hidden mb-2"
                      >
                        {i.image_url && <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" loading="lazy" />}
                      </a>
                      <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{i.name}</div>
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        variant={isSelected ? 'secondary' : 'default'}
                        disabled={locked}
                        onClick={() => (isSelected ? handleRemoveFromCart(i.id) : handleAddToCart(i))}
                      >
                        {isSelected ? (
                          <><Check size={14} className="mr-1" />In Cart</>
                        ) : (
                          <><ShoppingCart size={14} className="mr-1" />Add to Cart</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {!locked && activeCategory && (
              <div className="mt-4 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Item
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Floating cart button */}
        {state === 'GIFT_SELECTION' && (
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="fixed bottom-20 right-4 z-50 bg-pink-500 hover:bg-pink-600 text-white rounded-full p-3 shadow-lg"
          >
            <ShoppingCart size={22} />
            {mySelections.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                {mySelections.length}
              </span>
            )}
          </button>
        )}

        {/* Cart dialog */}
        <Dialog open={cartOpen} onOpenChange={setCartOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                <ShoppingCart size={18} className="inline mr-1" /> Your Cart ({mySelections.length})
              </DialogTitle>
            </DialogHeader>
            {locked && (
              <div className="text-xs bg-muted rounded-md p-2 flex items-center gap-2">
                <Lock size={12} /> Pemilihan sudah ditutup
              </div>
            )}
            <GiftCart
              selections={mySelections}
              categories={categories}
              items={items}
              locked={locked}
              onRemove={handleRemoveFromCart}
            />
          </DialogContent>
        </Dialog>

        {/* Add / Edit gift item dialog */}
        <GiftItemForm
          open={formOpen}
          onOpenChange={setFormOpen}
          categoryId={activeCategory?.id ?? ''}
          item={editingItem}
          onSaved={item =>
            setItems(prev => {
              const exists = prev.some(p => p.id === item.id);
              return exists
                ? prev.map(p => (p.id === item.id ? { ...p, ...item } : p))
                : [...prev, item as Item];
            })
          }
          onDeleted={id => setItems(prev => prev.filter(p => p.id !== id))}
        />

        {/* Letter dialog */}
        <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>💌 Untukmu</DialogTitle>
            </DialogHeader>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {config.letter_content}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
