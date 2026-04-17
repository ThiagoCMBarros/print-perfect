
-- =========================================
-- 1. STORAGE BUCKET para imagens de produto
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Admins podem inserir
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Admins podem atualizar
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 2. PROMOVER usuário a admin
-- =========================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'thiago.carelli@vespera.com.br'
ON CONFLICT DO NOTHING;

-- =========================================
-- 3. SEED de categorias
-- =========================================
INSERT INTO public.categories (slug, name, description, icon, sort_order) VALUES
  ('flyers', 'Flyers e Panfletos', 'Material promocional impresso', 'FileText', 1),
  ('cartoes', 'Cartões de Visita', 'Cartões profissionais personalizados', 'CreditCard', 2),
  ('banners', 'Banners e Lonas', 'Comunicação visual de grande formato', 'Flag', 3),
  ('adesivos', 'Adesivos e Etiquetas', 'Adesivos personalizados', 'Sticker', 4)
ON CONFLICT (slug) DO NOTHING;

-- =========================================
-- 4. SEED de produtos
-- =========================================
WITH cat AS (
  SELECT id, slug FROM public.categories
)
INSERT INTO public.products (slug, name, short_description, description, base_price, category_id, image, bestseller, new_release, production_days, active)
SELECT * FROM (VALUES
  ('flyer-a6-frente-verso', 'Flyer A6 Frente e Verso',
    'Ideal para campanhas e eventos',
    'Flyers em couché 150g com impressão colorida frente e verso. Perfeito para divulgação rápida.',
    49.90, (SELECT id FROM cat WHERE slug='flyers'), NULL, true, false, 3, true),
  ('cartao-visita-classico', 'Cartão de Visita Clássico',
    'Couché 300g com laminação',
    'Cartões de visita profissionais em couché 300g com opção de laminação fosca ou brilhante.',
    79.90, (SELECT id FROM cat WHERE slug='cartoes'), NULL, true, false, 4, true),
  ('banner-lona-personalizado', 'Banner em Lona',
    'Lona 440g resistente para uso interno e externo',
    'Banner em lona 440g com acabamento de bastão e ilhós. Impressão de alta resolução.',
    89.00, (SELECT id FROM cat WHERE slug='banners'), NULL, false, true, 5, true),
  ('adesivo-vinil-recortado', 'Adesivo em Vinil Recortado',
    'Adesivos resistentes em vinil',
    'Adesivos personalizados em vinil de alta durabilidade, com recorte eletrônico no formato desejado.',
    34.90, (SELECT id FROM cat WHERE slug='adesivos'), NULL, false, true, 3, true)
) AS v(slug, name, short_description, description, base_price, category_id, image, bestseller, new_release, production_days, active)
ON CONFLICT (slug) DO NOTHING;

-- =========================================
-- 5. SEED de opções de produtos
-- =========================================
-- Flyer
INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'size'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('A6 (10x15cm)', 1.0, 1), ('A5 (15x21cm)', 1.6, 2), ('A4 (21x29,7cm)', 2.4, 3)) AS v(label, pm, so)
WHERE p.slug='flyer-a6-frente-verso'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'material'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('Couché 115g', 1.0, 1), ('Couché 150g', 1.15, 2), ('Couché 300g', 1.4, 3)) AS v(label, pm, so)
WHERE p.slug='flyer-a6-frente-verso'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'finish'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('Sem verniz', 1.0, 1), ('Verniz total', 1.2, 2), ('Laminação fosca', 1.35, 3)) AS v(label, pm, so)
WHERE p.slug='flyer-a6-frente-verso'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order, numeric_value)
SELECT p.id, 'quantity'::option_type, v.label, v.pm, v.so, v.nv
FROM public.products p,
(VALUES ('100 un', 1.0, 1, 100), ('500 un', 3.5, 2, 500), ('1000 un', 6.0, 3, 1000), ('5000 un', 25.0, 4, 5000)) AS v(label, pm, so, nv)
WHERE p.slug='flyer-a6-frente-verso'
ON CONFLICT DO NOTHING;

