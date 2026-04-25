-- Coluna para vincular arte do editor ao item de carrinho
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS artwork_path text;

-- Bucket privado para artes geradas no carrinho
INSERT INTO storage.buckets (id, name, public)
VALUES ('cart-artworks', 'cart-artworks', false)
ON CONFLICT (id) DO NOTHING;

-- Tornar quote-references privado
UPDATE storage.buckets SET public = false WHERE id = 'quote-references';

-- Limpar policies antigas (se existirem) para recriar de forma consistente
DROP POLICY IF EXISTS "cart_artworks_select_own" ON storage.objects;
DROP POLICY IF EXISTS "cart_artworks_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "cart_artworks_update_own" ON storage.objects;
DROP POLICY IF EXISTS "cart_artworks_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "cart_artworks_admin_all" ON storage.objects;

DROP POLICY IF EXISTS "quote_refs_select_own" ON storage.objects;
DROP POLICY IF EXISTS "quote_refs_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "quote_refs_admin_all" ON storage.objects;
DROP POLICY IF EXISTS "quote_refs_public_read" ON storage.objects;

-- ===== cart-artworks policies =====
CREATE POLICY "cart_artworks_select_own"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cart-artworks'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "cart_artworks_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cart-artworks'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "cart_artworks_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cart-artworks'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "cart_artworks_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cart-artworks'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "cart_artworks_admin_all"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cart-artworks'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ===== quote-references policies (agora privado) =====
-- Permite envio anônimo (formulário público) para uma pasta "public/"
CREATE POLICY "quote_refs_insert_public"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quote-references'
);

-- Apenas admin lê
CREATE POLICY "quote_refs_admin_all"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quote-references'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);