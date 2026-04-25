import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Loader2, Trash2, Save, Upload, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategories,
});

type Cat = Tables<"categories">;

async function uploadCategoryImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
  return pub.publicUrl;
}

function AdminCategories() {
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ name: string; slug: string; icon: string; sort_order: number; complexity: "simple" | "complex"; image: string }>({ name: "", slug: "", icon: "Tag", sort_order: 0, complexity: "simple", image: "" });
  const [uploadingDraft, setUploadingDraft] = useState(false);
  const draftFileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setItems(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!draft.name || !draft.slug) return toast.error("Nome e slug são obrigatórios.");
    const { error } = await supabase.from("categories").insert({
      name: draft.name,
      slug: draft.slug,
      icon: draft.icon,
      sort_order: draft.sort_order,
      complexity: draft.complexity,
      image: draft.image || null,
    });
    if (error) return toast.error(error.message);
    setDraft({ name: "", slug: "", icon: "Tag", sort_order: 0, complexity: "simple", image: "" });
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

  async function handleDraftUpload(file: File) {
    setUploadingDraft(true);
    const url = await uploadCategoryImage(file);
    setUploadingDraft(false);
    if (url) {
      setDraft((d) => ({ ...d, image: url }));
      toast.success("Imagem enviada");
    }
  }

  return (
    <div className="max-w-5xl">
      <h2 className="font-display text-xl font-bold">Categorias</h2>
      <p className="text-sm text-muted-foreground">Gerencie as categorias do catálogo.</p>

      <div className="mt-6 rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">Nova categoria</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[80px_1fr_1fr_120px_140px_90px_auto]">
          <button
            type="button"
            onClick={() => draftFileRef.current?.click()}
            className="relative grid aspect-square place-items-center overflow-hidden rounded-md border bg-muted text-muted-foreground hover:border-brand"
            title="Enviar imagem"
          >
            {uploadingDraft ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : draft.image ? (
              <img src={draft.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
            <input
              ref={draftFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleDraftUpload(f);
                e.target.value = "";
              }}
            />
          </button>
          <Input placeholder="Nome" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <Input placeholder="slug" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
          <Input placeholder="Ícone (lucide)" value={draft.icon} onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))} />
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={draft.complexity}
            onChange={(e) => setDraft((d) => ({ ...d, complexity: e.target.value as "simple" | "complex" }))}
          >
            <option value="simple">Simples (+1d/3000)</option>
            <option value="complex">Complexa (+3d/3000)</option>
          </select>
          <Input type="number" placeholder="Ordem" value={draft.sort_order} onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))} />
          <Button onClick={add}><Plus className="mr-1.5 h-4 w-4" /> Adicionar</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Clique no quadrado à esquerda para enviar a imagem da categoria. A complexidade define o prazo de produção: simples +1 dia a cada 3000 un; complexa +3 dias a cada 3000 un. Sempre +1 dia útil de postagem.
        </p>
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
  const [complexity, setComplexity] = useState<"simple" | "complex">((cat as Cat & { complexity?: "simple" | "complex" }).complexity ?? "simple");
  const [image, setImage] = useState<string>(cat.image ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty =
    name !== cat.name ||
    slug !== cat.slug ||
    icon !== (cat.icon ?? "") ||
    order !== cat.sort_order ||
    complexity !== ((cat as Cat & { complexity?: "simple" | "complex" }).complexity ?? "simple") ||
    image !== (cat.image ?? "");

  async function handleUpload(file: File) {
    setUploading(true);
    const url = await uploadCategoryImage(file);
    setUploading(false);
    if (url) {
      setImage(url);
      toast.success("Imagem enviada");
    }
  }

  return (
    <div className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-[80px_1fr_1fr_120px_140px_90px_auto_auto]">
      <div className="relative">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-md border bg-muted text-muted-foreground hover:border-brand"
          title="Enviar imagem"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
        </button>
        {image && (
          <button
            type="button"
            onClick={() => setImage("")}
            className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground shadow"
            title="Remover imagem"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
      <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
      <select
        className="h-9 rounded-md border bg-background px-2 text-sm"
        value={complexity}
        onChange={(e) => setComplexity(e.target.value as "simple" | "complex")}
      >
        <option value="simple">Simples</option>
        <option value="complex">Complexa</option>
      </select>
      <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
      <Button
        size="sm"
        disabled={!dirty}
        onClick={() =>
          onSave({
            name,
            slug,
            icon: icon || null,
            sort_order: order,
            complexity,
            image: image || null,
          } as Partial<Cat>)
        }
      >
        <Save className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
