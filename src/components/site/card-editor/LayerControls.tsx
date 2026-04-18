import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import type { Layer } from "./types";
import { FONT_FAMILIES } from "./types";

type Props = {
  layer: Layer;
  onUpdate: (patch: Partial<Layer>) => void;
  onDelete: () => void;
};

const TEXT_PRESETS = ["#ffffff", "#0f172a", "#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

export function LayerControls({ layer, onUpdate, onDelete }: Props) {
  return (
    <div className="space-y-3 rounded-lg border-2 border-brand/30 bg-brand-soft/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">{layer.type === "text" ? "Texto selecionado" : "Logo selecionada"}</p>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {layer.type === "text" ? (
        <>
          <div>
            <Label className="text-[11px]">Conteúdo</Label>
            <Textarea
              value={layer.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={2}
              className="mt-1 text-xs"
              maxLength={200}
            />
          </div>
          <div>
            <Label className="text-[11px]">Cor do texto</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input type="color" value={layer.color} onChange={(e) => onUpdate({ color: e.target.value })} className="h-8 w-12 p-1" />
              <Input value={layer.color} onChange={(e) => onUpdate({ color: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TEXT_PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => onUpdate({ color: c })}
                  className={`h-6 w-6 rounded-md border-2 ${layer.color === c ? "border-brand" : "border-border"}`}
                  style={{ backgroundColor: c }} aria-label={c} />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Tamanho da fonte: {layer.fontSize}px</Label>
            <input type="range" min={12} max={400} value={layer.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              className="mt-1 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px]">Peso</Label>
              <select value={layer.fontWeight}
                onChange={(e) => onUpdate({ fontWeight: Number(e.target.value) as 400 | 600 | 700 | 800 })}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs">
                <option value={400}>Normal</option>
                <option value={600}>Semibold</option>
                <option value={700}>Bold</option>
                <option value={800}>Extra bold</option>
              </select>
            </div>
            <div>
              <Label className="text-[11px]">Fonte</Label>
              <select value={layer.fontFamily}
                onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs">
                {FONT_FAMILIES.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Alinhamento</Label>
            <div className="mt-1 flex gap-1">
              {([
                { v: "left", I: AlignLeft },
                { v: "center", I: AlignCenter },
                { v: "right", I: AlignRight },
              ] as const).map(({ v, I }) => (
                <Button key={v} size="sm" type="button"
                  variant={layer.align === v ? "default" : "outline"}
                  onClick={() => onUpdate({ align: v })}
                  className="h-8 flex-1">
                  <I className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div>
          <Label className="text-[11px]">Opacidade: {Math.round(layer.opacity * 100)}%</Label>
          <input type="range" min={0} max={100} value={layer.opacity * 100}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) / 100 })}
            className="mt-1 w-full" />
        </div>
      )}
    </div>
  );
}
