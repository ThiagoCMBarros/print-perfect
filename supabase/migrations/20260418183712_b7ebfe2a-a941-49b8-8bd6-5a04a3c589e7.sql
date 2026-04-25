-- 1) Adiciona 'print_side' ao enum option_type
DO $$ BEGIN
  ALTER TYPE public.option_type ADD VALUE IF NOT EXISTS 'print_side';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Coluna para arte do verso no carrinho
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS artwork_back_path text NULL,
  ADD COLUMN IF NOT EXISTS print_side_option_id uuid NULL;

-- 3) Coluna para arte do verso e print_side em order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS artwork_back_path text NULL,
  ADD COLUMN IF NOT EXISTS artwork_back_filename text NULL;

-- 4) FK do print_side em cart_items (mesma tabela product_options)
DO $$ BEGIN
  ALTER TABLE public.cart_items
    ADD CONSTRAINT cart_items_print_side_option_id_fkey
    FOREIGN KEY (print_side_option_id) REFERENCES public.product_options(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;