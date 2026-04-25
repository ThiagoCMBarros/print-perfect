import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/opcoes")({
  component: AdminOptions,
});

function AdminOptions() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Opções globais</h1>
        <p className="text-sm text-muted-foreground">
          Configure tipos de material, materiais, gramaturas, revestimentos, aplicações e acabamentos.
          Esses itens ficam disponíveis para serem associados a produtos.
        </p>
      </div>

      <Tabs defaultValue="tipos" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="tipos">Tipos de material</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="gramaturas">Gramaturas</TabsTrigger>
          <TabsTrigger value="revestimentos">Revestimentos</TabsTrigger>
          <TabsTrigger value="aplicacoes">Aplicações</TabsTrigger>
          <TabsTrigger value="acabamentos">Acabamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="tipos"><TiposMaterialTab /></TabsContent>
        <TabsContent value="materiais"><MateriaisTab /></TabsContent>
        <TabsContent value="gramaturas"><GramaturasTab /></TabsContent>
        <TabsContent value="revestimentos"><RevestimentosTab /></TabsContent>
        <TabsContent value="aplicacoes"><AplicacoesTab /></TabsContent>
        <TabsContent value="acabamentos"><AcabamentosTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- shared helpers ---------------- */

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SectionShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

/* ---------------- Tipos de Material ---------------- */

type TipoMaterial = { id: string; nome: string; slug: string; sort_order: number };

