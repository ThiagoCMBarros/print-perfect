-- 1. Tipos de material (papel, vinil, lona, adesivo, tecido…)
CREATE TABLE public.material_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.material_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY mt_public_read ON public.material_types FOR SELECT USING (true);
CREATE POLICY mt_admin_write ON public.material_types FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Materiais globais (Couché 300g, Vinil Brilho…)
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type_id uuid NOT NULL REFERENCES public.material_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_modifier numeric NOT NULL DEFAULT 1,
  image text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_materials_type ON public.materials(material_type_id);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY mat_public_read ON public.materials FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY mat_admin_write ON public.materials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Acabamentos globais, vinculados ao tipo de material
CREATE TABLE public.finishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type_id uuid NOT NULL REFERENCES public.material_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_modifier numeric NOT NULL DEFAULT 1,
  image text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_finishes_type ON public.finishes(material_type_id);
ALTER TABLE public.finishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY fin_public_read ON public.finishes FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY fin_admin_write ON public.finishes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_finishes_updated_at BEFORE UPDATE ON public.finishes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. M2M produto <-> tipo de material
CREATE TABLE public.product_material_types (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_type_id uuid NOT NULL REFERENCES public.material_types(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, material_type_id)
);
ALTER TABLE public.product_material_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY pmt_public_read ON public.product_material_types FOR SELECT USING (true);
CREATE POLICY pmt_admin_write ON public.product_material_types FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Seed dos tipos
INSERT INTO public.material_types (slug, name, sort_order) VALUES
  ('papel', 'Papel', 1),
  ('vinil', 'Vinil', 2),
  ('lona', 'Lona', 3),
  ('adesivo-bopp', 'Adesivo BOPP', 4);

-- 6. Seed dos materiais (deduplicado)
WITH t AS (SELECT id, slug FROM public.material_types)
INSERT INTO public.materials (material_type_id, name, price_modifier, sort_order) VALUES
  -- Papel
  ((SELECT id FROM t WHERE slug='papel'), 'Couché 90g', 0.85, 1),
  ((SELECT id FROM t WHERE slug='papel'), 'Couché 115g', 0.95, 2),
  ((SELECT id FROM t WHERE slug='papel'), 'Couché 150g', 1.05, 3),
  ((SELECT id FROM t WHERE slug='papel'), 'Couché 250g', 1.15, 4),
  ((SELECT id FROM t WHERE slug='papel'), 'Couché 300g', 1.25, 5),
  ((SELECT id FROM t WHERE slug='papel'), 'Reciclato 240g', 1.20, 6),
  ((SELECT id FROM t WHERE slug='papel'), 'Color Plus 180g', 1.35, 7),
  -- Vinil
  ((SELECT id FROM t WHERE slug='vinil'), 'Vinil Branco', 1.00, 1),
  ((SELECT id FROM t WHERE slug='vinil'), 'Vinil Transparente', 1.20, 2),
  ((SELECT id FROM t WHERE slug='vinil'), 'Vinil Holográfico', 1.70, 3),
  -- Lona
  ((SELECT id FROM t WHERE slug='lona'), 'Lona 280g', 0.90, 1),
  ((SELECT id FROM t WHERE slug='lona'), 'Lona 440g', 1.00, 2),
  ((SELECT id FROM t WHERE slug='lona'), 'Lona Blackout', 1.35, 3),
  -- Adesivo BOPP
  ((SELECT id FROM t WHERE slug='adesivo-bopp'), 'BOPP Brilho', 1.00, 1),
  ((SELECT id FROM t WHERE slug='adesivo-bopp'), 'Couché Adesivo 90g', 0.90, 2);

