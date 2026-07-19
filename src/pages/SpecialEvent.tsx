import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useEventConfig, useNow } from '@/hooks/useEventConfig';
import { getEventState, getNextMilestone } from '@/lib/specialEvent';
import CountdownDisplay from '@/components/special/CountdownDisplay';
import { toast } from 'sonner';
import { ArrowLeft, Check, Gift, Lock, Mail, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '@/context/FinanceContext';

type Category = { id: string; name: string; icon: string | null; display_order: number };
type Item = { id: string; category_id: string; name: string; image_url: string | null; display_order: number };
type Selection = { category_id: string; gift_item_id: string; user_id: string };

export default function SpecialEvent() {
  const navigate = useNavigate();
  const { config, loading } = useEventConfig();
  const now = useNow(1000);
  const { user } = useFinance() as any;

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);

  const state = config ? getEventState(config, now) : null;
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

  const selectionByCategory = useMemo(() => {
    const m = new Map<string, Selection>();
    for (const s of selections) if (user && s.user_id === user.id) m.set(s.category_id, s);
    return m;
  }, [selections, user]);

  const handleSelect = async (item: Item) => {
    if (!user || !activeCategory || locked) return;
    const { error } = await supabase.from('gift_selections').upsert(
      { user_id: user.id, category_id: activeCategory.id, gift_item_id: item.id, event_key: 'birthday_2026' },
      { onConflict: 'user_id,category_id,event_key' }
    );
    if (error) { toast.error('Failed to save'); return; }
    setSelections(prev => {
      const other = prev.filter(s => !(s.user_id === user.id && s.category_id === activeCategory.id));
      return [...other, { user_id: user.id, category_id: activeCategory.id, gift_item_id: item.id }];
    });
    toast.success(`Selected: ${item.name}`);
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
        {/* Hero */}
        <div className="bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 text-white px-4 pt-4 pb-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm opacity-90 mb-3">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles /> <h1 className="text-xl font-bold">Special Event</h1>
          </div>

          {state === 'HAPPY_BIRTHDAY' ? (
            <div className="text-center py-6">
              <h2 className="text-3xl font-bold mb-2">🎂 Happy Birthday!</h2>
              <p className="opacity-90">Selamat ulang tahun, sayang 💕</p>
            </div>
          ) : (
            <CountdownDisplay target={milestone.target} label={milestone.label} />
          )}
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(c => {
                  const sel = selectionByCategory.get(c.id);
                  const selItem = items.find(i => i.id === sel?.gift_item_id);
                  return (
                    <Card key={c.id} className="cursor-pointer active:scale-95 transition" onClick={() => setActiveCategory(c)}>
                      <CardContent className="p-3 text-center">
                        <div className="text-3xl mb-1">{c.icon}</div>
                        <div className="font-medium text-sm">{c.name}</div>
                        <div className="text-xs mt-1">
                          {selItem ? (
                            <span className="text-green-600 flex items-center justify-center gap-1">
                              <Check size={12} /> {selItem.name}
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

          {state === 'HAPPY_BIRTHDAY' && (
            <>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-base">
                    Hari ini adalah harimu. Semoga setiap doa terwujud, setiap tawa jadi berlipat,
                    dan cinta selalu menemanimu. 🎉
                  </p>
                </CardContent>
              </Card>
              <Button variant="outline" className="w-full" onClick={() => setLetterOpen(true)}>
                Baca surat lagi 💌
              </Button>
            </>
          )}
        </div>

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
                const isSelected = selectionByCategory.get(activeCategory!.id)?.gift_item_id === i.id;
                return (
                  <Card key={i.id} className={isSelected ? 'ring-2 ring-pink-500' : ''}>
                    <CardContent className="p-2">
                      <div className="aspect-square bg-muted rounded-md overflow-hidden mb-2">
                        {i.image_url && <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" loading="lazy" />}
                      </div>
                      <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{i.name}</div>
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        variant={isSelected ? 'secondary' : 'default'}
                        disabled={locked}
                        onClick={() => handleSelect(i)}
                      >
                        {isSelected ? <><Check size={14} className="mr-1" />Selected</> : 'Select'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

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
