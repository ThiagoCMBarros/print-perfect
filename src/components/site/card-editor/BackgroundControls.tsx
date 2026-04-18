import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import type { Background } from "./types";

const BG_PRESETS = ["#ffffff", "#0f172a", "#3b82f6", "#0ea5e9", "#10b981", "#ef4444", "#f59e0b", "#111827"];

export function BackgroundControls({ value, onChange }: { value: Background; onChange: (b: Background) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onChange({ type: "image", src: reader.result as string, fit: "cover" });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <p className="text-xs font-semibold">Fundo</p>
      <div className="grid grid-cols-4 gap-1">
        <Button
          type="button" size="sm" variant={value.type === "transparent" ? "default" : "outline"}
          className="h-7 text-[10px]"
          onClick={() => onChange({ type: "transparent" })}
        >Transparente</Button>
        <Button
          type="button" size="sm" variant={value.type === "solid" ? "default" : "outline"}
          className="h-7 text-[10px]"
          onClick={() => onChange({ type: "solid", color: value.type === "solid" ? value.color : "#0f172a" })}
        >Sólido</Button>
        <Button
          type="button" size="sm" variant={value.type === "gradient" ? "default" : "outline"}
          className="h-7 text-[10px]"
          onClick={() => onChange({
            type: "gradient",
            color1: value.type === "gradient" ? value.color1 : "#3b82f6",
            color2: value.type === "gradient" ? value.color2 : "#0f172a",
            direction: value.type === "gradient" ? value.direction : "diagonal-1",
          })}
        >Gradiente</Button>
        <Button
          type="button" size="sm" variant={value.type === "image" ? "default" : "outline"}
          className="h-7 text-[10px]"
          onClick={() => fileRef.current?.click()}
        >Imagem</Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
          e.target.value = "";
        }}
      />

      {value.type === "transparent" && (
        <p className="text-[11px] text-muted-foreground">
          O PNG exportado terá fundo transparente. O xadrez é só visualização.
        </p>
      )}

      {value.type === "solid" && (
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
      )}

      {value.type === "gradient" && (
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

      {value.type === "image" && (
        <div className="space-y-2">
          <img src={value.src} alt="fundo" className="h-20 w-full rounded border bg-white object-contain p-1" />
          <div className="grid grid-cols-2 gap-1">
            {(["cover", "contain"] as const).map((f) => (
              <Button key={f} type="button" size="sm" variant={value.fit === f ? "default" : "outline"}
                onClick={() => onChange({ ...value, fit: f })} className="h-7 text-[10px]">
                {f === "cover" ? "Preencher" : "Encaixar"}
              </Button>
            ))}
          </div>
          <Button type="button" size="sm" variant="outline" className="h-7 w-full text-[10px]" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-3 w-3" /> Trocar imagem
          </Button>
        </div>
      )}
    </div>
  );
}
