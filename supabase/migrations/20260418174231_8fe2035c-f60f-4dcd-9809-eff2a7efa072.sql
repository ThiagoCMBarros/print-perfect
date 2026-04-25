-- Enum de complexidade
DO $$ BEGIN
  CREATE TYPE public.product_complexity AS ENUM ('simple', 'complex');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Categoria define padrão
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS complexity public.product_complexity NOT NULL DEFAULT 'simple';

-- Produto pode sobrescrever (NULL = herda da categoria)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS complexity public.product_complexity NULL;

-- Defaults sensatos por slug existente (caixas, banners → complex)
UPDATE public.categories
SET complexity = 'complex'
WHERE slug IN ('caixas', 'banners', 'banners-grandes', 'sacolas', 'embalagens')
  AND complexity = 'simple';