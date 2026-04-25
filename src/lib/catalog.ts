import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DBProduto = Tables<"produtos">;
export type DBCategory = Tables<"categories">;

export type ProdutoWithCategory = DBProduto & {
  categories: Pick<DBCategory, "id" | "slug" | "name"> | null;
};

export const formatBRL = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProducts(filters: { categorySlug?: string; q?: string } = {}) {
  let query = supabase
    .from("produtos")
    .select("*, categories(id, slug, name)")
    .eq("ativo", true);

  if (filters.q) query = query.ilike("nome", `%${filters.q}%`);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  let list = (data ?? []) as ProdutoWithCategory[];
  if (filters.categorySlug) list = list.filter((p) => p.categories?.slug === filters.categorySlug);
  return list;
}

export async function fetchProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("produtos")
    .select("*, categories(id, slug, name, complexity)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as ProdutoWithCategory | null;
}

// ---------- Pricing (nova arquitetura) ----------

export type CalcInput = {
  produto_id: string;
  gramatura_id: string;
  revestimento_id?: string | null;
  aplicacao_id?: string | null;
  acabamentos?: { acabamento_id: string; qtd: number }[];
  qtd: number;
};

export type CalcResult = {
  area_mm2: number;
  valor_base: number;
  valor_revestimento: number;
  valor_acabamentos: number;
  margem_percent: number;
  unit_price: number;
  subtotal: number;
  desconto: number;
  total: number;
  qtd: number;
};

export async function calcProductPrice(input: CalcInput): Promise<CalcResult | null> {
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>)("calc_product_price", {
    p_produto_id: input.produto_id,
    p_gramatura_id: input.gramatura_id,
    p_revestimento_id: input.revestimento_id ?? null,
    p_aplicacao_id: input.aplicacao_id ?? null,
    p_acabamentos: input.acabamentos ?? [],
    p_qtd: input.qtd,
  });
  if (error) {
    console.error("calc_product_price", error);
    return null;
  }
  return data as CalcResult;
}
