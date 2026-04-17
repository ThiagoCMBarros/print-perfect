import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenTool, Download, Upload as UploadIcon } from "lucide-react";

type Props = {
  triggerLabel?: string;
  defaultTemplate?: TemplateKey;
  categorySlug?: string;
  onExport?: (dataUrl: string) => void;
};

const SLUG_TO_TEMPLATE: Record<string, TemplateKey> = {
  cartoes: "card",
  panfletos: "flyer",
  flyers: "flyer",
  banners: "banner",
  adesivos: "sticker",
};

const BG_PRESETS = ["#ffffff", "#0f172a", "#3b82f6", "#0ea5e9", "#10b981", "#ef4444", "#f59e0b", "#111827"];
const TEXT_PRESETS = ["#0f172a", "#ffffff", "#3b82f6", "#94a3b8"];

type TemplateKey = "card" | "flyer" | "banner" | "sticker";

const TEMPLATES: Record<TemplateKey, {
  label: string;
  /** Largura x altura em px (300dpi). */
  w: number; h: number;
  /** Tamanho real para o usuário ver. */
  realSize: string;
  defaults: { title: string; subtitle: string; line1: string; line2: string };
  /** Tamanhos de fonte em px no canvas. */
  font: { title: number; subtitle: number; line: number };
}> = {
  card:    { label: "Cartão de visita 9×5cm", w: 1063, h: 591, realSize: "9×5 cm",  defaults: { title: "Seu Nome", subtitle: "Cargo / Profissão", line1: "(11) 99999-9999", line2: "contato@empresa.com.br" }, font: { title: 64, subtitle: 32, line: 28 } },
  flyer:   { label: "Flyer A6 10,5×14,8cm",   w: 1240, h: 1748, realSize: "10,5×14,8 cm", defaults: { title: "PROMOÇÃO", subtitle: "Imperdível este mês", line1: "Whatsapp (11) 99999-9999", line2: "www.suaempresa.com.br" }, font: { title: 140, subtitle: 56, line: 42 } },
  banner:  { label: "Banner 200×100cm",        w: 2000, h: 1000, realSize: "200×100 cm", defaults: { title: "INAUGURAÇÃO", subtitle: "Estamos abertos!", line1: "Rua Exemplo, 123", line2: "(11) 99999-9999" }, font: { title: 220, subtitle: 96, line: 72 } },
  sticker: { label: "Adesivo 10×10cm",          w: 1181, h: 1181, realSize: "10×10 cm", defaults: { title: "OBRIGADO!", subtitle: "Pela preferência", line1: "@suaempresa", line2: "" }, font: { title: 130, subtitle: 56, line: 42 } },
};

/**
 * Editor MVP — suporta cartão, flyer, banner e adesivo.
 * Permite cor de fundo, logo, e 4 campos de texto. Exporta PNG em alta resolução.
 */
export function CardEditor({ triggerLabel = "Personalizar arte", defaultTemplate, categorySlug, onExport }: Props) {
  const initial: TemplateKey = defaultTemplate ?? (categorySlug ? SLUG_TO_TEMPLATE[categorySlug] : undefined) ?? "card";
  const [open, setOpen] = useState(false);
  const [tpl, setTpl] = useState<TemplateKey>(initial);
  const t = TEMPLATES[tpl];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bg, setBg] = useState("#0f172a");
  const [text, setText] = useState("#ffffff");
  const [title, setTitle] = useState(t.defaults.title);
  const [subtitle, setSubtitle] = useState(t.defaults.subtitle);
  const [line1, setLine1] = useState(t.defaults.line1);
  const [line2, setLine2] = useState(t.defaults.line2);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);

  // Quando troca template, repõe defaults
  useEffect(() => {
    const nt = TEMPLATES[tpl];
    setTitle(nt.defaults.title);
    setSubtitle(nt.defaults.subtitle);
    setLine1(nt.defaults.line1);
    setLine2(nt.defaults.line2);
  }, [tpl]);

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = t.w, H = t.h;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // barra lateral decorativa
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, Math.max(18, Math.floor(W * 0.018)), H);
    // logo no canto superior direito
    if (logo) {
      const maxW = W * 0.22, maxH = H * 0.22;
      const ratio = Math.min(maxW / logo.width, maxH / logo.height);
      const lw = logo.width * ratio, lh = logo.height * ratio;
      ctx.drawImage(logo, W - lw - W * 0.06, H * 0.06, lw, lh);
    }
    // texto
    const padX = W * 0.07;
    let y = H * 0.28;
    ctx.fillStyle = text;
    ctx.textBaseline = "top";
    ctx.font = `bold ${t.font.title}px ui-sans-serif, system-ui, -apple-system`;
    ctx.fillText(title, padX, y);
    y += t.font.title * 1.15;
    ctx.font = `${t.font.subtitle}px ui-sans-serif, system-ui`;
    ctx.globalAlpha = 0.75;
    ctx.fillText(subtitle, padX, y);
    ctx.globalAlpha = 1;
    y += t.font.subtitle * 2.2;
    ctx.font = `${t.font.line}px ui-sans-serif, system-ui`;
    if (line1) { ctx.fillText(line1, padX, y); y += t.font.line * 1.4; }
    if (line2) { ctx.fillText(line2, padX, y); }
  }, [open, bg, text, title, subtitle, line1, line2, logo, t]);

  function handleLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setLogo(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function exportPng() {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    onExport?.(url);
    const a = document.createElement("a");
    a.href = url; a.download = `arte-${tpl}.png`; a.click();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PenTool className="mr-2 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Editor de arte</DialogTitle></DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl border bg-surface-muted p-3">
            <canvas ref={canvasRef} width={t.w} height={t.h} className="h-auto w-full rounded-md border bg-white" />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Pré-visualização ({t.realSize} @ 300dpi)</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Template</Label>
              <Select value={tpl} onValueChange={(v) => setTpl(v as TemplateKey)}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
                    <SelectItem key={k} value={k}>{TEMPLATES[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cor de fundo</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BG_PRESETS.map((c) => (
                  <button key={c} type="button" onClick={() => setBg(c)} aria-label={c}
                    className={`h-7 w-7 rounded-md border-2 ${bg === c ? "border-brand" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Cor do texto</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TEXT_PRESETS.map((c) => (
                  <button key={c} type="button" onClick={() => setText(c)} aria-label={c}
                    className={`h-7 w-7 rounded-md border-2 ${text === c ? "border-brand" : "border-border"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Field label="Título" v={title} set={setTitle} />
            <Field label="Subtítulo" v={subtitle} set={setSubtitle} />
            <Field label="Linha 1" v={line1} set={setLine1} />
            <Field label="Linha 2" v={line2} set={setLine2} />
            <div>
              <Label className="text-xs">Logo (opcional)</Label>
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-md border-2 border-dashed bg-background p-2 text-xs text-muted-foreground hover:border-brand/40">
                <UploadIcon className="h-3.5 w-3.5" /> {logo ? "Trocar logo" : "Enviar logo"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
              </label>
            </div>
            <Button className="w-full" onClick={exportPng}>
              <Download className="mr-2 h-4 w-4" /> Baixar PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1 h-8" maxLength={120} value={v} onChange={(e) => set(e.target.value)} />
    </div>
  );
}
