import { useCallback, useEffect, useRef, useState } from "react";
import type { Background, Layer, TemplateMeta } from "./types";
import { gradientCss } from "./types";

type Props = {
  template: TemplateMeta;
  background: Background;
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
};

type DragState =
  | { kind: "move"; id: string; startX: number; startY: number; ox: number; oy: number }
  | { kind: "resize"; id: string; corner: "se" | "sw" | "ne" | "nw"; startX: number; startY: number; ox: number; oy: number; ow: number; oh: number };

export function CanvasStage({ template, background, layers, selectedId, onSelect, onUpdate }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const drag = useRef<DragState | null>(null);

  // Calcula escala responsiva
  useEffect(() => {
    const el = stageRef.current?.parentElement;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / template.w));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [template.w]);

  const toCanvasCoords = useCallback((e: { clientX: number; clientY: number }) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  const startMove = (e: React.PointerEvent, layer: Layer) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(layer.id);
    const p = toCanvasCoords(e);
    drag.current = { kind: "move", id: layer.id, startX: p.x, startY: p.y, ox: layer.x, oy: layer.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const startResize = (e: React.PointerEvent, layer: Layer, corner: "se" | "sw" | "ne" | "nw") => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(layer.id);
    const p = toCanvasCoords(e);
    drag.current = { kind: "resize", id: layer.id, corner, startX: p.x, startY: p.y, ox: layer.x, oy: layer.y, ow: layer.w, oh: layer.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = toCanvasCoords(e);
    const dx = p.x - drag.current.startX;
    const dy = p.y - drag.current.startY;
    if (drag.current.kind === "move") {
      // Permite arrastar parcialmente para fora (útil para logos com fundo transparente).
      // Limita só pelo tamanho da própria camada para que ao menos uma borda permaneça visível.
      const layer = layers.find((l) => l.id === drag.current!.id);
      const lw = layer?.w ?? 0;
      const lh = layer?.h ?? 0;
      const margin = 20; // mantém pelo menos 20px dentro do canvas
      onUpdate(drag.current.id, {
        x: Math.round(Math.max(-(lw - margin), Math.min(template.w - margin, drag.current.ox + dx))),
        y: Math.round(Math.max(-(lh - margin), Math.min(template.h - margin, drag.current.oy + dy))),
      });
    } else {
      const d = drag.current;
      let nx = d.ox, ny = d.oy, nw = d.ow, nh = d.oh;
      if (d.corner.includes("e")) nw = Math.max(20, d.ow + dx);
      if (d.corner.includes("s")) nh = Math.max(20, d.oh + dy);
      if (d.corner.includes("w")) { nw = Math.max(20, d.ow - dx); nx = d.ox + (d.ow - nw); }
      if (d.corner.includes("n")) { nh = Math.max(20, d.oh - dy); ny = d.oy + (d.oh - nh); }
      const layer = layers.find((l) => l.id === d.id);
      const patch: Partial<Layer> = { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) };
      // Para texto, escala fontSize proporcionalmente à altura
      if (layer?.type === "text") {
        const ratio = nh / d.oh;
        (patch as Partial<typeof layer>).fontSize = Math.max(8, Math.round(layer.fontSize * ratio));
      }
      onUpdate(d.id, patch);
    }
  };

  const endDrag = () => { drag.current = null; };

  // Teclas: setas + delete
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      const layer = layers.find((l) => l.id === selectedId);
      if (!layer) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowLeft") { e.preventDefault(); onUpdate(selectedId, { x: layer.x - step }); }
      else if (e.key === "ArrowRight") { e.preventDefault(); onUpdate(selectedId, { x: layer.x + step }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); onUpdate(selectedId, { y: layer.y - step }); }
      else if (e.key === "ArrowDown") { e.preventDefault(); onUpdate(selectedId, { y: layer.y + step }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, layers, onUpdate]);

  return (
    <div className="rounded-xl border bg-surface-muted p-3">
      <div
        ref={stageRef}
        onPointerDown={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).closest("[data-stage-bg]")) onSelect(null); }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-stage-bg
        className="relative overflow-hidden rounded-md border touch-none"
        style={{
          width: "100%",
          aspectRatio: `${template.w} / ${template.h}`,
          background: gradientCss(background),
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: template.w, height: template.h, transform: `scale(${scale})` }}
        >
          {layers.map((layer) => {
            const selected = selectedId === layer.id;
            return (
              <div
                key={layer.id}
                onPointerDown={(e) => startMove(e, layer)}
                className={`absolute cursor-move ${selected ? "outline outline-2 outline-brand outline-offset-2" : "hover:outline hover:outline-1 hover:outline-brand/40"}`}
                style={{
                  left: layer.x, top: layer.y, width: layer.w, height: layer.h,
                  transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                }}
              >
                {layer.type === "text" ? (
                  <TextContent layer={layer} onMeasured={(h) => {
                    if (Math.abs(h - layer.h) > 1) onUpdate(layer.id, { h });
                  }} />
                ) : (
                  <img src={layer.src} alt="logo" draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "contain", opacity: layer.opacity, pointerEvents: "none" }} />
                )}
                {selected && (
                  <>
                    {(["nw", "ne", "sw", "se"] as const).map((c) => (
                      <div
                        key={c}
                        onPointerDown={(e) => startResize(e, layer, c)}
                        className="absolute h-3 w-3 rounded-sm border-2 border-brand bg-white"
                        style={{
                          left: c.includes("w") ? -6 : undefined,
                          right: c.includes("e") ? -6 : undefined,
                          top: c.includes("n") ? -6 : undefined,
                          bottom: c.includes("s") ? -6 : undefined,
                          cursor: c === "nw" || c === "se" ? "nwse-resize" : "nesw-resize",
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Pré-visualização ({template.realSize} @ 300dpi) — arraste, redimensione, use setas do teclado
      </p>
    </div>
  );
}
