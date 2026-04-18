import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { productionDaysForItem, effectiveComplexity, type Complexity } from "@/lib/production-time";

export type DBProduct = Tables<"products">;
export type DBCategory = Tables<"categories">;
export type DBOption = Tables<"product_options">;

export type ProductWithOptions = DBProduct & {
  categories: (Pick<DBCategory, "id" | "slug" | "name"> & { complexity?: Complexity }) | null;
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
    .select("*, categories(id, slug, name, complexity), product_options(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = data as ProductWithOptions;
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
  customUnits?: number | null,
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

  const baseMultipliers =
    Number(product.base_price) *
    Number(size?.price_modifier ?? 1) *
    Number(material?.price_modifier ?? 1) *
    Number(finish?.price_modifier ?? 1) *
    u;

  let total: number;
  let units: number;

  if (customUnits && customUnits > 0) {
    // Use the best per-unit price tier available (largest qty option) as reference.
    const tiers = quantities
      .filter((q) => Number(q.numeric_value ?? 0) > 0 && Number(q.price_modifier ?? 0) > 0)
      .sort((a, b) => Number(b.numeric_value) - Number(a.numeric_value));
    const reference = tiers[0] ?? qty;
    const refUnits = Number(reference?.numeric_value ?? 1);
    const refTotal = baseMultipliers * Number(reference?.price_modifier ?? 1);
    const perUnit = refTotal / Math.max(1, refUnits);
    units = Math.floor(customUnits);
    total = perUnit * units;
  } else {
    total = baseMultipliers * Number(qty?.price_modifier ?? 1);
    units = Number(qty?.numeric_value ?? 1);
  }

  const unit = total / Math.max(1, units);
  const complexity = effectiveComplexity(
    (product as DBProduct & { complexity?: Complexity | null }).complexity,
    product.categories?.complexity,
  );
  const days = productionDaysForItem(units, complexity, urgency);
  return {
    unit: Math.round(unit * 100) / 100,
    total: Math.round(total * 100) / 100,
    units,
    days,
    complexity,
    selected: { size, material, finish, qty },
  };
}
