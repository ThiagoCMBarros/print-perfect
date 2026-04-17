import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategories,
});

type Cat = Tables<"categories">;

function AdminCategories() {
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: "", slug: "", icon: "Tag", sort_order: 0 });

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!draft.name || !draft.slug) return toast.error("Nome e slug são obrigatórios.");
    const { error } = await supabase.from("categories").insert(draft);
    if (error) return toast.error(error.message);
    setDraft({ name: "", slug: "", icon: "Tag", sort_order: 0 });
    toast.success("Categoria criada");
    load();
  }

  async function update(c: Cat, patch: Partial<Cat>) {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((x) => x.id === c.id ? { ...x, ...patch } : x));
  }

  async function remove(c: Cat) {
    if (!confirm(`Excluir categoria "${c.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    load();
  }

  return (
    <div className="max-w-4xl">
      <h2 className="font-display text-xl font-bold">Categorias</h2>
      <p className="text-sm text-muted-foreground">Gerencie as categorias do catálogo.</p>

      <div className="mt-6 rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">Nova categoria</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_140px_100px_auto]">
          <Input placeholder="Nome" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <Input placeholder="slug" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
          <Input placeholder="Ícone (lucide)" value={draft.icon} onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))} />
          <Input type="number" placeholder="Ordem" value={draft.sort_order} onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))} />
          <Button onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Adicionar</Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((c) => (
            <CategoryRow key={c.id} cat={c} onSave={(patch) => update(c, patch)} onDelete={() => remove(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({ cat, onSave, onDelete }: { cat: Cat; onSave: (p: Partial<Cat>) => void; onDelete: () => void }) {
  const [name, setName] = useState(cat.name);
  const [slug, setSlug] = useState(cat.slug);
  const [icon, setIcon] = useState(cat.icon ?? "");
  const [order, setOrder] = useState(cat.sort_order);
  const dirty = name !== cat.name || slug !== cat.slug || icon !== (cat.icon ?? "") || order !== cat.sort_order;

  return (
    <div className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-[1fr_1fr_140px_100px_auto_auto]">
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
      <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
      <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
      <Button size="sm" disabled={!dirty} onClick={() => onSave({ name, slug, icon: icon || null, sort_order: order })}>
        <Save className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
