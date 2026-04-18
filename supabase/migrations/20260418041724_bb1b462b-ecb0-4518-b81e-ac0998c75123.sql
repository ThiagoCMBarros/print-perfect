-- Tabela chave-valor para configurações de integrações (NÃO-sensíveis)
CREATE TABLE public.integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  is_sensitive boolean NOT NULL DEFAULT false,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, key)
);

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Apenas admins
CREATE POLICY "integration_settings_admin_select"
  ON public.integration_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "integration_settings_admin_insert"
  ON public.integration_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "integration_settings_admin_update"
  ON public.integration_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "integration_settings_admin_delete"
  ON public.integration_settings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER trg_integration_settings_updated_at
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_integration_settings_category ON public.integration_settings(category);

-- Seed inicial
INSERT INTO public.integration_settings (category, key, value, description, is_sensitive) VALUES
  ('mercadopago', 'public_key',     '""'::jsonb,         'Public Key do Mercado Pago (sandbox ou live)', false),
  ('mercadopago', 'mode',           '"sandbox"'::jsonb,  'Ambiente: sandbox ou live', false),
  ('mercadopago', 'enabled_methods','["pix","credit_card","boleto"]'::jsonb, 'Métodos de pagamento habilitados', false),
  ('whatsapp',    'phone_number',   '""'::jsonb,         'Número WhatsApp (com DDI, só dígitos)', false),
  ('whatsapp',    'default_message','"Olá! Tenho interesse nos produtos da Gráfica."'::jsonb, 'Mensagem padrão WhatsApp', false),
  ('email',       'from_name',      '"Gráfica Online"'::jsonb, 'Nome do remetente', false),
  ('email',       'from_address',   '""'::jsonb,         'E-mail remetente', false),
  ('email',       'contact_to',     '""'::jsonb,         'E-mail de destino do formulário de contato', false),
  ('shipping',    'free_above',     '0'::jsonb,          'Frete grátis acima de R$ (0 = desabilitado)', false),
  ('site',        'maintenance_mode','false'::jsonb,     'Modo manutenção do site', false);
