import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

type Material = { id: string; nome: string; tipo_material_id: string };
type TipoMaterial = { id: string; nome: string };
type Gramatura = { id: string; nome: string; material_id: string; valor_mm2: number };
type Revestimento = { id: string; nome: string };
type Acabamento = { id: string; nome: string; valor_unitario: number };

type Faixa = {
  id?: string;
  qtd_min: number;
  qtd_max: number | null;
  desconto_tipo: "none" | "percent" | "fixed";
  desconto_valor: number;
  sort_order: number;
};

export function ProductCompositionEditor({ produtoId }: { produtoId: string }) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display text-lg font-bold">Composição do produto</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Selecione quais materiais, gramaturas, revestimentos e acabamentos podem ser oferecidos
        para este produto, e configure as faixas de desconto por quantidade.
      </p>
      <Tabs defaultValue="materiais" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="gramaturas">Gramaturas</TabsTrigger>
          <TabsTrigger value="revestimentos">Revestimentos</TabsTrigger>
          <TabsTrigger value="acabamentos">Acabamentos</TabsTrigger>
          <TabsTrigger value="faixas">Faixas qty</TabsTrigger>
        </TabsList>
        <TabsContent value="materiais"><MateriaisPicker produtoId={produtoId} /></TabsContent>
        <TabsContent value="gramaturas"><GramaturasPicker produtoId={produtoId} /></TabsContent>
        <TabsContent value="revestimentos"><RevestimentosPicker produtoId={produtoId} /></TabsContent>
        <TabsContent value="acabamentos"><AcabamentosPicker produtoId={produtoId} /></TabsContent>
        <TabsContent value="faixas"><FaixasEditor produtoId={produtoId} /></TabsContent>
      </Tabs>
    </Card>
  );
}

/* ---------- shared toggle list ---------- */

function ToggleList<T extends { id: string }>({
  items,
  selected,
  onToggle,
  renderLabel,
  empty,
}: {
  items: T[];
  selected: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  renderLabel: (item: T) => React.ReactNode;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((it) => (
        <label key={it.id} className="flex items-center gap-2 rounded-lg border p-2 hover:bg-muted/40">
          <Checkbox checked={selected.has(it.id)} onCheckedChange={(v) => onToggle(it.id, !!v)} />
          <span className="text-sm">{renderLabel(it)}</span>
        </label>
      ))}
    </div>
  );
}

/* ---------- Materiais ---------- */

function MateriaisPicker({ produtoId }: { produtoId: string }) {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [tipos, setTipos] = useState<TipoMaterial[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: t }, { data: p }] = await Promise.all([
        supabase.from("materiais").select("*").eq("ativo", true).order("nome"),
        supabase.from("tipos_material").select("*").order("nome"),
        supabase.from("produto_materiais_permitidos").select("material_id").eq("produto_id", produtoId),
      ]);
      setMateriais((m as Material[]) ?? []);
      setTipos((t as TipoMaterial[]) ?? []);
      setSelected(new Set(((p as { material_id: string }[]) ?? []).map((r) => r.material_id)));
      setLoading(false);
    })();
  }, [produtoId]);

  async function toggle(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      next.add(id);
      const { error } = await supabase.from("produto_materiais_permitidos").insert({ produto_id: produtoId, material_id: id });
      if (error) return toast.error(error.message);
    } else {
      next.delete(id);
      const { error } = await supabase.from("produto_materiais_permitidos").delete().eq("produto_id", produtoId).eq("material_id", id);
      if (error) return toast.error(error.message);
    }
    setSelected(next);
  }
  const tipoNome = Object.fromEntries(tipos.map((t) => [t.id, t.nome]));
  if (loading) return <Loader2 className="animate-spin" />;
  return (
    <ToggleList
      items={materiais}
      selected={selected}
      onToggle={toggle}
      renderLabel={(m) => <><span className="text-muted-foreground">[{tipoNome[m.tipo_material_id] ?? "?"}]</span> {m.nome}</>}
      empty="Cadastre materiais em Opções → Materiais."
    />
  );
}

/* ---------- Gramaturas (filtra por materiais permitidos) ---------- */

