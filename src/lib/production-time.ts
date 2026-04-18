/**
 * Regras de prazo de produção:
 * - Postagem: 1 dia útil fixo (sempre adicionado).
 * - Base: 3 dias úteis para todos.
 * - Cada 3000 unidades adiciona +1 dia (simples) ou +3 dias (complexa).
 * - Express: divide o prazo de produção por 2 (mín. 1).
 * Prazo total visível ao cliente = produção + postagem + entrega da região.
 */

export type Complexity = "simple" | "complex";

const POSTAGE_DAYS = 1;
const BASE_PRODUCTION_DAYS = 3;
const STEP_QTY = 3000;

/** Prazo de produção (sem postagem nem entrega) para 1 item. */
export function productionDaysForItem(
  qty: number,
  complexity: Complexity,
  urgency: "standard" | "express" = "standard",
): number {
  const steps = Math.max(0, Math.ceil(qty / STEP_QTY) - 1);
  const perStep = complexity === "complex" ? 3 : 1;
  const base = BASE_PRODUCTION_DAYS + steps * perStep;
  return urgency === "express" ? Math.max(1, Math.ceil(base / 2)) : base;
}

/** Resolve a complexidade efetiva (produto sobrescreve categoria). */
export function effectiveComplexity(
  productComplexity: Complexity | null | undefined,
  categoryComplexity: Complexity | null | undefined,
): Complexity {
  return productComplexity ?? categoryComplexity ?? "simple";
}

/** Prazo total para um carrinho (produção do item mais lento + postagem). */
export function productionDaysForCart(
  items: Array<{ qty: number; complexity: Complexity; urgency?: "standard" | "express" }>,
): number {
  if (items.length === 0) return 0;
  const max = Math.max(...items.map((i) => productionDaysForItem(i.qty, i.complexity, i.urgency)));
  return max + POSTAGE_DAYS;
}

export const POSTAGE_DAYS_VALUE = POSTAGE_DAYS;
export const BASE_PRODUCTION_DAYS_VALUE = BASE_PRODUCTION_DAYS;
