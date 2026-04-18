import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenTool, Download, Save, Loader2, Type, ImagePlus } from "lucide-react";
import { CanvasStage } from "./CanvasStage";
import { LayerControls } from "./LayerControls";
import { BackgroundControls } from "./BackgroundControls";
import { LayersPanel } from "./LayersPanel";
import { renderToBlob } from "./exportCanvas";
import {
  TEMPLATES,
  SLUG_TO_TEMPLATE,
  buildDefaultLayers,
  FONT_FAMILIES,
  type Background,
  type Layer,
  type LogoLayer,
  type TemplateKey,
  type TextLayer,
} from "./types";

type Props = {
  triggerLabel?: string;
  defaultTemplate?: TemplateKey;
  categorySlug?: string;
  lockTemplate?: boolean;
  onSave?: (blob: Blob) => Promise<void> | void;
  enableSave?: boolean;
  /** Modo personalização: bloqueia adicionar texto, apenas edita campos existentes + logo. */
  customizationMode?: boolean;
};

export function CardEditor({
  triggerLabel = "Personalizar arte",
  defaultTemplate,
  categorySlug,
  lockTemplate = false,
  onSave,
  enableSave = false,
  customizationMode = false,
}: Props) {
  const initial: TemplateKey =
    defaultTemplate ?? (categorySlug ? SLUG_TO_TEMPLATE[categorySlug] : undefined) ?? "card";
  const [open, setOpen] = useState(false);
  const [tpl, setTpl] = useState<TemplateKey>(initial);
  const t = TEMPLATES[tpl];

  const [background, setBackground] = useState<Background>({ type: "solid", color: "#0f172a" });
  const [layers, setLayers] = useState<Layer[]>(() => buildDefaultLayers(t));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const lastTpl = useRef(tpl);

  // Reset layers ao trocar template (não em modo lock)
  useEffect(() => {
    if (lastTpl.current === tpl) return;
    lastTpl.current = tpl;
    setLayers(buildDefaultLayers(TEMPLATES[tpl]));
    setSelectedId(null);
  }, [tpl]);

  const selected = useMemo(() => layers.find((l) => l.id === selectedId) ?? null, [layers, selectedId]);

  const updateLayer = (id: string, patch: Partial<Layer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
    );
  };

  const deleteLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedId(null);
  };

  const duplicateLayer = (id: string) => {
    setLayers((prev) => {
      const layer = prev.find((l) => l.id === id);
      if (!layer) return prev;
      const copy: Layer = { ...layer, id: crypto.randomUUID(), x: layer.x + 12, y: layer.y + 12 } as Layer;
      const idx = prev.findIndex((l) => l.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      setSelectedId(copy.id);
      return next;
    });
  };

  const reorderLayer = (id: string, action: "front" | "back" | "forward" | "backward") => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      let newIdx = idx;
      if (action === "front") newIdx = next.length;
      else if (action === "back") newIdx = 0;
      else if (action === "forward") newIdx = Math.min(next.length, idx + 1);
      else if (action === "backward") newIdx = Math.max(0, idx - 1);
      next.splice(newIdx, 0, item);
      return next;
    });
  };

  const addText = () => {
    const newLayer: TextLayer = {
      id: crypto.randomUUID(),
      type: "text",
      x: Math.round(t.w * 0.15),
      y: Math.round(t.h * 0.45),
      w: Math.round(t.w * 0.7),
      h: Math.round(t.font.line * 1.4),
      rotation: 0,
      content: "Novo texto",
      color: "#ffffff",
      fontSize: t.font.line,
      fontWeight: 600,
      fontFamily: FONT_FAMILIES[0].value,
      align: "left",
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedId(newLayer.id);
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = t.w * 0.3;
        const ratio = Math.min(maxW / img.width, (t.h * 0.3) / img.height);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const newLayer: LogoLayer = {
          id: crypto.randomUUID(),
          type: "logo",
          x: Math.round(t.w * 0.6),
          y: Math.round(t.h * 0.08),
          w, h,
          rotation: 0,
          src: reader.result as string,
          opacity: 1,
        };
        setLayers((prev) => [...prev, newLayer]);
        setSelectedId(newLayer.id);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function exportPng() {
    const blob = await renderToBlob(t, background, layers);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arte-${tpl}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    try {
      const blob = await renderToBlob(t, background, layers);
      await onSave(blob);
      setOpen(false);
    } catch (err) {
      console.error("[CardEditor] erro ao salvar arte:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PenTool className="mr-2 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[95vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de arte</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <CanvasStage
            template={t}
            background={background}
            layers={layers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={updateLayer}
          />

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Template</Label>
              <Select value={tpl} onValueChange={(v) => setTpl(v as TemplateKey)} disabled={lockTemplate}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
                    <SelectItem key={k} value={k}>{TEMPLATES[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lockTemplate && (
                <p className="mt-1 text-[10px] text-muted-foreground">Editando o produto selecionado.</p>
              )}
            </div>

            <LayersPanel
              layers={layers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDuplicate={duplicateLayer}
              onDelete={deleteLayer}
              onReorder={reorderLayer}
            />

            {/* Painel da camada selecionada OU controles de fundo */}
            {selected ? (
              <LayerControls
                layer={selected}
                onUpdate={(patch) => updateLayer(selected.id, patch)}
                onDelete={() => deleteLayer(selected.id)}
              />
            ) : (
              <BackgroundControls value={background} onChange={setBackground} />
            )}

            {/* Adicionar elementos */}
            <div className="grid grid-cols-2 gap-2">
              {!customizationMode && (
                <Button type="button" variant="outline" size="sm" onClick={addText}>
                  <Type className="mr-1.5 h-3.5 w-3.5" /> Texto
                </Button>
              )}
              <label className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted ${customizationMode ? "col-span-2" : ""}`}>
                <ImagePlus className="h-3.5 w-3.5" /> Adicionar imagem
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
              </label>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Dica: clique em um elemento para selecioná-lo, arraste para mover, use as alças para redimensionar.
            </p>

            {enableSave && onSave && (
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar arte e usar no pedido
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={exportPng}>
              <Download className="mr-2 h-4 w-4" /> Baixar PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

