import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Plus, Loader2, Trash2, Save, Sparkles, Upload, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <h2 className="font-display text-xl font-bold">Opções & Preços</h2>
      <p className="text-sm text-muted-foreground">
        Cadastre tamanhos (em mm), materiais (por mm²), laminações (por mm²) e quantidades com desconto.
      </p>

      <Tabs defaultValue="product" className="mt-4">
        <TabsList>
          <TabsTrigger value="product">Opções por produto</TabsTrigger>
          <TabsTrigger value="materials">Materiais (preço/mm²)</TabsTrigger>
          <TabsTrigger value="finishes">Laminações (preço/mm²)</TabsTrigger>
        </TabsList>

        <TabsContent value="product" className="mt-4 space-y-4">
          <div className="max-w-md">
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
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold">Adicionar opção</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_100px_120px_auto]">
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={draft.option_type} onValueChange={(v) => setDraft({ ...draft, option_type: v as Enums<"option_type"> })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Rótulo</Label>
                    <Input placeholder="ex: 90x50 mm, Couché 300g, 100 unidades" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Ordem</Label>
                    <Input type="number" placeholder="0" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label className="text-xs">Qtd numérica</Label>
                    <Input type="number" placeholder="ex: 100" value={draft.numeric_value} onChange={(e) => setDraft({ ...draft, numeric_value: e.target.value })} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Adicionar</Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Para <strong>Tamanho</strong> defina largura/altura em mm na linha. Para <strong>Material/Laminação</strong>, o nome deve bater com o cadastro global. Para <strong>Quantidade</strong> use "Qtd numérica" (ex: 100, 1000) e configure desconto na linha.
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
              ) : (
                <div className="space-y-6">
                  {grouped.map(({ type, items }) => (
                    <div key={type}>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{TYPE_LABEL[type]}</h3>
                      {items.length === 0 ? (
                        <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">Nenhuma opção.</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((o) => (
                            <OptionRow
                              key={o.id}
                              opt={o}
                              onSave={(p) => update(o, p)}
                              onDelete={() => remove(o)}
                              onLocalImage={(url) => setOptions((prev) => prev.map((x) => x.id === o.id ? { ...x, image: url } : x))}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <GlobalPricingManager kind="materials" />
        </TabsContent>

        <TabsContent value="finishes" className="mt-4">
          <GlobalPricingManager kind="finishes" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type OptExt = Opt & {
  width_cm?: number | null;
  height_cm?: number | null;
  discount_type?: "none" | "percent" | "fixed";
  discount_value?: number;
};

function OptionRow({
  opt, onSave, onDelete, onLocalImage,
}: {
  opt: Opt;
  onSave: (p: Partial<OptExt>) => void;
  onDelete: () => void;
  onLocalImage: (url: string | null) => void;
}) {
  const o = opt as OptExt;
  const [label, setLabel] = useState(opt.label);
  const [order, setOrder] = useState(opt.sort_order);
  const [nv, setNv] = useState<string>(opt.numeric_value?.toString() ?? "");
  const [w, setW] = useState<string>(o.width_cm?.toString() ?? "");
  const [h, setH] = useState<string>(o.height_cm?.toString() ?? "");
  const [dType, setDType] = useState<"none" | "percent" | "fixed">(o.discount_type ?? "none");
  const [dValue, setDValue] = useState<string>(String(o.discount_value ?? 0));
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isSize = opt.option_type === "size";
  const isQty = opt.option_type === "quantity";

  const dirty =
    label !== opt.label || order !== opt.sort_order ||
    nv !== (opt.numeric_value?.toString() ?? "") ||
    w !== (o.width_cm?.toString() ?? "") ||
    h !== (o.height_cm?.toString() ?? "") ||
    dType !== (o.discount_type ?? "none") ||
    dValue !== String(o.discount_value ?? 0);

  async function handleGenerate() {
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-size-image", {
      body: { option_id: opt.id },
    });
    setGenerating(false);
    if (error) return toast.error(error.message);
    if (data?.error) return toast.error(data.error);
    if (data?.image) {
      onLocalImage(data.image);
      toast.success("Imagem gerada!");
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `option-${opt.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    const { error: updErr } = await supabase.from("product_options").update({ image: pub.publicUrl }).eq("id", opt.id);
    setUploading(false);
    if (updErr) return toast.error(updErr.message);
    onLocalImage(pub.publicUrl);
    toast.success("Imagem enviada!");
  }

  async function handleClear() {
    const { error } = await supabase.from("product_options").update({ image: null }).eq("id", opt.id);
    if (error) return toast.error(error.message);
    onLocalImage(null);
  }

  function save() {
    const patch: Partial<OptExt> = {
      label, sort_order: order,
      numeric_value: nv ? Number(nv) : null,
    };
    if (isSize) {
      patch.width_cm = w ? Number(w) : null;
      patch.height_cm = h ? Number(h) : null;
    }
    if (isQty) {
      patch.discount_type = dType;
      patch.discount_value = Number(dValue) || 0;
    }
    onSave(patch);
  }

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="grid gap-2 sm:grid-cols-[64px_1fr_100px_120px_auto_auto]">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border bg-surface-muted">
          {opt.image ? (
            <img src={opt.image} alt={opt.label} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rótulo" />
        <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} placeholder="Ordem" />
        <Input type="number" value={nv} placeholder="Qtd" onChange={(e) => setNv(e.target.value)} />
        <Button size="sm" disabled={!dirty} onClick={save}><Save className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>

      {isSize && (
        <div className="flex flex-wrap items-end gap-2 border-t pt-2">
          <div>
            <Label className="text-xs">Largura (cm)</Label>
            <Input type="number" step="0.1" className="w-24" value={w} onChange={(e) => setW(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Altura (cm)</Label>
            <Input type="number" step="0.1" className="w-24" value={h} onChange={(e) => setH(e.target.value)} />
          </div>
          {w && h && (
            <span className="text-xs text-muted-foreground self-center">
              Área: <strong>{(Number(w) * Number(h)).toFixed(2)} cm²</strong>
            </span>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              Foto
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              IA
            </Button>
            {opt.image && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={handleClear}>
                <X className="mr-1 h-3.5 w-3.5" /> Remover
              </Button>
            )}
          </div>
        </div>
      )}

      {isQty && (
        <div className="flex flex-wrap items-end gap-2 border-t pt-2">
          <div>
            <Label className="text-xs">Tipo de desconto</Label>
            <Select value={dType} onValueChange={(v) => setDType(v as "none" | "percent" | "fixed")}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem desconto</SelectItem>
                <SelectItem value="percent">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dType !== "none" && (
            <div>
              <Label className="text-xs">{dType === "percent" ? "% off" : "R$ off"}</Label>
              <Input type="number" step="0.01" className="w-28" value={dValue} onChange={(e) => setDValue(e.target.value)} />
            </div>
          )}
          <span className="text-xs text-muted-foreground self-center">
            Aplicado sobre o subtotal (preço unitário × qtd).
          </span>
        </div>
      )}
    </div>
  );
}

// ============= Materiais e Laminações Globais =============

type GlobalKind = "materials" | "finishes";
type GlobalRowT = { id: string; name: string; price_per_cm2: number; description: string | null; active: boolean; material_type_id: string };
type MaterialType = Tables<"material_types">;

function GlobalPricingManager({ kind }: { kind: GlobalKind }) {
  const [rows, setRows] = useState<GlobalRowT[]>([]);
  const [types, setTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: "", price_per_cm2: "0", material_type_id: "" });

  async function load() {
    setLoading(true);
    const [{ data: r }, { data: t }] = await Promise.all([
      supabase.from(kind).select("id, name, price_per_cm2, description, active, material_type_id").order("name"),
      supabase.from("material_types").select("*").order("sort_order"),
    ]);
    setRows((r ?? []) as GlobalRowT[]);
    setTypes(t ?? []);
    if (!draft.material_type_id && t && t.length) setDraft((d) => ({ ...d, material_type_id: t[0].id }));
    setLoading(false);
  }
  useEffect(() => { load(); }, [kind]);

  async function add() {
    if (!draft.name || !draft.material_type_id) return toast.error("Informe nome e tipo.");
    const { error } = await supabase.from(kind).insert({
      name: draft.name,
      price_per_cm2: Number(draft.price_per_cm2),
      material_type_id: draft.material_type_id,
    });
    if (error) return toast.error(error.message);
    setDraft({ ...draft, name: "", price_per_cm2: "0" });
    toast.success("Cadastrado!");
    load();
  }

  async function update(row: GlobalRowT, patch: Partial<GlobalRowT>) {
    const { error } = await supabase.from(kind).update(patch).eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((x) => x.id === row.id ? { ...x, ...patch } : x));
  }

  async function remove(row: GlobalRowT) {
    if (!confirm(`Excluir "${row.name}"?`)) return;
    const { error } = await supabase.from(kind).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  }

  const label = kind === "materials" ? "Material (papel)" : "Laminação / Acabamento";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-surface-muted p-4 text-sm">
        <p className="font-medium">{label} — preço universal por cm²</p>
        <p className="text-muted-foreground text-xs mt-1">
          Ex.: Couché 300g = R$ 0,05 / cm². Esse preço é usado por TODOS os produtos cuja opção {kind === "materials" ? "Material" : "Acabamento"} tiver o mesmo nome.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">Adicionar</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_140px_auto]">
          <Input placeholder="Nome (ex: Couché 300g)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Select value={draft.material_type_id} onValueChange={(v) => setDraft({ ...draft, material_type_id: v })}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" step="0.001" placeholder="R$/cm²" value={draft.price_per_cm2} onChange={(e) => setDraft({ ...draft, price_per_cm2: e.target.value })} />
          <Button onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Adicionar</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-6 text-sm text-center text-muted-foreground">Nenhum cadastro ainda.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => <GlobalEditRow key={row.id} row={row} types={types} onSave={(p) => update(row, p)} onDelete={() => remove(row)} />)}
        </div>
      )}
    </div>
  );
}

function GlobalEditRow({ row, types, onSave, onDelete }: {
  row: GlobalRowT;
  types: MaterialType[];
  onSave: (p: Partial<GlobalRowT>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [price, setPrice] = useState(String(row.price_per_cm2));
  const [typeId, setTypeId] = useState(row.material_type_id);
  const dirty = name !== row.name || price !== String(row.price_per_cm2) || typeId !== row.material_type_id;

  return (
    <div className="rounded-xl border bg-card p-3 grid gap-2 sm:grid-cols-[1fr_180px_140px_auto_auto]">
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Select value={typeId} onValueChange={setTypeId}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input type="number" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Button size="sm" disabled={!dirty} onClick={() => onSave({ name, price_per_cm2: Number(price), material_type_id: typeId })}>
        <Save className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}
