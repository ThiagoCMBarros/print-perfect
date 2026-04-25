import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/opcoes")({
  component: AdminOptionsPlaceholder,
});

function AdminOptionsPlaceholder() {
  return (
    <div className="rounded-2xl border-2 border-dashed bg-card p-10 text-center">
      <Construction className="mx-auto h-12 w-12 text-brand" />
      <h2 className="mt-4 font-display text-xl font-bold">Opções (em reconstrução)</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Esta área foi removida na migração para a nova arquitetura por composição.
        Em breve teremos: Tipos de material, Materiais, Gramaturas, Revestimentos e Acabamentos —
        todos com permissões por produto.
      </p>
      <Button asChild className="mt-6">
        <Link to="/admin">Voltar aos produtos</Link>
      </Button>
    </div>
  );
}
