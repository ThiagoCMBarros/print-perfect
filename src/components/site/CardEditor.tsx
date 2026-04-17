import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, Download, Upload as UploadIcon } from "lucide-react";

type Props = {
  triggerLabel?: string;
  onExport?: (dataUrl: string) => void;
};

const BG_PRESETS = ["#ffffff", "#0f172a", "#3b82f6", "#0ea5e9", "#10b981", "#ef4444", "#f59e0b", "#111827"];
const TEXT_PRESETS = ["#0f172a", "#ffffff", "#3b82f6", "#94a3b8"];

/**
 * Editor MVP — cartão de visita 9x5cm @ 300dpi (1063x591 px).
 * Permite: cor de fundo, logo (upload), nome, função, contato 1 e 2.
 * Exporta PNG.
 */
export function CardEditor({ triggerLabel = "Personalizar arte", onExport }: Props) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bg, setBg] = useState("#0f172a");
  const [text, setText] = useState("#ffffff");
  const [name, setName] = useState("Seu Nome");
  const [role, setRole] = useState("Cargo / Profissão");
  const [c1, setC1] = useState("(11) 99999-9999");
  const [c2, setC2] = useState("contato@empresa.com.br");
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);

  const W = 1063, H = 591;

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // barra lateral
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, 18, H);
    // logo
    if (logo) {
      const maxW = 180, maxH = 180;
      const ratio = Math.min(maxW / logo.width, maxH / logo.height);
      const lw = logo.width * ratio, lh = logo.height * ratio;
      ctx.drawImage(logo, W - lw - 60, 60, lw, lh);
    }
    // texto
    ctx.fillStyle = text;
    ctx.textBaseline = "top";
    ctx.font = "bold 64px ui-sans-serif, system-ui, -apple-system";
    ctx.fillText(name, 70, 180);
    ctx.font = "32px ui-sans-serif, system-ui";
    ctx.globalAlpha = 0.75;
    ctx.fillText(role, 70, 270);
    ctx.globalAlpha = 1;
    ctx.font = "28px ui-sans-serif, system-ui";
    ctx.fillText(c1, 70, 380);
    ctx.fillText(c2, 70, 425);
  }, [open, bg, text, name, role, c1, c2, logo]);

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
    // download
    const a = document.createElement("a");
    a.href = url; a.download = "cartao-visita.png"; a.click();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PenTool className="mr-2 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Editor — Cartão de visita</DialogTitle></DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="rounded-xl border bg-surface-muted p-3">
            <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-md border bg-white" />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Pré-visualização (9×5 cm @ 300dpi)</p>
          </div>
          <div className="space-y-3">
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
            <Field label="Nome" v={name} set={setName} />
            <Field label="Cargo" v={role} set={setRole} />
            <Field label="Contato 1" v={c1} set={setC1} />
            <Field label="Contato 2" v={c2} set={setC2} />
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
      <Input className="mt-1 h-8" maxLength={80} value={v} onChange={(e) => set(e.target.value)} />
    </div>
  );
}
