import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Save, Trash2, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/produtos/$id")({
  component: AdminProductForm,
});

type Cat = Tables<"categories">;
type FormState = {
  nome: string;
  slug: string;
  descricao_curta: string;
  descricao: string;
  largura_mm: string;
  altura_mm: string;
  margem_percent: string;
  dias_producao: string;
  category_id: string;
  imagem: string;
  ativo: boolean;
  bestseller: boolean;
  novidade: boolean;
  complexidade: "" | "simple" | "medium" | "complex";
};

const blank: FormState = {
  nome: "", slug: "", descricao_curta: "", descricao: "",
  largura_mm: "0", altura_mm: "0", margem_percent: "0",
  dias_producao: "3", category_id: "", imagem: "",
  ativo: true, bestseller: false, novidade: false, complexidade: "",
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AdminProductForm() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "novo";
  const [form, setForm] = useState<FormState>(blank);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data as Cat[]) ?? []);
    });
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    supabase.from("produtos").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error) toast.error(error.message);
      if (data) {
        setForm({
          nome: data.nome,
          slug: data.slug,
          descricao_curta: data.descricao_curta ?? "",
          descricao: data.descricao ?? "",
          largura_mm: String(data.largura_mm ?? 0),
          altura_mm: String(data.altura_mm ?? 0),
          margem_percent: String(data.margem_percent ?? 0),
          dias_producao: String(data.dias_producao ?? 3),
          category_id: data.category_id ?? "",
          imagem: data.imagem ?? "",
          ativo: data.ativo,
          bestseller: data.bestseller,
          novidade: data.novidade,
          complexidade: (data.complexidade ?? "") as FormState["complexidade"],
        });
      }
      setLoading(false);
    });
  }, [id, isNew]);

  async function handleUpload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `produto-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, imagem: data.publicUrl }));
    setUploading(false);
  }

  async function save() {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    if (!form.slug.trim()) return toast.error("Slug é obrigatório");
    if (!form.category_id) return toast.error("Categoria é obrigatória");
    setSaving(true);
    const payload = {
      nome: form.nome,
      slug: form.slug,
      descricao_curta: form.descricao_curta || null,
      descricao: form.descricao || null,
      largura_mm: Number(form.largura_mm),
      altura_mm: Number(form.altura_mm),
      margem_percent: Number(form.margem_percent),
      dias_producao: Number(form.dias_producao),
      category_id: form.category_id,
      imagem: form.imagem || null,
      ativo: form.ativo,
      bestseller: form.bestseller,
      novidade: form.novidade,
      complexidade: form.complexidade || null,
    };
    if (isNew) {
      const { data, error } = await supabase.from("produtos").insert(payload).select("id").single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Produto criado");
      navigate({ to: "/admin/produtos/$id", params: { id: data.id } });
    } else {
      const { error } = await supabase.from("produtos").update(payload).eq("id", id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Produto salvo");
    }
  }

  async function remove() {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    navigate({ to: "/admin" });
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
        </Button>
        <div>
          <h2 className="font-display text-xl font-bold">{isNew ? "Novo produto" : "Editar produto"}</h2>
          <p className="text-sm text-muted-foreground">Cadastre as dimensões e configure depois materiais, gramaturas, revestimentos e acabamentos permitidos.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-2xl border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value, slug: f.slug || slugify(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
            </div>
          </div>

          <div>
            <Label>Descrição curta</Label>
            <Input value={form.descricao_curta} onChange={(e) => setForm((f) => ({ ...f, descricao_curta: e.target.value }))} />
          </div>

          <div>
            <Label>Descrição completa</Label>
            <Textarea rows={4} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Largura (mm)</Label>
              <Input type="number" step="0.1" value={form.largura_mm} onChange={(e) => setForm((f) => ({ ...f, largura_mm: e.target.value }))} />
            </div>
            <div>
              <Label>Altura (mm)</Label>
              <Input type="number" step="0.1" value={form.altura_mm} onChange={(e) => setForm((f) => ({ ...f, altura_mm: e.target.value }))} />
            </div>
            <div>
              <Label>Área (mm²)</Label>
              <Input readOnly value={(Number(form.largura_mm) * Number(form.altura_mm)).toFixed(2)} className="bg-muted" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Margem (%)</Label>
              <Input type="number" step="0.1" value={form.margem_percent} onChange={(e) => setForm((f) => ({ ...f, margem_percent: e.target.value }))} />
            </div>
            <div>
              <Label>Dias de produção</Label>
              <Input type="number" value={form.dias_producao} onChange={(e) => setForm((f) => ({ ...f, dias_producao: e.target.value }))} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Complexidade</Label>
            <Select value={form.complexidade} onValueChange={(v) => setForm((f) => ({ ...f, complexidade: v as FormState["complexidade"] }))}>
              <SelectTrigger><SelectValue placeholder="Herdar da categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simples</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="complex">Complexa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border bg-card p-5">
            <Label>Imagem</Label>
            <div className="mt-2 grid aspect-square w-full place-items-center overflow-hidden rounded-xl border bg-surface-muted">
              {form.imagem ? (
                <img src={form.imagem} alt={form.nome} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {form.imagem ? "Trocar imagem" : "Enviar imagem"}
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mais vendido</Label>
              <Switch checked={form.bestseller} onCheckedChange={(v) => setForm((f) => ({ ...f, bestseller: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Lançamento</Label>
              <Switch checked={form.novidade} onCheckedChange={(v) => setForm((f) => ({ ...f, novidade: v }))} />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed bg-card p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Próximos passos</p>
            <p className="mt-2">Materiais permitidos, gramaturas, revestimentos, acabamentos e faixas de quantidade serão configurados nas próximas telas (em construção).</p>
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
          {!isNew && (
            <Button variant="outline" onClick={remove} className="w-full text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