function TiposMaterialTab() {
  const [rows, setRows] = useState<TipoMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<TipoMaterial> | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("tipos_material").select("*").order("sort_order").order("nome");
    if (error) toast.error(error.message);
    setRows((data as TipoMaterial[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.nome) return toast.error("Nome obrigatório");
    const payload = {
      nome: editing.nome,
      slug: editing.slug || slugify(editing.nome),
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("tipos_material").update(payload).eq("id", editing.id)
      : await supabase.from("tipos_material").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir este tipo? Materiais vinculados podem quebrar.")) return;
    const { error } = await supabase.from("tipos_material").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <SectionShell
      title="Tipos de material"
      action={<Button size="sm" onClick={() => setEditing({ sort_order: 0 })}><Plus className="mr-1 h-4 w-4" />Novo</Button>}
    >
      {editing && (
        <div className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
          <div>
            <Label>Nome</Label>
            <Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={editing.slug ?? ""} placeholder="auto" onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-3 flex gap-2">
            <Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" />Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="mr-1 h-4 w-4" />Cancelar</Button>
          </div>
        </div>
      )}
      {loading ? <Loader2 className="animate-spin" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Nome</th><th>Slug</th><th>Ordem</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.nome}</td>
                  <td>{r.slug}</td>
                  <td>{r.sort_order}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nenhum tipo cadastrado</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

/* ---------------- Materiais ---------------- */

type Material = { id: string; tipo_material_id: string; nome: string; descricao: string | null; imagem: string | null; ativo: boolean; sort_order: number };

function MateriaisTab() {
  const [rows, setRows] = useState<Material[]>([]);
  const [tipos, setTipos] = useState<TipoMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Material> | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: m }, { data: t }] = await Promise.all([
      supabase.from("materiais").select("*").order("sort_order").order("nome"),
      supabase.from("tipos_material").select("*").order("nome"),
    ]);
    setRows((m as Material[]) ?? []);
    setTipos((t as TipoMaterial[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const tipoNome = useMemo(() => Object.fromEntries(tipos.map((t) => [t.id, t.nome])), [tipos]);

  async function save() {
    if (!editing?.nome) return toast.error("Nome obrigatório");
    if (!editing.tipo_material_id) return toast.error("Tipo obrigatório");
    const payload = {
      nome: editing.nome,
      tipo_material_id: editing.tipo_material_id,
      descricao: editing.descricao ?? null,
      imagem: editing.imagem ?? null,
      ativo: editing.ativo ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("materiais").update(payload).eq("id", editing.id)
      : await supabase.from("materiais").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir este material?")) return;
    const { error } = await supabase.from("materiais").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <SectionShell
      title="Materiais"
      action={<Button size="sm" onClick={() => setEditing({ ativo: true, sort_order: 0 })}><Plus className="mr-1 h-4 w-4" />Novo</Button>}
    >
      {editing && (
        <div className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
          <div>
            <Label>Tipo de material</Label>
            <Select value={editing.tipo_material_id ?? ""} onValueChange={(v) => setEditing({ ...editing, tipo_material_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{tipos.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={editing.descricao ?? ""} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} />
          </div>
          <div>
            <Label>Imagem (URL)</Label>
            <Input value={editing.imagem ?? ""} onChange={(e) => setEditing({ ...editing, imagem: e.target.value })} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.ativo ?? true} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
            <Label>Ativo</Label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" />Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="mr-1 h-4 w-4" />Cancelar</Button>
          </div>
        </div>
      )}
      {loading ? <Loader2 className="animate-spin" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Tipo</th><th>Nome</th><th>Ativo</th><th>Ordem</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{tipoNome[r.tipo_material_id] ?? "—"}</td>
                  <td>{r.nome}</td>
                  <td>{r.ativo ? "Sim" : "Não"}</td>
                  <td>{r.sort_order}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhum material cadastrado</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

/* ---------------- Gramaturas ---------------- */

type Gramatura = { id: string; material_id: string; nome: string; valor_mm2: number; ativo: boolean; sort_order: number };

function GramaturasTab() {
  const [rows, setRows] = useState<Gramatura[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Gramatura> | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: g }, { data: m }] = await Promise.all([
      supabase.from("gramaturas").select("*").order("sort_order").order("nome"),
      supabase.from("materiais").select("*").order("nome"),
    ]);
    setRows((g as Gramatura[]) ?? []);
    setMateriais((m as Material[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const matNome = useMemo(() => Object.fromEntries(materiais.map((m) => [m.id, m.nome])), [materiais]);

  async function save() {
    if (!editing?.nome) return toast.error("Nome obrigatório");
    if (!editing.material_id) return toast.error("Material obrigatório");
    const payload = {
      nome: editing.nome,
      material_id: editing.material_id,
      valor_mm2: Number(editing.valor_mm2 ?? 0),
      ativo: editing.ativo ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("gramaturas").update(payload).eq("id", editing.id)
      : await supabase.from("gramaturas").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir esta gramatura?")) return;
    const { error } = await supabase.from("gramaturas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <SectionShell
      title="Gramaturas (preço base por mm²)"
      action={<Button size="sm" onClick={() => setEditing({ ativo: true, sort_order: 0, valor_mm2: 0 })}><Plus className="mr-1 h-4 w-4" />Nova</Button>}
    >
      {editing && (
        <div className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
          <div>
            <Label>Material</Label>
            <Select value={editing.material_id ?? ""} onValueChange={(v) => setEditing({ ...editing, material_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{materiais.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome (ex: 250g)</Label>
            <Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
          </div>
          <div>
            <Label>Valor por mm² (R$)</Label>
            <Input type="number" step="0.000001" value={editing.valor_mm2 ?? 0} onChange={(e) => setEditing({ ...editing, valor_mm2: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.ativo ?? true} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
            <Label>Ativo</Label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" />Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="mr-1 h-4 w-4" />Cancelar</Button>
          </div>
        </div>
      )}
      {loading ? <Loader2 className="animate-spin" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Material</th><th>Nome</th><th>R$/mm²</th><th>Ativo</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{matNome[r.material_id] ?? "—"}</td>
                  <td>{r.nome}</td>
                  <td>{Number(r.valor_mm2).toFixed(6)}</td>
                  <td>{r.ativo ? "Sim" : "Não"}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhuma gramatura cadastrada</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

/* ---------------- Revestimentos ---------------- */

type Revestimento = { id: string; nome: string; descricao: string | null; valor_mm2: number; ativo: boolean; sort_order: number };

function RevestimentosTab() {
  const [rows, setRows] = useState<Revestimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Revestimento> | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("revestimentos").select("*").order("sort_order").order("nome");
    if (error) toast.error(error.message);
    setRows((data as Revestimento[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.nome) return toast.error("Nome obrigatório");
    const payload = {
      nome: editing.nome,
      descricao: editing.descricao ?? null,
      valor_mm2: Number(editing.valor_mm2 ?? 0),
      ativo: editing.ativo ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("revestimentos").update(payload).eq("id", editing.id)
      : await supabase.from("revestimentos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir este revestimento?")) return;
    const { error } = await supabase.from("revestimentos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <SectionShell
      title="Revestimentos (preço por mm²)"
      action={<Button size="sm" onClick={() => setEditing({ ativo: true, sort_order: 0, valor_mm2: 0 })}><Plus className="mr-1 h-4 w-4" />Novo</Button>}
    >
      {editing && (
        <div className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
          <div>
            <Label>Nome</Label>
            <Input value={editing.nome ?? ""} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
          </div>
          <div>
            <Label>Valor por mm² (R$)</Label>
            <Input type="number" step="0.000001" value={editing.valor_mm2 ?? 0} onChange={(e) => setEditing({ ...editing, valor_mm2: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={editing.descricao ?? ""} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.ativo ?? true} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
            <Label>Ativo</Label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" />Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="mr-1 h-4 w-4" />Cancelar</Button>
          </div>
        </div>
      )}
      {loading ? <Loader2 className="animate-spin" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Nome</th><th>R$/mm²</th><th>Ativo</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.nome}</td>
                  <td>{Number(r.valor_mm2).toFixed(6)}</td>
                  <td>{r.ativo ? "Sim" : "Não"}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nenhum revestimento</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

/* ---------------- Aplicações de Revestimento ---------------- */

type Aplicacao = { id: string; nome: string; multiplicador: number; ativo: boolean; sort_order: number };

function AplicacoesTab() {
  const [rows, setRows] = useState<Aplicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Aplicacao> | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("revestimento_aplicacoes").select("*").order("sort_order").order("nome");
    if (error) toast.error(error.message);
    setRows((data as Aplicacao[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.nome) return toast.error("Nome obrigatório");
    const payload = {
      nome: editing.nome,
      multiplicador: Number(editing.multiplicador ?? 1),
      ativo: editing.ativo ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("revestimento_aplicacoes").update(payload).eq("id", editing.id)
      : await supabase.from("revestimento_aplicacoes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir esta aplicação?")) return;
    const { error } = await supabase.from("revestimento_aplicacoes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <SectionShell
      title="Aplicações de revestimento (ex: Frente, Frente e Verso)"
      action={<Button size="sm" onClick={() => setEditing({ ativo: true, sort_order: 0, multiplicador: 1 })}><Plus className="mr-1 h-4 w-4" />Nova</Button>}
    >
      {editing && (
        <div className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
          <div>
            <Label>Nome</Label>
            <Input value={editing.nome ?? ""} placeholder="Frente / Frente e Verso" onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
          </div>
          <div>
            <Label>Multiplicador (1 = frente; 2 = frente+verso)</Label>
            <Input type="number" step="0.01" value={editing.multiplicador ?? 1} onChange={(e) => setEditing({ ...editing, multiplicador: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.ativo ?? true} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
            <Label>Ativo</Label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" />Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="mr-1 h-4 w-4" />Cancelar</Button>
          </div>
        </div>
      )}
      {loading ? <Loader2 className="animate-spin" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Nome</th><th>Mult.</th><th>Ativo</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.nome}</td>
                  <td>{r.multiplicador}</td>
                  <td>{r.ativo ? "Sim" : "Não"}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nenhuma aplicação</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}

/* ---------------- Acabamentos ---------------- */

type Acabamento = { id: string; nome: string; descricao: string | null; valor_unitario: number; ativo: boolean; sort_order: number };

function AcabamentosTab() {
  const [rows, setRows] = useState<Acabamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Acabamento> | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("acabamentos").select("*").order("sort_order").order("nome");
    if (error) toast.error(error.message);
    setRows((data as Acabamento[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.nome) return toast.error("Nome obrigatório");
    const payload = {
      nome: editing.nome,
      descricao: editing.descricao ?? null,
      valor_unitario: Number(editing.valor_unitario ?? 0),
      ativo: editing.ativo ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("acabamentos").update(payload).eq("id", editing.id)
      : await supabase.from("acabamentos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir este acabamento?")) return;
    const { error } = await supabase.from("acabamentos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <SectionShell
      title="Acabamentos (valor por unidade × quantidade)"
      action={<Button size="sm" onClick={() => setEditing({ ativo: true, sort_order: 0, valor_unitario: 0 })}><Plus className="mr-1 h-4 w-4" />Novo</Button>}
    >
      {editing && (
        <div className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
          <div>
            <Label>Nome</Label>
            <Input value={editing.nome ?? ""} placeholder="Cantos arredondados, furo etc." onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
          </div>
          <div>
            <Label>Valor unitário (R$)</Label>
            <Input type="number" step="0.01" value={editing.valor_unitario ?? 0} onChange={(e) => setEditing({ ...editing, valor_unitario: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={editing.descricao ?? ""} onChange={(e) => setEditing({ ...editing, descricao: e.target.value })} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.ativo ?? true} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
            <Label>Ativo</Label>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" />Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="mr-1 h-4 w-4" />Cancelar</Button>
          </div>
        </div>
      )}
      {loading ? <Loader2 className="animate-spin" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Nome</th><th>Valor unit.</th><th>Ativo</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.nome}</td>
                  <td>R$ {Number(r.valor_unitario).toFixed(2)}</td>
                  <td>{r.ativo ? "Sim" : "Não"}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nenhum acabamento</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </SectionShell>
  );
}