function GramaturasPicker({ produtoId }: { produtoId: string }) {
  const [gramaturas, setGramaturas] = useState<Gramatura[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [allowedMat, setAllowedMat] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [{ data: g }, { data: m }, { data: am }, { data: p }] = await Promise.all([
        supabase.from("gramaturas").select("*").eq("ativo", true).order("nome"),
        supabase.from("materiais").select("*").order("nome"),
        supabase.from("produto_materiais_permitidos").select("material_id").eq("produto_id", produtoId),
        supabase.from("produto_gramaturas_permitidas").select("gramatura_id").eq("produto_id", produtoId),
      ]);
      setGramaturas((g as Gramatura[]) ?? []);
      setMateriais((m as Material[]) ?? []);
      setAllowedMat(new Set(((am as { material_id: string }[]) ?? []).map((r) => r.material_id)));
      setSelected(new Set(((p as { gramatura_id: string }[]) ?? []).map((r) => r.gramatura_id)));
      setLoading(false);
    })();
  }, [produtoId]);

  async function toggle(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      next.add(id);
      const { error } = await supabase.from("produto_gramaturas_permitidas").insert({ produto_id: produtoId, gramatura_id: id });
      if (error) return toast.error(error.message);
    } else {
      next.delete(id);
      const { error } = await supabase.from("produto_gramaturas_permitidas").delete().eq("produto_id", produtoId).eq("gramatura_id", id);
      if (error) return toast.error(error.message);
    }
    setSelected(next);
  }
  const matNome = Object.fromEntries(materiais.map((m) => [m.id, m.nome]));
  const filtered = allowedMat.size > 0 ? gramaturas.filter((g) => allowedMat.has(g.material_id)) : gramaturas;
  if (loading) return <Loader2 className="animate-spin" />;
  return (
    <>
      {allowedMat.size === 0 && <p className="mb-2 text-xs text-amber-600">Selecione materiais primeiro para filtrar.</p>}
      <ToggleList
        items={filtered}
        selected={selected}
        onToggle={toggle}
        renderLabel={(g) => <><span className="text-muted-foreground">[{matNome[g.material_id] ?? "?"}]</span> {g.nome} — R$ {Number(g.valor_mm2).toFixed(6)}/mm²</>}
        empty="Sem gramaturas disponíveis para os materiais selecionados."
      />
    </>
  );
}

/* ---------- Revestimentos ---------- */

function RevestimentosPicker({ produtoId }: { produtoId: string }) {
  const [items, setItems] = useState<Revestimento[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from("revestimentos").select("*").eq("ativo", true).order("nome"),
        supabase.from("produto_revestimentos_permitidos").select("revestimento_id").eq("produto_id", produtoId),
      ]);
      setItems((r as Revestimento[]) ?? []);
      setSelected(new Set(((p as { revestimento_id: string }[]) ?? []).map((x) => x.revestimento_id)));
      setLoading(false);
    })();
  }, [produtoId]);

  async function toggle(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      next.add(id);
      const { error } = await supabase.from("produto_revestimentos_permitidos").insert({ produto_id: produtoId, revestimento_id: id });
      if (error) return toast.error(error.message);
    } else {
      next.delete(id);
      const { error } = await supabase.from("produto_revestimentos_permitidos").delete().eq("produto_id", produtoId).eq("revestimento_id", id);
      if (error) return toast.error(error.message);
    }
    setSelected(next);
  }
  if (loading) return <Loader2 className="animate-spin" />;
  return (
    <ToggleList
      items={items}
      selected={selected}
      onToggle={toggle}
      renderLabel={(r) => r.nome}
      empty="Cadastre revestimentos em Opções → Revestimentos."
    />
  );
}

/* ---------- Acabamentos com qtd_padrao ---------- */

