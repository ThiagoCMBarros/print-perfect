import { Button } from "@/components/ui/button";
import { Type, ImageIcon, Copy, Trash2, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from "lucide-react";
import type { Layer } from "./types";

type Props = {
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, action: "front" | "back" | "forward" | "backward") => void;
};

export function LayersPanel({ layers, selectedId, onSelect, onDuplicate, onDelete, onReorder }: Props) {
  // Mostra do topo (último do array = camada de cima) para baixo
  const ordered = [...layers].reverse();

  return (
    <div className="rounded-lg border bg-background p-2">
      <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Camadas
      </p>
      {ordered.length === 0 && (
        <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">Nenhuma camada</p>
      )}
      <ul className="max-h-56 space-y-0.5 overflow-y-auto">
        {ordered.map((layer) => {
          const selected = selectedId === layer.id;
          const Icon = layer.type === "text" ? Type : ImageIcon;
          const label =
            layer.type === "text"
              ? (layer.content?.trim().slice(0, 24) || "(texto vazio)")
              : "Logo";
          return (
            <li
              key={layer.id}
              className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                selected ? "bg-brand-soft/60 ring-1 ring-brand/40" : "hover:bg-muted"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(layer.id)}
                className="flex flex-1 items-center gap-1.5 truncate text-left"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{label}</span>
              </button>
              <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100">
                <Button
                  type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                  title="Trazer para frente"
                  onClick={() => onReorder(layer.id, "front")}
                >
                  <ChevronsUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                  title="Avançar uma camada"
                  onClick={() => onReorder(layer.id, "forward")}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                  title="Recuar uma camada"
                  onClick={() => onReorder(layer.id, "backward")}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                  title="Enviar para trás"
                  onClick={() => onReorder(layer.id, "back")}
                >
                  <ChevronsDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                  title="Duplicar"
                  onClick={() => onDuplicate(layer.id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive"
                  title="Excluir"
                  onClick={() => onDelete(layer.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
