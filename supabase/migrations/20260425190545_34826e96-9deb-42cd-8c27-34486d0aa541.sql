-- Materials: preço por cm²
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS price_per_cm2 numeric NOT NULL DEFAULT 0;

-- Finishes: preço por cm² (laminação universal)
ALTER TABLE public.finishes ADD COLUMN IF NOT EXISTS price_per_cm2 numeric NOT NULL DEFAULT 0;

-- Products: modo de precificação + preço fixo
DO $$ BEGIN
  CREATE TYPE pricing_mode AS ENUM ('auto', 'fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pricing_mode pricing_mode NOT NULL DEFAULT 'auto';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fixed_unit_price numeric;

-- Product options: dimensões (size) + descontos (quantity)
ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS width_cm numeric;
ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS height_cm numeric;

DO $$ BEGIN
  CREATE TYPE qty_discount_type AS ENUM ('none', 'percent', 'fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS discount_type qty_discount_type NOT NULL DEFAULT 'none';
ALTER TABLE public.product_options ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0;