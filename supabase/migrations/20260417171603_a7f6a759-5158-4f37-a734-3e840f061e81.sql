-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.order_status AS ENUM (
  'aguardando_pagamento','pago','em_analise','arte_pendente','arte_aprovada',
  'em_producao','finalizado','enviado','entregue','cancelado'
);
CREATE TYPE public.payment_method AS ENUM ('pix','credit_card','boleto');
CREATE TYPE public.option_type AS ENUM ('size','material','finish','quantity');

-- ============ HELPER: updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ADDRESSES ============
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  recipient TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addr_select_own" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addr_insert_own" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addr_update_own" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "addr_delete_own" ON public.addresses FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_addr_updated BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "cat_admin_write" ON public.categories FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  image TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  production_days INT NOT NULL DEFAULT 3,
  bestseller BOOLEAN NOT NULL DEFAULT false,
  new_release BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod_public_read" ON public.products FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "prod_admin_write" ON public.products FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_prod_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_products_category ON public.products(category_id);

-- ============ PRODUCT OPTIONS ============
CREATE TABLE public.product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_type public.option_type NOT NULL,
  label TEXT NOT NULL,
  numeric_value NUMERIC, -- usado para "quantity" (qtd unidades)
  price_modifier NUMERIC(10,4) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opt_public_read" ON public.product_options FOR SELECT USING (true);
CREATE POLICY "opt_admin_write" ON public.product_options FOR ALL USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_options_product ON public.product_options(product_id, option_type);

-- ============ CART ============
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size_option_id UUID REFERENCES public.product_options(id),
  material_option_id UUID REFERENCES public.product_options(id),
  finish_option_id UUID REFERENCES public.product_options(id),
  quantity_option_id UUID REFERENCES public.product_options(id),
  urgency TEXT NOT NULL DEFAULT 'standard',
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_select_own" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cart_insert_own" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_update_own" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cart_delete_own" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_cart_user ON public.cart_items(user_id);

-- ============ ORDERS ============
CREATE SEQUENCE public.order_number_seq START 100000;
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL UNIQUE DEFAULT ('GP-' || nextval('public.order_number_seq')),
  status public.order_status NOT NULL DEFAULT 'aguardando_pagamento',
  payment_method public.payment_method NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  customer_notes TEXT,
  internal_notes TEXT,
  estimated_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_orders_user ON public.orders(user_id, created_at DESC);

-- ============ ORDER ITEMS ============
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  config JSONB NOT NULL, -- snapshot {size, material, finish, quantity, urgency}
  unit_price NUMERIC(10,2) NOT NULL,
  qty INT NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_select_owner_or_admin" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "items_insert_owner" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ============ ORDER STATUS HISTORY ============
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hist_select_owner_or_admin" ON public.order_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "hist_insert_admin_or_owner" ON public.order_status_history FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- Trigger: registra status inicial e mudanças
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.order_status_history(order_id, status, changed_by, note)
    VALUES (NEW.id, NEW.status, auth.uid(), 'Pedido criado');
  ELSIF (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.order_status_history(order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_orders_status_log
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();