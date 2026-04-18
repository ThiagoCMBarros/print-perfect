export type TemplateKey = "card" | "flyer" | "banner" | "sticker";

export type TextLayer = {
  id: string;
  type: "text";
  x: number; y: number; w: number; h: number;
  rotation: number;
  content: string;
  color: string;
  fontSize: number;
  fontWeight: 400 | 600 | 700 | 800;
  fontFamily: string;
  align: "left" | "center" | "right";
};

export type LogoLayer = {
  id: string;
  type: "logo";
  x: number; y: number; w: number; h: number;
  rotation: number;
  src: string;
  opacity: number;
};

export type Layer = TextLayer | LogoLayer;

export type Background =
  | { type: "solid"; color: string }
  | { type: "gradient"; color1: string; color2: string; direction: "horizontal" | "vertical" | "diagonal-1" | "diagonal-2" };

export type TemplateMeta = {
  label: string;
  w: number;
  h: number;
  realSize: string;
  defaults: { title: string; subtitle: string; line1: string; line2: string };
  font: { title: number; subtitle: number; line: number };
};

export const TEMPLATES: Record<TemplateKey, TemplateMeta> = {
  card:    { label: "Cartão de visita 9×5cm", w: 1063, h: 591, realSize: "9×5 cm",         defaults: { title: "Seu Nome", subtitle: "Cargo / Profissão", line1: "(11) 99999-9999", line2: "contato@empresa.com.br" }, font: { title: 64, subtitle: 32, line: 28 } },
  flyer:   { label: "Flyer A6 10,5×14,8cm",   w: 1240, h: 1748, realSize: "10,5×14,8 cm", defaults: { title: "PROMOÇÃO", subtitle: "Imperdível este mês", line1: "Whatsapp (11) 99999-9999", line2: "www.suaempresa.com.br" }, font: { title: 140, subtitle: 56, line: 42 } },
  banner:  { label: "Banner 200×100cm",       w: 2000, h: 1000, realSize: "200×100 cm",    defaults: { title: "INAUGURAÇÃO", subtitle: "Estamos abertos!", line1: "Rua Exemplo, 123", line2: "(11) 99999-9999" }, font: { title: 220, subtitle: 96, line: 72 } },
  sticker: { label: "Adesivo 10×10cm",        w: 1181, h: 1181, realSize: "10×10 cm",      defaults: { title: "OBRIGADO!", subtitle: "Pela preferência", line1: "@suaempresa", line2: "" }, font: { title: 130, subtitle: 56, line: 42 } },
};

export const SLUG_TO_TEMPLATE: Record<string, TemplateKey> = {
  cartoes: "card",
  "cartoes-de-visita": "card",
  panfletos: "flyer",
  flyers: "flyer",
  banners: "banner",
  "banners-grandes": "banner",
  adesivos: "sticker",
};

export const FONT_FAMILIES = [
  { label: "Sans", value: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto" },
  { label: "Serif", value: "ui-serif, Georgia, 'Times New Roman'" },
  { label: "Mono", value: "ui-monospace, 'SF Mono', Menlo, monospace" },
  { label: "Display", value: "'Playfair Display', ui-serif, Georgia, serif" },
];

export function gradientCss(bg: Background): string {
  if (bg.type === "solid") return bg.color;
  const dir = bg.direction === "horizontal" ? "to right"
    : bg.direction === "vertical" ? "to bottom"
    : bg.direction === "diagonal-1" ? "135deg"
    : "45deg";
  return `linear-gradient(${dir}, ${bg.color1}, ${bg.color2})`;
}

export function buildDefaultLayers(t: TemplateMeta): Layer[] {
  const padX = Math.round(t.w * 0.07);
  const titleY = Math.round(t.h * 0.28);
  return [
    { id: crypto.randomUUID(), type: "text", x: padX, y: titleY, w: t.w - padX * 2, h: Math.round(t.font.title * 1.3), rotation: 0, content: t.defaults.title, color: "#ffffff", fontSize: t.font.title, fontWeight: 800, fontFamily: FONT_FAMILIES[0].value, align: "left" },
    { id: crypto.randomUUID(), type: "text", x: padX, y: titleY + Math.round(t.font.title * 1.25), w: t.w - padX * 2, h: Math.round(t.font.subtitle * 1.4), rotation: 0, content: t.defaults.subtitle, color: "#ffffff", fontSize: t.font.subtitle, fontWeight: 400, fontFamily: FONT_FAMILIES[0].value, align: "left" },
    { id: crypto.randomUUID(), type: "text", x: padX, y: titleY + Math.round(t.font.title * 1.25 + t.font.subtitle * 2.4), w: t.w - padX * 2, h: Math.round(t.font.line * 1.4), rotation: 0, content: t.defaults.line1, color: "#ffffff", fontSize: t.font.line, fontWeight: 400, fontFamily: FONT_FAMILIES[0].value, align: "left" },
    ...(t.defaults.line2 ? [{ id: crypto.randomUUID(), type: "text" as const, x: padX, y: titleY + Math.round(t.font.title * 1.25 + t.font.subtitle * 2.4 + t.font.line * 1.5), w: t.w - padX * 2, h: Math.round(t.font.line * 1.4), rotation: 0, content: t.defaults.line2, color: "#ffffff", fontSize: t.font.line, fontWeight: 400, fontFamily: FONT_FAMILIES[0].value, align: "left" }] : []),
  ];
}
