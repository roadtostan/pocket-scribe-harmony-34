
-- event_config
CREATE TABLE public.event_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  birthday_date timestamptz NOT NULL,
  gift_open_date timestamptz NOT NULL,
  gift_close_date timestamptz NOT NULL,
  letter_date timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  letter_content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_config TO authenticated;
GRANT ALL ON public.event_config TO service_role;
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read event_config" ON public.event_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write event_config" ON public.event_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- gift_categories
CREATE TABLE public.gift_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL DEFAULT 'birthday_2026',
  name text NOT NULL,
  icon text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_categories TO authenticated;
GRANT ALL ON public.gift_categories TO service_role;
ALTER TABLE public.gift_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all gift_categories" ON public.gift_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- gift_items
CREATE TABLE public.gift_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.gift_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text,
  description text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_items TO authenticated;
GRANT ALL ON public.gift_items TO service_role;
ALTER TABLE public.gift_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all gift_items" ON public.gift_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- gift_selections
CREATE TABLE public.gift_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.gift_categories(id) ON DELETE CASCADE,
  gift_item_id uuid NOT NULL REFERENCES public.gift_items(id) ON DELETE CASCADE,
  event_key text NOT NULL DEFAULT 'birthday_2026',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, event_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_selections TO authenticated;
GRANT ALL ON public.gift_selections TO service_role;
ALTER TABLE public.gift_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read all selections" ON public.gift_selections FOR SELECT TO authenticated USING (true);
CREATE POLICY "user insert own selection" ON public.gift_selections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user update own selection" ON public.gift_selections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user delete own selection" ON public.gift_selections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed event config
INSERT INTO public.event_config (event_key, birthday_date, gift_open_date, gift_close_date, letter_date, timezone, letter_content)
VALUES (
  'birthday_2026',
  '2026-08-17 00:00:00+07',
  '2026-08-03 00:00:00+07',
  '2026-08-10 23:59:59+07',
  '2026-08-16 00:00:00+07',
  'Asia/Jakarta',
  'Sayangku Wanda,

Kalau kamu membaca surat ini, artinya besok adalah hari spesialmu. Aku ingin kamu tahu bahwa setiap hari bersamamu adalah hadiah yang tak pernah aku anggap biasa.

Terima kasih untuk setiap tawa, setiap pelukan, dan setiap kesabaran yang kamu berikan. Aku tahu jarak sering membuat kita lelah, tapi cintamu selalu menjadi alasan aku terus melangkah.

Di ulang tahunmu kali ini, aku berdoa semoga Tuhan selalu menjaga senyummu, memberikan kesehatan, dan mewujudkan setiap mimpimu, satu per satu.

Aku mencintaimu, hari ini, besok, dan selamanya.

— Dari yang selalu merindukanmu 💕'
);

-- Seed categories
INSERT INTO public.gift_categories (event_key, name, icon, display_order) VALUES
  ('birthday_2026', 'Shoes', '👟', 1),
  ('birthday_2026', 'Bag', '👜', 2),
  ('birthday_2026', 'Clothes', '👕', 3);

-- Seed items
INSERT INTO public.gift_items (category_id, name, image_url, display_order)
SELECT c.id, x.name, x.image_url, x.display_order
FROM public.gift_categories c
JOIN (VALUES
  ('Shoes', 'White Sneakers', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 1),
  ('Shoes', 'Casual Loafers', 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600', 2),
  ('Shoes', 'Running Shoes', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 3),
  ('Bag', 'Tote Bag', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', 1),
  ('Bag', 'Crossbody Bag', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', 2),
  ('Bag', 'Backpack', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', 3),
  ('Clothes', 'Summer Dress', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600', 1),
  ('Clothes', 'Cardigan', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', 2),
  ('Clothes', 'Cotton Blouse', 'https://images.unsplash.com/photo-1564257577-2d3ee8740ea3?w=600', 3)
) AS x(cat_name, name, image_url, display_order) ON c.name = x.cat_name
WHERE c.event_key = 'birthday_2026';