-- 7. Seed dos acabamentos por tipo
WITH t AS (SELECT id, slug FROM public.material_types)
INSERT INTO public.finishes (material_type_id, name, price_modifier, sort_order) VALUES
  -- Papel
  ((SELECT id FROM t WHERE slug='papel'), 'Sem acabamento', 1.00, 1),
  ((SELECT id FROM t WHERE slug='papel'), 'Laminação Fosca', 1.25, 2),
  ((SELECT id FROM t WHERE slug='papel'), 'Laminação Brilho', 1.20, 3),
  ((SELECT id FROM t WHERE slug='papel'), 'Verniz Total', 1.20, 4),
  ((SELECT id FROM t WHERE slug='papel'), 'Verniz Localizado', 1.50, 5),
  ((SELECT id FROM t WHERE slug='papel'), 'Hot Stamping Dourado', 1.90, 6),
  ((SELECT id FROM t WHERE slug='papel'), 'Relevo Americano', 2.10, 7),
  -- Vinil
  ((SELECT id FROM t WHERE slug='vinil'), 'Recorte Simples', 1.00, 1),
  ((SELECT id FROM t WHERE slug='vinil'), 'Recorte Eletrônico', 1.25, 2),
  ((SELECT id FROM t WHERE slug='vinil'), 'Laminação Brilho', 1.25, 3),
  -- Lona
  ((SELECT id FROM t WHERE slug='lona'), 'Bastão + Ilhós', 1.00, 1),
  ((SELECT id FROM t WHERE slug='lona'), 'Apenas Ilhós', 0.90, 2),
  ((SELECT id FROM t WHERE slug='lona'), 'Bainha Simples', 0.95, 3),
  ((SELECT id FROM t WHERE slug='lona'), 'Bastões + Cordão', 1.05, 4),
  -- Adesivo BOPP
  ((SELECT id FROM t WHERE slug='adesivo-bopp'), 'Corte Reto', 1.00, 1),
  ((SELECT id FROM t WHERE slug='adesivo-bopp'), 'Corte Personalizado', 1.40, 2);

-- 8. Vincular produtos existentes ao tipo de material correto
WITH t AS (SELECT id, slug FROM public.material_types)
INSERT INTO public.product_material_types (product_id, material_type_id)
SELECT p.id,
  CASE
    WHEN c.slug IN ('cartoes','panfletos','flyers','cartazes','convites','receituarios','papel-timbrado','pastas')
      THEN (SELECT id FROM t WHERE slug='papel')
    WHEN c.slug = 'banners' OR c.slug = 'faixas'
      THEN (SELECT id FROM t WHERE slug='lona')
    WHEN c.slug = 'adesivos'
      THEN (SELECT id FROM t WHERE slug='vinil')
    WHEN c.slug = 'etiquetas'
      THEN (SELECT id FROM t WHERE slug='adesivo-bopp')
  END
FROM public.products p
JOIN public.categories c ON c.id = p.category_id
WHERE c.slug IN ('cartoes','panfletos','flyers','cartazes','convites','receituarios','papel-timbrado','pastas','banners','faixas','adesivos','etiquetas');

-- 9. Renomear produtos para nomes lúdicos e genéricos + ajustar descrição curta
UPDATE public.products SET name = 'Cartões de Visita Profissionais',     short_description = 'Sua marca na palma da mão. Escolha o papel e o acabamento ideais.' WHERE slug = 'cartao-visita-classico';
UPDATE public.products SET name = 'Cartões de Visita Premium',           short_description = 'Apresente sua marca com sofisticação. Vários papéis e acabamentos.' WHERE slug = 'cartao-de-visita-couche-300g';
UPDATE public.products SET name = 'Panfletos para Divulgação',           short_description = 'Comunique sua mensagem de forma direta e econômica.' WHERE slug = 'panfleto-a5-couche';
UPDATE public.products SET name = 'Flyers Frente e Verso',               short_description = 'Mais conteúdo, mais impacto. Personalize do seu jeito.' WHERE slug = 'flyer-a6-frente-verso';
UPDATE public.products SET name = 'Banners de Alta Qualidade',           short_description = 'Destaque-se em qualquer evento. Lonas resistentes e cores vibrantes.' WHERE slug = 'banner-lona-personalizado';
UPDATE public.products SET name = 'Banners Black Out Fosco',             short_description = 'Lonas opacas para áreas externas e fachadas.' WHERE slug = 'banner-lona-fosca';
UPDATE public.products SET name = 'Adesivos Personalizados',             short_description = 'Estampe sua marca em qualquer superfície. Cores intensas e durabilidade.' WHERE slug = 'adesivo-vinil-recortado';
UPDATE public.products SET name = 'Etiquetas Adesivas',                  short_description = 'Identifique seus produtos com etiquetas de qualidade gráfica.' WHERE slug = 'etiqueta-adesiva-couche';
UPDATE public.products SET name = 'Cartazes para Vitrine',               short_description = 'Chame atenção com cartazes coloridos e de alta resolução.' WHERE slug = 'cartaz-a3-couche';
UPDATE public.products SET name = 'Convites Personalizados',             short_description = 'Convites elegantes para celebrar momentos especiais.' WHERE slug = 'convite-personalizado';