
-- Allow multiple gift selections per category (cart-style).
-- Old: a user could pick at most one item per category.
-- New: a user may pick any number of items across categories, but a given
-- item can only be picked once.
ALTER TABLE public.gift_selections
  DROP CONSTRAINT gift_selections_user_id_category_id_event_key_key,
  ADD CONSTRAINT gift_selections_user_id_gift_item_id_event_key_key UNIQUE (user_id, gift_item_id, event_key);
