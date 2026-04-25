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

// ---------- Pricing ----------

export type MaterialPricing = {
  id: string;
  name: string;
  price_per_cm2: number;
};

export type FinishPricing = {
  id: string;
  name: string;
  price_per_cm2: number;
};

/**
 * Cálculo de preço.
 *
 * Modo "auto":
 *   unit = area(cm²) × material.price_per_cm2 + area × finish.price_per_cm2
 *   subtotal = unit × qty
 *   aplica desconto da faixa (% ou R$ sobre o subtotal)
 *
 * Modo "fixed":
 *   subtotal = product.fixed_unit_price × qty
 *   aplica desconto da faixa
 *
 * Urgência express adiciona +35% no final.
 */
export function calcPrice(
  product: ProductWithOptions,
  sizeId: string | null,
  materialId: string | null,
  finishId: string | null,
  quantityId: string | null,
  urgency: "standard" | "express",
  customUnits?: number | null,
  materialPricing?: MaterialPricing | null,
  finishPricing?: FinishPricing | null,
) {
  const sizes = getOptions(product, "size");
  const materials = getOptions(product, "material");
  const finishes = getOptions(product, "finish");
  const quantities = getOptions(product, "quantity");
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0];
  const material = materials.find((m) => m.id === materialId) ?? materials[0];
  const finish = finishes.find((f) => f.id === finishId) ?? finishes[0];
  const qty = quantities.find((q) => q.id === quantityId) ?? quantities[0];
  const urgencyMod = urgency === "express" ? 1.35 : 1;

  const units = customUnits && customUnits > 0
    ? Math.floor(customUnits)
    : Number(qty?.numeric_value ?? 1);

  const mode = (product as DBProduct & { pricing_mode?: "auto" | "fixed" }).pricing_mode ?? "auto";
  const fixedUnit = Number((product as DBProduct & { fixed_unit_price?: number | null }).fixed_unit_price ?? 0);

  let unitPrice = 0;
  let area = 0;

  if (mode === "fixed" && fixedUnit > 0) {
    unitPrice = fixedUnit;
  } else {
    // Auto mode: área × preço do material + área × preço da laminação
    const w = Number((size as DBOption & { width_cm?: number | null })?.width_cm ?? 0);
    const h = Number((size as DBOption & { height_cm?: number | null })?.height_cm ?? 0);
    area = w * h;
    const matPrice = Number(materialPricing?.price_per_cm2 ?? 0);
    const finPrice = Number(finishPricing?.price_per_cm2 ?? 0);
    unitPrice = area * (matPrice + finPrice);
    // Fallback: se não há área ou preço de material configurado, usa base_price legado
    if (unitPrice <= 0) {
      unitPrice = Number(product.base_price ?? 0);
    }
  }

  let subtotal = unitPrice * units;

  // Desconto da faixa de quantidade
  const dType = (qty as DBOption & { discount_type?: "none" | "percent" | "fixed" })?.discount_type ?? "none";
  const dValue = Number((qty as DBOption & { discount_value?: number })?.discount_value ?? 0);
  let discount = 0;
  if (dType === "percent" && dValue > 0) {
    discount = subtotal * (dValue / 100);
  } else if (dType === "fixed" && dValue > 0) {
    discount = dValue;
  }
  subtotal = Math.max(0, subtotal - discount);

  const total = subtotal * urgencyMod;
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
    area: Math.round(area * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    pricingMode: mode,
    selected: { size, material, finish, qty },
  };
}

// Carrega preços globais de materiais e laminações (cm²)
export async function fetchMaterialPricing(materialOptionLabel: string | undefined | null) {
  if (!materialOptionLabel) return null;
  const { data } = await supabase
    .from("materials")
    .select("id, name, price_per_cm2")
    .ilike("name", materialOptionLabel)
    .maybeSingle();
  return data as MaterialPricing | null;
}

export async function fetchFinishPricing(finishOptionLabel: string | undefined | null) {
  if (!finishOptionLabel) return null;
  const { data } = await supabase
    .from("finishes")
    .select("id, name, price_per_cm2")
    .ilike("name", finishOptionLabel)
    .maybeSingle();
  return data as FinishPricing | null;
}

export async function fetchAllMaterialPricing() {
  const { data } = await supabase.from("materials").select("id, name, price_per_cm2");
  return (data ?? []) as MaterialPricing[];
}

export async function fetchAllFinishPricing() {
  const { data } = await supabase.from("finishes").select("id, name, price_per_cm2");
  return (data ?? []) as FinishPricing[];
}

// Helper: dada uma opção (material/finish) do produto, encontra o preço universal correspondente pelo nome
export function findPricingByLabel<T extends { name: string }>(
  list: T[],
  label: string | undefined | null,
): T | null {
  if (!label) return null;
  const norm = label.trim().toLowerCase();
  return list.find((x) => x.name.trim().toLowerCase() === norm) ?? null;
}

