import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Plus, Loader2, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, Enums } from "@/integrations/supabase/types";

const searchSchema = z.object({ product: z.string().optional() });

export const Route = createFileRoute("/admin/opcoes")({
  validateSearch: searchSchema,
  component: AdminOptions,
});

type Product = Pick<Tables<"products">, "id" | "name">;
type Opt = Tables<"product_options">;
const TYPES: Enums<"option_type">[] = ["size", "material", "finish", "quantity", "print_side"];
const TYPE_LABEL: Record<Enums<"option_type">, string> = {
  size: "Tamanho", material: "Material", finish: "Acabamento", quantity: "Quantidade", print_side: "Impressão (frente/verso)",
};

function AdminOptions() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>(search.product ?? "");
  const [options, setOptions] = useState<Opt[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState({
    option_type: "size" as Enums<"option_type">,
    label: "", price_modifier: 1, sort_order: 0, numeric_value: "",
  });

  useEffect(() => {
    supabase.from("products").select("id, name").order("name").then(({ data }) => {
      setProducts(data ?? []);
      if (!productId && data?.length) setProductId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (productId) navigate({ search: { product: productId } });
  }, [productId]);

  async function loadOptions() {
    if (!productId) return;
    setLoading(true);
    const { data } = await supabase
      .from("product_options").select("*")
      .eq("product_id", productId)
      .order("option_type").order("sort_order");
    setOptions(data ?? []);
    setLoading(false);
  }
  useEffect(() => { loadOptions(); }, [productId]);

  async function add() {
    if (!productId || !draft.label) return toast.error("Selecione produto e informe o rótulo.");
    const { error } = await supabase.from("product_options").insert({
      product_id: productId,
      option_type: draft.option_type,
      label: draft.label,
      price_modifier: Number(draft.price_modifier),
      sort_order: Number(draft.sort_order),
      numeric_value: draft.numeric_value ? Number(draft.numeric_value) : null,
    });
    if (error) return toast.error(error.message);
    setDraft({ ...draft, label: "", numeric_value: "" });
    toast.success("Opção criada");
    loadOptions();
  }

  async function update(o: Opt, patch: Partial<Opt>) {
    const { error } = await supabase.from("product_options").update(patch).eq("id", o.id);
    if (error) return toast.error(error.message);
    setOptions((prev) => prev.map((x) => x.id === o.id ? { ...x, ...patch } : x));
  }

  async function remove(o: Opt) {
    if (!confirm(`Excluir "${o.label}"?`)) return;
    const { error } = await supabase.from("product_options").delete().eq("id", o.id);
    if (error) return toast.error(error.message);
    loadOptions();
  }

  const grouped = TYPES.map((t) => ({ type: t, items: options.filter((o) => o.option_type === t) }));

  return (
    <div className="max-w-5xl">
      <h2 className="font-display text-xl font-bold">Opções de produto</h2>
      <p className="text-sm text-muted-foreground">Tamanho, material, acabamento e quantidade — com multiplicadores de preço.</p>

      <div className="mt-4 max-w-md">
        <Label>Produto</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
          <SelectContent>
            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {productId && (
        <>
          <div className="mt-6 rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">Adicionar opção</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_120px_100px_120px_auto]">
              <Select value={draft.option_type} onValueChange={(v) => setDraft({ ...draft, option_type: v as Enums<"option_type"> })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Rótulo (ex: A4)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              <Input type="number" step="0.01" placeholder="Multiplicador" value={draft.price_modifier} onChange={(e) => setDraft({ ...draft, price_modifier: Number(e.target.value) })} />
              <Input type="number" placeholder="Ordem" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
              <Input type="number" placeholder="Qtd numérica" value={draft.numeric_value} onChange={(e) => setDraft({ ...draft, numeric_value: e.target.value })} />
              <Button onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Adicionar</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">"Qtd numérica" só é usada para tipo "quantidade" (ex: 100, 500).</p>
          </div>

          {loading ? (
            <div className="mt-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
          ) : (
            <div className="mt-6 space-y-6">
              {grouped.map(({ type, items }) => (
                <div key={type}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{TYPE_LABEL[type]}</h3>
                  {items.length === 0 ? (
                    <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">Nenhuma opção.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((o) => <OptionRow key={o.id} opt={o} onSave={(p) => update(o, p)} onDelete={() => remove(o)} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OptionRow({ opt, onSave, onDelete }: { opt: Opt; onSave: (p: Partial<Opt>) => void; onDelete: () => void }) {
  const [label, setLabel] = useState(opt.label);
  const [pm, setPm] = useState(Number(opt.price_modifier));
  const [order, setOrder] = useState(opt.sort_order);
  const [nv, setNv] = useState<string>(opt.numeric_value?.toString() ?? "");
  const dirty = label !== opt.label || pm !== Number(opt.price_modifier) || order !== opt.sort_order ||
    nv !== (opt.numeric_value?.toString() ?? "");

  return (
    <div className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-[1fr_120px_100px_120px_auto_auto]">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      <Input type="number" step="0.01" value={pm} onChange={(e) => setPm(Number(e.target.value))} />
      <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
      <Input type="number" value={nv} placeholder="—" onChange={(e) => setNv(e.target.value)} />
      <Button size="sm" disabled={!dirty} onClick={() => onSave({
        label, price_modifier: pm, sort_order: order,
        numeric_value: nv ? Number(nv) : null,
      })}>
        <Save className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}
