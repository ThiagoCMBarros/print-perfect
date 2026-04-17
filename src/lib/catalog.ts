import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DBProduct = Tables<"products">;
export type DBCategory = Tables<"categories">;
export type DBOption = Tables<"product_options">;

export type ProductWithOptions = DBProduct & {
  categories: Pick<DBCategory, "id" | "slug" | "name"> | null;
  product_options: DBOption[];
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

export async function fetchProducts(filters: {
  categorySlug?: string;
  q?: string;
} = {}) {
  let query = supabase
    .from("products")
    .select("*, categories(id, slug, name)")
    .eq("active", true);

  if (filters.q) query = query.ilike("name", `%${filters.q}%`);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  let list = (data ?? []) as (DBProduct & { categories: Pick<DBCategory, "id" | "slug" | "name"> | null })[];
  if (filters.categorySlug) list = list.filter((p) => p.categories?.slug === filters.categorySlug);
  return list;
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithOptions | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, slug, name), product_options(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = data as ProductWithOptions;
  // Ordena opções por sort_order
  p.product_options = [...p.product_options].sort((a, b) => a.sort_order - b.sort_order);
  return p;
}

export function getOptions(product: ProductWithOptions, type: DBOption["option_type"]) {
  return product.product_options.filter((o) => o.option_type === type);
}

export function calcPrice(
  product: ProductWithOptions,
  sizeId: string | null,
  materialId: string | null,
  finishId: string | null,
  quantityId: string | null,
  urgency: "standard" | "express",
) {
  const sizes = getOptions(product, "size");
  const materials = getOptions(product, "material");
  const finishes = getOptions(product, "finish");
  const quantities = getOptions(product, "quantity");
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0];
  const material = materials.find((m) => m.id === materialId) ?? materials[0];
  const finish = finishes.find((f) => f.id === finishId) ?? finishes[0];
  const qty = quantities.find((q) => q.id === quantityId) ?? quantities[0];
  const u = urgency === "express" ? 1.35 : 1;
  const total =
    Number(product.base_price) *
    Number(size?.price_modifier ?? 1) *
    Number(material?.price_modifier ?? 1) *
    Number(finish?.price_modifier ?? 1) *
    Number(qty?.price_modifier ?? 1) *
    u;
  const units = Number(qty?.numeric_value ?? 1);
  const unit = total / units;
  const days = urgency === "express"
    ? Math.max(1, Math.ceil(product.production_days / 2))
    : product.production_days;
  return {
    unit: Math.round(unit * 100) / 100,
    total: Math.round(total * 100) / 100,
    units,
    days,
    selected: { size, material, finish, qty },
  };
}
