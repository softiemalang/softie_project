ALTER TABLE public.availabilities
  DROP CONSTRAINT IF EXISTS availabilities_slot_index_check;

ALTER TABLE public.availabilities
  ADD CONSTRAINT availabilities_slot_index_check
  CHECK (slot_index >= 0 AND slot_index <= 23);
