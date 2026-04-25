
-- Reset
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.product_options CASCADE;
DROP TABLE IF EXISTS public.product_material_types CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.finishes CASCADE;
DROP TABLE IF EXISTS public.material_types CASCADE;

DROP TYPE IF EXISTS public.option_type CASCADE;
DROP TYPE IF EXISTS public.qty_discount_type CASCADE;
DROP TYPE IF EXISTS public.pricing_mode CASCADE;

CREATE TYPE public.discount_type AS ENUM ('none', 'percent', 'fixed');
-- product_complexity já existe (usado por categories)

-- PRODUTOS
CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  descricao_curta text,
  imagem text,
  largura_mm numeric(10,2) NOT NULL DEFAULT 0,
  altura_mm numeric(10,2) NOT NULL DEFAULT 0,
  area_mm2 numeric(12,2) GENERATED ALWAYS AS (largura_mm * altura_mm) STORED,
  margem_percent numeric(6,2) NOT NULL DEFAULT 0,
  dias_producao integer NOT NULL DEFAULT 3,
  complexidade public.product_complexity,
  bestseller boolean NOT NULL DEFAULT false,
  novidade boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_produtos_category ON public.produtos(category_id);
CREATE INDEX idx_produtos_slug ON public.produtos(slug);
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY produtos_public_read ON public.produtos FOR SELECT USING (ativo = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY produtos_admin_write ON public.produtos FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER produtos_updated_at BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TIPOS / MATERIAIS / GRAMATURAS
CREATE TABLE public.tipos_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tipos_material ENABLE ROW LEVEL SECURITY;
CREATE POLICY tm_public_read ON public.tipos_material FOR SELECT USING (true);
CREATE POLICY tm_admin_write ON public.tipos_material FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_material_id uuid NOT NULL REFERENCES public.tipos_material(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  imagem text,
  ativo boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_materiais_tipo ON public.materiais(tipo_material_id);
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY mt_public_read ON public.materiais FOR SELECT USING (ativo = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY mt_admin_write ON public.materiais FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER materiais_updated_at BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.gramaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  nome text NOT NULL,
  valor_mm2 numeric(12,8) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gramaturas_material ON public.gramaturas(material_id);
ALTER TABLE public.gramaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY gr_public_read ON public.gramaturas FOR SELECT USING (ativo = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY gr_admin_write ON public.gramaturas FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER gramaturas_updated_at BEFORE UPDATE ON public.gramaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REVESTIMENTOS
CREATE TABLE public.revestimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  valor_mm2 numeric(12,8) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.revestimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY rv_public_read ON public.revestimentos FOR SELECT USING (ativo = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY rv_admin_write ON public.revestimentos FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER revestimentos_updated_at BEFORE UPDATE ON public.revestimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.revestimento_aplicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  multiplicador numeric(6,2) NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);
ALTER TABLE public.revestimento_aplicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY rva_public_read ON public.revestimento_aplicacoes FOR SELECT USING (ativo = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY rva_admin_write ON public.revestimento_aplicacoes FOR ALL USING (has_role(auth.uid(), 'admin'));
INSERT INTO public.revestimento_aplicacoes (nome, multiplicador, sort_order) VALUES
  ('Frente', 1, 1), ('Verso', 1, 2), ('Frente e Verso', 2, 3);

-- ACABAMENTOS
CREATE TABLE public.acabamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  valor_unitario numeric(12,4) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.acabamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY ac_public_read ON public.acabamentos FOR SELECT USING (ativo = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY ac_admin_write ON public.acabamentos FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER acabamentos_updated_at BEFORE UPDATE ON public.acabamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PERMISSÕES
CREATE TABLE public.produto_materiais_permitidos (
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  PRIMARY KEY (produto_id, material_id)
);
ALTER TABLE public.produto_materiais_permitidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY pmp_public_read ON public.produto_materiais_permitidos FOR SELECT USING (true);
CREATE POLICY pmp_admin_write ON public.produto_materiais_permitidos FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.produto_gramaturas_permitidas (
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  gramatura_id uuid NOT NULL REFERENCES public.gramaturas(id) ON DELETE CASCADE,
  PRIMARY KEY (produto_id, gramatura_id)
);
ALTER TABLE public.produto_gramaturas_permitidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY pgp_public_read ON public.produto_gramaturas_permitidas FOR SELECT USING (true);
CREATE POLICY pgp_admin_write ON public.produto_gramaturas_permitidas FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.produto_revestimentos_permitidos (
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  revestimento_id uuid NOT NULL REFERENCES public.revestimentos(id) ON DELETE CASCADE,
  PRIMARY KEY (produto_id, revestimento_id)
);
ALTER TABLE public.produto_revestimentos_permitidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY prp_public_read ON public.produto_revestimentos_permitidos FOR SELECT USING (true);
CREATE POLICY prp_admin_write ON public.produto_revestimentos_permitidos FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.produto_acabamentos_permitidos (
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  acabamento_id uuid NOT NULL REFERENCES public.acabamentos(id) ON DELETE CASCADE,
  qtd_padrao integer NOT NULL DEFAULT 1,
  PRIMARY KEY (produto_id, acabamento_id)
);
ALTER TABLE public.produto_acabamentos_permitidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY pap_public_read ON public.produto_acabamentos_permitidos FOR SELECT USING (true);
CREATE POLICY pap_admin_write ON public.produto_acabamentos_permitidos FOR ALL USING (has_role(auth.uid(), 'admin'));

-- FAIXAS QTD
CREATE TABLE public.produto_faixas_quantidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  qtd_min integer NOT NULL,
  qtd_max integer,
  desconto_tipo public.discount_type NOT NULL DEFAULT 'none',
  desconto_valor numeric(10,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_faixas_produto ON public.produto_faixas_quantidade(produto_id);
ALTER TABLE public.produto_faixas_quantidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY pfq_public_read ON public.produto_faixas_quantidade FOR SELECT USING (true);
CREATE POLICY pfq_admin_write ON public.produto_faixas_quantidade FOR ALL USING (has_role(auth.uid(), 'admin'));

-- CARRINHO
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  composicao jsonb NOT NULL,
  qtd integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  urgency text NOT NULL DEFAULT 'standard',
  artwork_path text,
  artwork_back_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cart_user ON public.cart_items(user_id);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY cart_select_own ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY cart_insert_own ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY cart_update_own ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY cart_delete_own ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- FUNÇÃO DE CÁLCULO
CREATE OR REPLACE FUNCTION public.calc_product_price(
  p_produto_id uuid,
  p_gramatura_id uuid,
  p_revestimento_id uuid,
  p_aplicacao_id uuid,
  p_acabamentos jsonb,
  p_qtd integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_area numeric;
  v_margem numeric;
  v_valor_base numeric := 0;
  v_valor_revestimento numeric := 0;
  v_valor_acabamentos numeric := 0;
  v_unit numeric;
  v_subtotal numeric;
  v_desconto numeric := 0;
  v_total numeric;
  v_gram_valor numeric;
  v_rev_valor numeric;
  v_aplic_mult numeric := 1;
  v_faixa record;
  v_acab record;
BEGIN
  IF p_qtd IS NULL OR p_qtd < 1 THEN p_qtd := 1; END IF;

  SELECT area_mm2, COALESCE(margem_percent, 0) INTO v_area, v_margem
  FROM public.produtos WHERE id = p_produto_id;
  IF v_area IS NULL THEN
    RAISE EXCEPTION 'Produto nao encontrado';
  END IF;

  SELECT valor_mm2 INTO v_gram_valor FROM public.gramaturas WHERE id = p_gramatura_id;
  IF v_gram_valor IS NULL THEN
    RAISE EXCEPTION 'Gramatura obrigatoria';
  END IF;
  v_valor_base := v_area * v_gram_valor;

  IF p_revestimento_id IS NOT NULL THEN
    SELECT valor_mm2 INTO v_rev_valor FROM public.revestimentos WHERE id = p_revestimento_id;
    IF p_aplicacao_id IS NOT NULL THEN
      SELECT multiplicador INTO v_aplic_mult FROM public.revestimento_aplicacoes WHERE id = p_aplicacao_id;
    END IF;
    v_valor_revestimento := COALESCE(v_rev_valor, 0) * v_area * COALESCE(v_aplic_mult, 1);
  END IF;

  IF p_acabamentos IS NOT NULL AND jsonb_typeof(p_acabamentos) = 'array' THEN
    FOR v_acab IN
      SELECT (item->>'acabamento_id')::uuid AS aid, COALESCE((item->>'qtd')::integer, 1) AS q
      FROM jsonb_array_elements(p_acabamentos) AS item
    LOOP
      v_valor_acabamentos := v_valor_acabamentos +
        COALESCE((SELECT valor_unitario FROM public.acabamentos WHERE id = v_acab.aid), 0) * v_acab.q;
    END LOOP;
  END IF;

  v_unit := (v_valor_base + v_valor_revestimento + v_valor_acabamentos) * (1 + v_margem / 100.0);
  v_subtotal := v_unit * p_qtd;

  SELECT * INTO v_faixa
  FROM public.produto_faixas_quantidade
  WHERE produto_id = p_produto_id
    AND p_qtd >= qtd_min
    AND (qtd_max IS NULL OR p_qtd <= qtd_max)
  ORDER BY qtd_min DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_faixa.desconto_tipo = 'percent' THEN
      v_desconto := v_subtotal * (v_faixa.desconto_valor / 100.0);
    ELSIF v_faixa.desconto_tipo = 'fixed' THEN
      v_desconto := v_faixa.desconto_valor;
    END IF;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_desconto);

  RETURN jsonb_build_object(
    'area_mm2', v_area,
    'valor_base', round(v_valor_base::numeric, 4),
    'valor_revestimento', round(v_valor_revestimento::numeric, 4),
    'valor_acabamentos', round(v_valor_acabamentos::numeric, 4),
    'margem_percent', v_margem,
    'unit_price', round(v_unit::numeric, 2),
    'subtotal', round(v_subtotal::numeric, 2),
    'desconto', round(v_desconto::numeric, 2),
    'total', round(v_total::numeric, 2),
    'qtd', p_qtd
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calc_product_price(uuid, uuid, uuid, uuid, jsonb, integer) TO anon, authenticated;
