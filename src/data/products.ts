// Tipagem alinhada com o schema futuro do backend (Lovable Cloud / Postgres).
// Quando ativarmos Cloud na Fase 2, estes tipos serão a base das tabelas.

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string; // lucide name
};

export type ProductOption = {
  id: string;
  label: string;
  priceModifier: number; // multiplicador (1 = neutro)
};

export type Product = {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  description: string;
  image: string; // emoji/placeholder enquanto não há imagens reais
  basePrice: number; // preço base p/ menor quantidade
  productionDays: number;
  bestseller?: boolean;
  newRelease?: boolean;
  sizes: ProductOption[];
  materials: ProductOption[];
  finishes: ProductOption[];
  quantities: { id: string; value: number; priceModifier: number }[];
};

export const categories: Category[] = [
  { id: "c1", slug: "cartoes", name: "Cartões de Visita", description: "Primeira impressão profissional", icon: "CreditCard" },
  { id: "c2", slug: "panfletos", name: "Panfletos", description: "Divulgação em alta tiragem", icon: "FileText" },
  { id: "c3", slug: "flyers", name: "Flyers", description: "Comunicação direta e impactante", icon: "Newspaper" },
  { id: "c4", slug: "banners", name: "Banners", description: "Grandes formatos para eventos", icon: "Flag" },
  { id: "c5", slug: "faixas", name: "Faixas", description: "Visibilidade externa", icon: "Megaphone" },
  { id: "c6", slug: "adesivos", name: "Adesivos", description: "Recortados e personalizados", icon: "Sticker" },
  { id: "c7", slug: "etiquetas", name: "Etiquetas", description: "Para produtos e embalagens", icon: "Tag" },
  { id: "c8", slug: "pastas", name: "Pastas", description: "Material institucional", icon: "Folder" },
  { id: "c9", slug: "cartazes", name: "Cartazes", description: "Comunicação em larga escala", icon: "Image" },
  { id: "c10", slug: "receituarios", name: "Receituários", description: "Para clínicas e profissionais", icon: "ClipboardList" },
  { id: "c11", slug: "papel-timbrado", name: "Papel Timbrado", description: "Identidade corporativa", icon: "Mail" },
  { id: "c12", slug: "convites", name: "Convites", description: "Eventos e ocasiões especiais", icon: "Heart" },
];

const stdQty = [
  { id: "q1", value: 100, priceModifier: 1 },
  { id: "q2", value: 250, priceModifier: 2.1 },
  { id: "q3", value: 500, priceModifier: 3.6 },
  { id: "q4", value: 1000, priceModifier: 6.2 },
  { id: "q5", value: 2500, priceModifier: 13.5 },
];

