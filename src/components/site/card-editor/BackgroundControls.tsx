import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Background } from "./types";

const BG_PRESETS = ["#ffffff", "#0f172a", "#3b82f6", "#0ea5e9", "#10b981", "#ef4444", "#f59e0b", "#111827"];

export function BackgroundControls({ value, onChange }: { value: Background; onChange: (b: Background) => void }) {
  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <p className="text-xs font-semibold">Fundo do cartão</p>
      <div className="flex gap-1">
        <Button
          type="button" size="sm" variant={value.type === "solid" ? "default" : "outline"}
          className="h-7 flex-1 text-xs"
          onClick={() => onChange({ type: "solid", color: value.type === "solid" ? value.color : "#0f172a" })}
        >Sólido</Button>
        <Button
          type="button" size="sm" variant={value.type === "gradient" ? "default" : "outline"}
          className="h-7 flex-1 text-xs"
          onClick={() => onChange({ type: "gradient", color1: value.type === "gradient" ? value.color1 : "#3b82f6", color2: value.type === "gradient" ? value.color2 : "#0f172a", direction: value.type === "gradient" ? value.direction : "diagonal-1" })}
        >Gradiente</Button>
      </div>

      {value.type === "solid" ? (
        <>
          <div className="flex items-center gap-2">
            <Input type="color" value={value.color} onChange={(e) => onChange({ type: "solid", color: e.target.value })} className="h-8 w-12 p-1" />
            <Input value={value.color} onChange={(e) => onChange({ type: "solid", color: e.target.value })} className="h-8 text-xs" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BG_PRESETS.map((c) => (
              <button key={c} type="button" onClick={() => onChange({ type: "solid", color: c })}
                className={`h-6 w-6 rounded-md border-2 ${value.color === c ? "border-brand" : "border-transparent"}`}
                style={{ backgroundColor: c }} aria-label={c} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div>
            <Label className="text-[11px]">Cor inicial</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input type="color" value={value.color1} onChange={(e) => onChange({ ...value, color1: e.target.value })} className="h-8 w-12 p-1" />
              <Input value={value.color1} onChange={(e) => onChange({ ...value, color1: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Cor final</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input type="color" value={value.color2} onChange={(e) => onChange({ ...value, color2: e.target.value })} className="h-8 w-12 p-1" />
              <Input value={value.color2} onChange={(e) => onChange({ ...value, color2: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Direção</Label>
            <div className="mt-1 grid grid-cols-4 gap-1">
              {(["horizontal", "vertical", "diagonal-1", "diagonal-2"] as const).map((d) => (
                <Button key={d} type="button" size="sm" variant={value.direction === d ? "default" : "outline"}
                  onClick={() => onChange({ ...value, direction: d })} className="h-7 px-1 text-[10px]">
                  {d === "horizontal" ? "→" : d === "vertical" ? "↓" : d === "diagonal-1" ? "↘" : "↗"}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
