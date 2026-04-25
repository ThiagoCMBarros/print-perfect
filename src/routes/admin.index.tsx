import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/")({
  component: AdminProductsList,
});

type Row = Tables<"produtos"> & { categories: { name: string; slug: string } | null };

function AdminProductsList() {
  const [products, setProducts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*, categories(name, slug)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setProducts((data as unknown as Row[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(p: Row) {
    const { error } = await supabase
      .from("produtos")
      .update({ ativo: !p.ativo })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, ativo: !p.ativo } : x));
    toast.success(`Produto ${!p.ativo ? "ativado" : "desativado"}`);
  }

  const filtered = products.filter((p) =>
    !q ? true : p.nome.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Produtos</h2>
          <p className="text-sm text-muted-foreground">{products.length} cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-56"
          />
          <Button asChild>
            <Link to="/admin/produtos/$id" params={{ id: "novo" }}>
              <Plus className="mr-1.5 h-4 w-4" /> Novo produto
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Imagem</th>
                <th className="p-3">Nome</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Dimensão (mm)</th>
                <th className="p-3">Margem</th>
                <th className="p-3">Destaques</th>
                <th className="p-3 text-center">Ativo</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b transition-colors last:border-0 hover:bg-accent/30">
                  <td className="p-3">
                    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border bg-surface-muted">
                      {p.imagem ? (
                        <img src={p.imagem} alt={p.nome} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.categories?.name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{Number(p.largura_mm)}×{Number(p.altura_mm)} mm</td>
                  <td className="p-3 text-muted-foreground">{Number(p.margem_percent)}%</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {p.bestseller && <Badge variant="secondary">Top</Badge>}
                      {p.novidade && <Badge variant="outline">Novo</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Switch checked={p.ativo} onCheckedChange={() => toggleActive(p)} />
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/admin/produtos/$id" params={{ id: p.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
