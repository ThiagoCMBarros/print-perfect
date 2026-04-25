
-- Bucket público para assets do site (logo, favicon, og:image)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas: leitura pública, escrita apenas admin
DROP POLICY IF EXISTS "site_assets_public_read" ON storage.objects;
CREATE POLICY "site_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "site_assets_admin_insert" ON storage.objects;
CREATE POLICY "site_assets_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "site_assets_admin_update" ON storage.objects;
CREATE POLICY "site_assets_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "site_assets_admin_delete" ON storage.objects;
CREATE POLICY "site_assets_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Permitir leitura pública (anon) das configurações de "branding", "company", "contact" e "social"
-- Settings sensíveis ficam restritas a admin (policy existente já cobre isso para is_sensitive=true).
DROP POLICY IF EXISTS "integration_settings_public_read_branding" ON public.integration_settings;
CREATE POLICY "integration_settings_public_read_branding" ON public.integration_settings
  FOR SELECT
  USING (
    is_sensitive = false
    AND category IN ('branding','company','contact','social','seo')
  );

-- Seed/idempotente das chaves de personalização
INSERT INTO public.integration_settings (category, key, value, description, is_sensitive) VALUES
  ('branding','site_name', '"GráficaPro"'::jsonb, 'Nome exibido no header/footer', false),
  ('branding','tagline', '"Impressão online rápida e de alta qualidade"'::jsonb, 'Slogan curto', false),
  ('branding','logo_url', '""'::jsonb, 'URL da logo (upload em /admin/personalizacao)', false),
  ('branding','favicon_url', '""'::jsonb, 'URL do favicon', false),
  ('branding','primary_color', '"#2563eb"'::jsonb, 'Cor primária da marca (hex)', false),
  ('branding','primary_foreground', '"#ffffff"'::jsonb, 'Cor do texto sobre a primária', false),
  ('company','legal_name', '"GráficaPro Ltda"'::jsonb, 'Razão social', false),
  ('company','cnpj', '"00.000.000/0001-00"'::jsonb, 'CNPJ', false),
  ('company','ie', '""'::jsonb, 'Inscrição estadual', false),
  ('company','address', '"Rua Exemplo, 123 - São Paulo/SP"'::jsonb, 'Endereço completo', false),
  ('contact','phone', '"(11) 4000-0000"'::jsonb, 'Telefone fixo', false),
  ('contact','whatsapp', '"5511976905156"'::jsonb, 'WhatsApp (somente números, com DDI)', false),
  ('contact','whatsapp_message', '"Olá! Gostaria de mais informações."'::jsonb, 'Mensagem padrão do WhatsApp', false),
  ('contact','email', '"contato@graficapro.com.br"'::jsonb, 'E-mail de contato', false),
  ('contact','business_hours', '"Seg a Sex, 9h às 18h"'::jsonb, 'Horário de atendimento', false),
  ('social','instagram', '""'::jsonb, 'URL do Instagram', false),
  ('social','facebook', '""'::jsonb, 'URL do Facebook', false),
  ('social','linkedin', '""'::jsonb, 'URL do LinkedIn', false),
  ('seo','meta_title', '"GráficaPro — Impressão online rápida e de alta qualidade"'::jsonb, 'Title padrão', false),
  ('seo','meta_description', '"Cartões, banners, adesivos e muito mais com qualidade profissional."'::jsonb, 'Meta description padrão', false)
ON CONFLICT DO NOTHING;
