import type { Json } from "@/integrations/supabase/types";

type Composicao = {
  material_nome?: string | null;
  gramatura_nome?: string | null;
  revestimento_nome?: string | null;
  aplicacao_nome?: string | null;
  acabamentos?: { nome?: string | null; qtd?: number }[];
};

export function CompositionSummary({ composicao, className }: { composicao: Json | null | undefined; className?: string }) {
  if (!composicao || typeof composicao !== "object" || Array.isArray(composicao)) return null;
  const c = composicao as Composicao;
  const parts: string[] = [];
  if (c.material_nome) parts.push(c.material_nome);
  if (c.gramatura_nome) parts.push(c.gramatura_nome);
  if (c.revestimento_nome) {
    parts.push(c.aplicacao_nome ? `${c.revestimento_nome} (${c.aplicacao_nome})` : c.revestimento_nome);
  }
  const acabs = (c.acabamentos ?? []).filter((a) => a.nome);
  if (parts.length === 0 && acabs.length === 0) return null;
  return (
    <div className={`text-xs text-muted-foreground ${className ?? ""}`}>
      {parts.length > 0 && <p>{parts.join(" · ")}</p>}
      {acabs.length > 0 && (
        <p className="mt-0.5">
          Acabamentos: {acabs.map((a) => `${a.nome}${a.qtd && a.qtd > 1 ? ` ×${a.qtd}` : ""}`).join(", ")}
        </p>
      )}
    </div>
  );
}