function AcabamentosPicker({ produtoId }: { produtoId: string }) {
  const [items, setItems] = useState<Acabamento[]>([]);
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from("acabamentos").select("*").eq("ativo", true).order("nome"),
        supabase.from("produto_acabamentos_permitidos").select("acabamento_id, qtd_padrao").eq("produto_id", produtoId),
      ]);
      setItems((a as Acabamento[]) ?? []);
      const map = new Map<string, number>();
      ((p as { acabamento_id: string; qtd_padrao: number }[]) ?? []).forEach((r) => map.set(r.acabamento_id, r.qtd_padrao));
      setSelected(map);
      setLoading(false);
    })();
  }, [produtoId]);

  async function toggle(id: string, checked: boolean) {
    const next = new Map(selected);
    if (checked) {
      next.set(id, 1);
      const { error } = await supabase.from("produto_acabamentos_permitidos").insert({ produto_id: produtoId, acabamento_id: id, qtd_padrao: 1 });
      if (error) return toast.error(error.message);
    } else {
      next.delete(id);
      const { error } = await supabase.from("produto_acabamentos_permitidos").delete().eq("produto_id", produtoId).eq("acabamento_id", id);
      if (error) return toast.error(error.message);
    }
    setSelected(next);
  }
  async function changeQtd(id: string, qtd: number) {
    const next = new Map(selected);
    next.set(id, qtd);
    setSelected(next);
    const { error } = await supabase.from("produto_acabamentos_permitidos")
      .update({ qtd_padrao: qtd }).eq("produto_id", produtoId).eq("acabamento_id", id);
    if (error) toast.error(error.message);
  }

  if (loading) return <Loader2 className="animate-spin" />;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Cadastre acabamentos em Opções → Acabamentos.</p>;
  return (
    <div className="space-y-2">
      {items.map((a) => {
        const checked = selected.has(a.id);
        return (
          <div key={a.id} className="flex items-center gap-3 rounded-lg border p-2">
            <Checkbox checked={checked} onCheckedChange={(v) => toggle(a.id, !!v)} />
            <span className="flex-1 text-sm">{a.nome} <span className="text-muted-foreground">— R$ {Number(a.valor_unitario).toFixed(2)}/un</span></span>
            {checked && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Qtd padrão</Label>
                <Input type="number" min={1} className="w-20" value={selected.get(a.id) ?? 1}
                  onChange={(e) => changeQtd(a.id, Math.max(1, Number(e.target.value)))} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Faixas de quantidade ---------- */

function FaixasEditor({ produtoId }: { produtoId: string }) {
  const [rows, setRows] = useState<Faixa[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("produto_faixas_quantidade")
      .select("*").eq("produto_id", produtoId).order("sort_order").order("qtd_min");
    if (error) toast.error(error.message);
    setRows((data as Faixa[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [produtoId]);

  function add() {
    setRows((r) => [...r, { qtd_min: 1, qtd_max: null, desconto_tipo: "none", desconto_valor: 0, sort_order: r.length }]);
  }
  function update(i: number, patch: Partial<Faixa>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  async function remove(i: number) {
    const f = rows[i];
    if (f.id) {
      const { error } = await supabase.from("produto_faixas_quantidade").delete().eq("id", f.id);
      if (error) return toast.error(error.message);
    }
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  async function saveAll() {
    for (const f of rows) {
      const payload = {
        produto_id: produtoId,
        qtd_min: f.qtd_min,
        qtd_max: f.qtd_max,
        desconto_tipo: f.desconto_tipo,
        desconto_valor: f.desconto_valor,
        sort_order: f.sort_order,
      };
      if (f.id) {
        const { error } = await supabase.from("produto_faixas_quantidade").update(payload).eq("id", f.id);
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("produto_faixas_quantidade").insert(payload);
        if (error) return toast.error(error.message);
      }
    }
    toast.success("Faixas salvas");
    load();
  }

  if (loading) return <Loader2 className="animate-spin" />;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Aplica desconto sobre o subtotal quando a quantidade pedida cai na faixa.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={add}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
          <Button size="sm" onClick={saveAll}><Save className="mr-1 h-4 w-4" />Salvar</Button>
        </div>
      </div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Sem faixas (preço linear).</p>}
      {rows.map((f, i) => (
        <div key={f.id ?? `new-${i}`} className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-6">
          <div>
            <Label className="text-xs">Qtd mín.</Label>
            <Input type="number" min={1} value={f.qtd_min} onChange={(e) => update(i, { qtd_min: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Qtd máx. (vazio = ∞)</Label>
            <Input type="number" value={f.qtd_max ?? ""} onChange={(e) => update(i, { qtd_max: e.target.value === "" ? null : Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Tipo desconto</Label>
            <Select value={f.desconto_tipo} onValueChange={(v) => update(i, { desconto_tipo: v as Faixa["desconto_tipo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="percent">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Valor</Label>
            <Input type="number" step="0.01" value={f.desconto_valor} onChange={(e) => update(i, { desconto_valor: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Ordem</Label>
            <Input type="number" value={f.sort_order} onChange={(e) => update(i, { sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="ghost" onClick={() => remove(i)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
