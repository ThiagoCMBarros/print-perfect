/**
 * Cálculo de frete MVP por região (3 primeiros dígitos do CEP).
 * Faixas oficiais dos Correios: https://www.correios.com.br/enviar/precisa-de-ajuda/tudo-sobre-cep
 *
 * SE (Sudeste, exceto SP capital): R$ 19,90 / +3 dias úteis
 * S + CO: R$ 29,90 / +4 dias úteis
 * NE: R$ 39,90 / +6 dias úteis
 * N: R$ 49,90 / +7 dias úteis
 * Frete grátis quando subtotal >= R$ 250 (mantém prazo da região).
 */

export type ShippingRegion = "SE" | "S" | "CO" | "NE" | "N";

export type ShippingQuote = {
  region: ShippingRegion;
  regionLabel: string;
  cost: number;
  deliveryDays: number;
  freeShippingApplied: boolean;
};

const FREE_SHIPPING_THRESHOLD = 250;

const TABLE: Record<ShippingRegion, { cost: number; days: number; label: string }> = {
  SE: { cost: 19.9, days: 3, label: "Sudeste" },
  S: { cost: 29.9, days: 4, label: "Sul" },
  CO: { cost: 29.9, days: 4, label: "Centro-Oeste" },
  NE: { cost: 39.9, days: 6, label: "Nordeste" },
  N: { cost: 49.9, days: 7, label: "Norte" },
};

/** Retorna a região a partir dos 3 primeiros dígitos do CEP. */
export function regionFromCep(cep: string): ShippingRegion | null {
  const digits = cep.replace(/\D/g, "");
  if (digits.length < 5) return null;
  const prefix = parseInt(digits.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return null;

  // Faixas oficiais Correios
  if (prefix >= 1 && prefix <= 199) return "SE"; // SP
  if (prefix >= 200 && prefix <= 289) return "SE"; // RJ
  if (prefix >= 290 && prefix <= 299) return "SE"; // ES
  if (prefix >= 300 && prefix <= 399) return "SE"; // MG
  if (prefix >= 400 && prefix <= 489) return "NE"; // BA
  if (prefix >= 490 && prefix <= 499) return "NE"; // SE
  if (prefix >= 500 && prefix <= 569) return "NE"; // PE
  if (prefix >= 570 && prefix <= 579) return "NE"; // AL
  if (prefix >= 580 && prefix <= 589) return "NE"; // PB
  if (prefix >= 590 && prefix <= 599) return "NE"; // RN
  if (prefix >= 600 && prefix <= 619) return "NE"; // CE
  if (prefix >= 620 && prefix <= 639) return "NE"; // PI
  if (prefix >= 640 && prefix <= 659) return "NE"; // MA
  if (prefix >= 660 && prefix <= 688) return "N"; // PA
  if (prefix >= 690 && prefix <= 692) return "N"; // AM
  if (prefix >= 693 && prefix <= 698) return "N"; // RR / AP
  if (prefix >= 699 && prefix <= 699) return "N"; // AC
  if (prefix >= 700 && prefix <= 727) return "CO"; // DF
  if (prefix >= 728 && prefix <= 729) return "CO"; // GO
  if (prefix >= 730 && prefix <= 767) return "CO"; // GO
  if (prefix >= 768 && prefix <= 769) return "N"; // RO
  if (prefix >= 770 && prefix <= 779) return "N"; // TO
  if (prefix >= 780 && prefix <= 788) return "CO"; // MT
  if (prefix >= 789 && prefix <= 789) return "N"; // AC
  if (prefix >= 790 && prefix <= 799) return "CO"; // MS
  if (prefix >= 800 && prefix <= 899) return "S"; // PR
  if (prefix >= 880 && prefix <= 899) return "S"; // SC
  if (prefix >= 900 && prefix <= 999) return "S"; // RS
  return null;
}

/** Calcula frete + prazo a partir de CEP e subtotal. */
export function calculateShipping(cep: string, subtotal: number): ShippingQuote | null {
  const region = regionFromCep(cep);
  if (!region) return null;
  const row = TABLE[region];
  const free = subtotal >= FREE_SHIPPING_THRESHOLD;
  return {
    region,
    regionLabel: row.label,
    cost: free ? 0 : row.cost,
    deliveryDays: row.days,
    freeShippingApplied: free,
  };
}

export const FREE_SHIPPING_AMOUNT = FREE_SHIPPING_THRESHOLD;