export const products: Product[] = [
  {
    id: "p1",
    slug: "cartao-de-visita-couche-300g",
    categoryId: "c1",
    name: "Cartão de Visita Couché 300g",
    shortDescription: "Couché 300g com verniz total — clássico e profissional.",
    description:
      "Cartão de visita em papel couché 300g com impressão colorida frente e verso. Acabamento com verniz total brilho ou fosco, garantindo durabilidade e ótima apresentação. Ideal para profissionais que buscam transmitir credibilidade.",
    image: "💼",
    basePrice: 39.9,
    productionDays: 3,
    bestseller: true,
    sizes: [
      { id: "s1", label: "9x5 cm (padrão)", priceModifier: 1 },
      { id: "s2", label: "8.5x5.5 cm", priceModifier: 1.05 },
      { id: "s3", label: "9x4.8 cm (slim)", priceModifier: 1.1 },
    ],
    materials: [
      { id: "m1", label: "Couché 250g", priceModifier: 0.9 },
      { id: "m2", label: "Couché 300g", priceModifier: 1 },
      { id: "m3", label: "Reciclato 240g", priceModifier: 1.15 },
    ],
    finishes: [
      { id: "f1", label: "Sem verniz", priceModifier: 1 },
      { id: "f2", label: "Verniz total brilho", priceModifier: 1.2 },
      { id: "f3", label: "Laminação fosca + verniz localizado", priceModifier: 1.6 },
    ],
    quantities: stdQty,
  },
  {
    id: "p2",
    slug: "panfleto-a5-couche",
    categoryId: "c2",
    name: "Panfleto A5 Couché 115g",
    shortDescription: "Panfleto A5, 4x4 cores — alta tiragem com ótimo custo.",
    description:
      "Panfleto A5 (14.8x21cm) em papel couché 115g, impressão colorida frente e verso. Excelente custo-benefício para campanhas de divulgação em larga escala.",
    image: "📄",
    basePrice: 89.9,
    productionDays: 4,
    bestseller: true,
    sizes: [
      { id: "s1", label: "A6 (10x15cm)", priceModifier: 0.7 },
      { id: "s2", label: "A5 (15x21cm)", priceModifier: 1 },
      { id: "s3", label: "A4 (21x30cm)", priceModifier: 1.8 },
    ],
    materials: [
      { id: "m1", label: "Couché 90g", priceModifier: 0.9 },
      { id: "m2", label: "Couché 115g", priceModifier: 1 },
      { id: "m3", label: "Couché 150g", priceModifier: 1.25 },
    ],
    finishes: [
      { id: "f1", label: "Sem acabamento", priceModifier: 1 },
      { id: "f2", label: "Verniz UV total", priceModifier: 1.3 },
    ],
    quantities: stdQty,
  },
  {
    id: "p3",
    slug: "flyer-a6-frente-verso",
    categoryId: "c3",
    name: "Flyer A6 Frente e Verso",
    shortDescription: "Compacto, direto ao ponto. Ideal para promoções.",
    description:
      "Flyer A6 (10x15cm) com impressão 4x4 cores em couché 150g. Formato prático para distribuição em pontos de venda e eventos.",
    image: "🎟️",
    basePrice: 59.9,
    productionDays: 3,
    newRelease: true,
    sizes: [{ id: "s1", label: "A6 (10x15cm)", priceModifier: 1 }],
    materials: [
      { id: "m1", label: "Couché 115g", priceModifier: 0.9 },
      { id: "m2", label: "Couché 150g", priceModifier: 1 },
      { id: "m3", label: "Couché 250g", priceModifier: 1.4 },
    ],
    finishes: [
      { id: "f1", label: "Sem acabamento", priceModifier: 1 },
      { id: "f2", label: "Laminação fosca", priceModifier: 1.35 },
    ],
    quantities: stdQty,
  },
  {
    id: "p4",
    slug: "banner-lona-fosca",
    categoryId: "c4",
    name: "Banner Lona Fosca 440g",
    shortDescription: "Lona resistente para uso interno e externo.",
    description:
      "Banner em lona fosca 440g com impressão em alta resolução, acabamento com bastões de madeira e ilhoses. Perfeito para fachadas, eventos e feiras.",
    image: "🏳️",
    basePrice: 79.0,
    productionDays: 2,
    sizes: [
      { id: "s1", label: "0.8 x 1.2 m", priceModifier: 1 },
      { id: "s2", label: "1.0 x 1.5 m", priceModifier: 1.6 },
      { id: "s3", label: "1.5 x 2.0 m", priceModifier: 2.8 },
    ],
    materials: [
      { id: "m1", label: "Lona fosca 280g", priceModifier: 0.85 },
      { id: "m2", label: "Lona fosca 440g", priceModifier: 1 },
      { id: "m3", label: "Lona blackout", priceModifier: 1.3 },
    ],
    finishes: [
      { id: "f1", label: "Bastões + cordão", priceModifier: 1 },
      { id: "f2", label: "Bastões + ilhoses metálicos", priceModifier: 1.15 },
    ],
    quantities: [{ id: "q1", value: 1, priceModifier: 1 }],
  },
  {
    id: "p5",
    slug: "adesivo-vinil-recortado",
    categoryId: "c6",
    name: "Adesivo Vinil Recortado",
    shortDescription: "Recorte eletrônico no formato da sua arte.",
    description:
      "Adesivo em vinil branco com recorte eletrônico no contorno da arte. Resistente a água e ideal para produtos, embalagens e personalização.",
    image: "🏷️",
    basePrice: 49.9,
    productionDays: 4,
    bestseller: true,
    sizes: [
      { id: "s1", label: "5x5 cm", priceModifier: 1 },
      { id: "s2", label: "8x8 cm", priceModifier: 1.5 },
      { id: "s3", label: "10x10 cm", priceModifier: 2.1 },
    ],
    materials: [
      { id: "m1", label: "Vinil branco", priceModifier: 1 },
      { id: "m2", label: "Vinil transparente", priceModifier: 1.2 },
      { id: "m3", label: "Vinil holográfico", priceModifier: 1.8 },
    ],
    finishes: [
      { id: "f1", label: "Recorte simples", priceModifier: 1 },
      { id: "f2", label: "Laminação brilho", priceModifier: 1.25 },
    ],
    quantities: stdQty,
  },
  {
    id: "p6",
    slug: "etiqueta-adesiva-couche",
    categoryId: "c7",
    name: "Etiqueta Adesiva Couché",
    shortDescription: "Etiquetas para produtos, embalagens e brindes.",
    description:
      "Etiquetas adesivas em papel couché 90g, impressão colorida e corte personalizado. Perfeitas para identificação de produtos.",
    image: "🏷️",
    basePrice: 34.9,
    productionDays: 3,
    sizes: [
      { id: "s1", label: "3x3 cm", priceModifier: 1 },
      { id: "s2", label: "5x5 cm", priceModifier: 1.4 },
      { id: "s3", label: "7x5 cm", priceModifier: 1.7 },
    ],
    materials: [
      { id: "m1", label: "Couché 90g", priceModifier: 1 },
      { id: "m2", label: "BOPP brilho", priceModifier: 1.3 },
    ],
    finishes: [
      { id: "f1", label: "Corte reto", priceModifier: 1 },
      { id: "f2", label: "Corte personalizado", priceModifier: 1.4 },
    ],
    quantities: stdQty,
  },
  {
    id: "p7",
    slug: "convite-personalizado",
    categoryId: "c12",
    name: "Convite Personalizado",
    shortDescription: "Convites premium para eventos especiais.",
    description:
      "Convites em papel couché ou reciclato, impressão colorida com diversas opções de acabamento, incluindo hot stamping e relevo.",
    image: "💌",
    basePrice: 119.0,
    productionDays: 5,
    newRelease: true,
    sizes: [
      { id: "s1", label: "10x15 cm", priceModifier: 1 },
      { id: "s2", label: "15x21 cm", priceModifier: 1.6 },
    ],
    materials: [
      { id: "m1", label: "Couché 250g", priceModifier: 1 },
      { id: "m2", label: "Reciclato 240g", priceModifier: 1.2 },
      { id: "m3", label: "Color Plus 180g", priceModifier: 1.4 },
    ],
    finishes: [
      { id: "f1", label: "Sem acabamento", priceModifier: 1 },
      { id: "f2", label: "Hot stamping dourado", priceModifier: 1.9 },
      { id: "f3", label: "Relevo americano", priceModifier: 2.1 },
    ],
    quantities: [
      { id: "q1", value: 50, priceModifier: 1 },
      { id: "q2", value: 100, priceModifier: 1.7 },
      { id: "q3", value: 200, priceModifier: 3 },
    ],
  },
  {
    id: "p8",
    slug: "cartaz-a3-couche",
    categoryId: "c9",
    name: "Cartaz A3 Couché 150g",
    shortDescription: "Comunicação visual de alto impacto.",
    description:
      "Cartaz A3 (29.7x42cm) impresso em couché 150g, ideal para PDV, eventos e campanhas internas.",
    image: "🖼️",
    basePrice: 4.9,
    productionDays: 2,
    sizes: [
      { id: "s1", label: "A4", priceModifier: 0.6 },
      { id: "s2", label: "A3", priceModifier: 1 },
      { id: "s3", label: "A2", priceModifier: 1.8 },
    ],
    materials: [
      { id: "m1", label: "Couché 115g", priceModifier: 0.9 },
      { id: "m2", label: "Couché 150g", priceModifier: 1 },
      { id: "m3", label: "Couché 250g", priceModifier: 1.3 },
    ],
    finishes: [{ id: "f1", label: "Sem acabamento", priceModifier: 1 }],
    quantities: [
      { id: "q1", value: 10, priceModifier: 1 },
      { id: "q2", value: 25, priceModifier: 2.2 },
      { id: "q3", value: 50, priceModifier: 4 },
      { id: "q4", value: 100, priceModifier: 7.5 },
    ],
  },
];

export function calcPrice(
  product: Product,
  sizeId: string,
  materialId: string,
  finishId: string,
  quantityId: string,
  urgency: "standard" | "express" = "standard",
): { unit: number; total: number; days: number } {
  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const material = product.materials.find((m) => m.id === materialId) ?? product.materials[0];
  const finish = product.finishes.find((f) => f.id === finishId) ?? product.finishes[0];
  const qty = product.quantities.find((q) => q.id === quantityId) ?? product.quantities[0];

  const urgencyMod = urgency === "express" ? 1.35 : 1;
  const total =
    product.basePrice * size.priceModifier * material.priceModifier * finish.priceModifier *
    qty.priceModifier * urgencyMod;
  const unit = total / qty.value;
  const days = urgency === "express" ? Math.max(1, Math.ceil(product.productionDays / 2)) : product.productionDays;
  return {
    unit: Math.round(unit * 100) / 100,
    total: Math.round(total * 100) / 100,
    days,
  };
}

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const getCategory = (id: string) => categories.find((c) => c.id === id);
export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
