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
  name: string;
  slug: string;
  short_description: string;
  description: string;
  base_price: string;
  production_days: string;
  category_id: string;
  image: string;
  active: boolean;
  bestseller: boolean;
  new_release: boolean;
  complexity: "" | "simple" | "complex";
  pricing_mode: "auto" | "fixed";
  fixed_unit_price: string;
};

const blank: FormState = {
  name: "", slug: "", short_description: "", description: "",
  base_price: "0", production_days: "3", category_id: "", image: "",
  active: true, bestseller: false, new_release: false, complexity: "",
  pricing_mode: "auto", fixed_unit_price: "0",
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
      setCategories(data ?? []);
      if (isNew && data && data.length) setForm((f) => ({ ...f, category_id: data[0].id }));
    });
    if (!isNew) {
      supabase.from("products").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
        if (error) toast.error(error.message);
        if (data) {
          setForm({
            name: data.name, slug: data.slug,
            short_description: data.short_description ?? "",
            description: data.description ?? "",
            base_price: String(data.base_price),
            production_days: String(data.production_days),
            category_id: data.category_id, image: data.image ?? "",
            active: data.active, bestseller: data.bestseller, new_release: data.new_release,
            complexity: ((data as Tables<"products"> & { complexity?: "simple" | "complex" | null }).complexity) ?? "",
          });
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  async function handleUpload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      cacheControl: "3600", upsert: false,
    });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image: pub.publicUrl }));
    setUploading(false);
    toast.success("Imagem enviada");
  }

  async function handleSave() {
    if (!form.name || !form.slug || !form.category_id) {
      return toast.error("Preencha nome, slug e categoria.");
    }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug,
      short_description: form.short_description || null,
      description: form.description || null,
      base_price: Number(form.base_price),
      production_days: Number(form.production_days),
      category_id: form.category_id,
      image: form.image || null,
      active: form.active,
      bestseller: form.bestseller,
      new_release: form.new_release,
      complexity: form.complexity === "" ? null : form.complexity,
    };
    if (isNew) {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Produto criado");
      navigate({ to: "/admin/produtos/$id", params: { id: data.id } });
    } else {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Produto atualizado");
    }
  }

  async function handleDelete() {
    if (isNew || !confirm("Excluir este produto? As opções e itens de pedido vinculados serão afetados.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    navigate({ to: "/admin" });
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{isNew ? "Novo produto" : "Editar produto"}</h2>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Excluir
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          <Label>Imagem de capa</Label>
          <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border bg-surface-muted">
            {form.image ? (
              <img src={form.image} alt="capa" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
            Enviar imagem
          </Button>
          {form.image && (
            <Button variant="ghost" className="w-full text-destructive" onClick={() => setForm((f) => ({ ...f, image: "" }))}>
              Remover imagem
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({
                  ...f, name: e.target.value,
                  slug: !isNew || f.slug ? f.slug : slugify(e.target.value),
                }))}
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
            </div>
          </div>

          <div>
            <Label>Categoria *</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição curta</Label>
            <Input value={form.short_description}
              onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} />
          </div>

          <div>
            <Label>Descrição completa</Label>
            <Textarea rows={5} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preço base (R$)</Label>
              <Input type="number" step="0.01" value={form.base_price}
                onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))} />
            </div>
            <div>
              <Label>Complexidade (sobrescreve a categoria)</Label>
              <Select
                value={form.complexity === "" ? "inherit" : form.complexity}
                onValueChange={(v) => setForm((f) => ({ ...f, complexity: v === "inherit" ? "" : (v as "simple" | "complex") }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Herdar da categoria</SelectItem>
                  <SelectItem value="simple">Simples (+1d a cada 3000 un)</SelectItem>
                  <SelectItem value="complex">Complexa (+3d a cada 3000 un)</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Base 3 dias úteis + 1 dia de postagem.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded-xl border p-4">
            <Toggle label="Ativo" checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            <Toggle label="Mais vendido" checked={form.bestseller} onChange={(v) => setForm((f) => ({ ...f, bestseller: v }))} />
            <Toggle label="Lançamento" checked={form.new_release} onChange={(v) => setForm((f) => ({ ...f, new_release: v }))} />
          </div>

          {!isNew && (
            <div className="rounded-xl border bg-surface-muted p-4 text-sm">
              <p className="font-medium">Opções deste produto</p>
              <p className="mt-1 text-muted-foreground">
                Gerencie tamanhos, materiais, acabamentos e quantidades em{" "}
                <Link to="/admin/opcoes" search={{ product: id }} className="text-brand underline">
                  Opções
                </Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
