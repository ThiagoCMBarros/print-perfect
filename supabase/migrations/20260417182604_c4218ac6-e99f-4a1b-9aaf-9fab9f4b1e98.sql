-- Bucket privado para artes enviadas pelo cliente
INSERT INTO storage.buckets (id, name, public) VALUES ('order-artworks', 'order-artworks', false)
ON CONFLICT (id) DO NOTHING;

-- Enum de status de aprovação de arte
DO $$ BEGIN
  CREATE TYPE public.artwork_status AS ENUM ('none', 'pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Colunas em order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS artwork_path text,
  ADD COLUMN IF NOT EXISTS artwork_filename text,
  ADD COLUMN IF NOT EXISTS artwork_status public.artwork_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS artwork_note text,
  ADD COLUMN IF NOT EXISTS artwork_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS artwork_reviewed_at timestamptz;

-- Permitir cliente UPDATE apenas dos próprios order_items (para anexar arte)
DROP POLICY IF EXISTS items_update_owner_or_admin ON public.order_items;
CREATE POLICY items_update_owner_or_admin
ON public.order_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Storage policies: pasta = orderId; só dono do pedido ou admin
CREATE POLICY "artworks_select_owner_or_admin"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'order-artworks' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.user_id = auth.uid()
    )
  )
);

CREATE POLICY "artworks_insert_owner"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'order-artworks' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.user_id = auth.uid()
    )
  )
);

CREATE POLICY "artworks_update_owner_or_admin"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'order-artworks' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.user_id = auth.uid()
    )
  )
);

CREATE POLICY "artworks_delete_owner_or_admin"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'order-artworks' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND o.user_id = auth.uid()
    )
  )
);

-- View para listar usuários (com email do auth.users) — apenas admin via has_role no select da view
CREATE OR REPLACE VIEW public.admin_users_view
WITH (security_invoker = true) AS
SELECT
  u.id AS user_id,
  u.email,
  u.created_at,
  p.full_name,
  p.phone,
  EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin') AS is_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id;

-- Função para admin promover/rebaixar (security definer)
CREATE OR REPLACE FUNCTION public.set_user_admin(_user_id uuid, _make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _make_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;
END; $$;

-- Função RPC para listar usuários (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz, full_name text, phone text, is_admin boolean, orders_count bigint, total_spent numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT
    u.id, u.email::text, u.created_at, p.full_name, p.phone,
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'),
    (SELECT count(*) FROM public.orders o WHERE o.user_id = u.id),
    COALESCE((SELECT sum(o.total) FROM public.orders o WHERE o.user_id = u.id AND o.status NOT IN ('cancelado')), 0)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  ORDER BY u.created_at DESC;
END; $$;