-- Cartão
INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'size'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('9x5cm (padrão)', 1.0, 1), ('8,5x5,5cm', 1.0, 2)) AS v(label, pm, so)
WHERE p.slug='cartao-visita-classico'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'material'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('Couché 250g', 1.0, 1), ('Couché 300g', 1.15, 2), ('Reciclato 240g', 1.25, 3)) AS v(label, pm, so)
WHERE p.slug='cartao-visita-classico'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'finish'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('Sem laminação', 1.0, 1), ('Laminação fosca', 1.25, 2), ('Laminação brilho', 1.2, 3), ('Verniz localizado', 1.5, 4)) AS v(label, pm, so)
WHERE p.slug='cartao-visita-classico'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order, numeric_value)
SELECT p.id, 'quantity'::option_type, v.label, v.pm, v.so, v.nv
FROM public.products p,
(VALUES ('100 un', 1.0, 1, 100), ('500 un', 3.0, 2, 500), ('1000 un', 5.0, 3, 1000)) AS v(label, pm, so, nv)
WHERE p.slug='cartao-visita-classico'
ON CONFLICT DO NOTHING;

-- Banner
INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order, numeric_value)
SELECT p.id, 'size'::option_type, v.label, v.pm, v.so, v.nv
FROM public.products p,
(VALUES ('80x120cm', 1.0, 1, NULL::numeric), ('100x150cm', 1.4, 2, NULL), ('150x200cm', 2.0, 3, NULL)) AS v(label, pm, so, nv)
WHERE p.slug='banner-lona-personalizado'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'material'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('Lona 280g', 1.0, 1), ('Lona 440g', 1.2, 2)) AS v(label, pm, so)
WHERE p.slug='banner-lona-personalizado'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'finish'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('Bastão + ilhós', 1.0, 1), ('Apenas ilhós', 0.9, 2), ('Bainha simples', 0.95, 3)) AS v(label, pm, so)
WHERE p.slug='banner-lona-personalizado'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order, numeric_value)
SELECT p.id, 'quantity'::option_type, v.label, v.pm, v.so, v.nv
FROM public.products p,
(VALUES ('1 un', 1.0, 1, 1), ('3 un', 2.7, 2, 3), ('5 un', 4.2, 3, 5)) AS v(label, pm, so, nv)
WHERE p.slug='banner-lona-personalizado'
ON CONFLICT DO NOTHING;

-- Adesivo
INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'size'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('5x5cm', 1.0, 1), ('10x10cm', 1.6, 2), ('15x15cm', 2.4, 3)) AS v(label, pm, so)
WHERE p.slug='adesivo-vinil-recortado'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'material'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('Vinil branco', 1.0, 1), ('Vinil transparente', 1.15, 2), ('Vinil holográfico', 1.6, 3)) AS v(label, pm, so)
WHERE p.slug='adesivo-vinil-recortado'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order)
SELECT p.id, 'finish'::option_type, v.label, v.pm, v.so
FROM public.products p,
(VALUES ('Recorte retangular', 1.0, 1), ('Recorte eletrônico', 1.25, 2)) AS v(label, pm, so)
WHERE p.slug='adesivo-vinil-recortado'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_options (product_id, option_type, label, price_modifier, sort_order, numeric_value)
SELECT p.id, 'quantity'::option_type, v.label, v.pm, v.so, v.nv
FROM public.products p,
(VALUES ('50 un', 1.0, 1, 50), ('100 un', 1.8, 2, 100), ('500 un', 7.0, 3, 500), ('1000 un', 12.0, 4, 1000)) AS v(label, pm, so, nv)
WHERE p.slug='adesivo-vinil-recortado'
ON CONFLICT DO NOTHING;
