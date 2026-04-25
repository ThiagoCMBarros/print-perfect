import { useRef, useState } from "react";
import { Upload, Loader2, X, FileCheck2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardEditor } from "@/components/site/card-editor/CardEditor";
import { SLUG_TO_TEMPLATE, type TemplateKey } from "@/components/site/card-editor/types";

const MAX = 25 * 1024 * 1024; // 25MB
const ACCEPT = ".pdf,.jpg,.jpeg,.png";

export type ArtworkValue = {
  path: string | null;
  filename: string | null;
};

type Props = {
  userId: string;
  produtoId: string;
  /** Slug da categoria do produto, usado para sugerir template do editor. */
  categorySlug?: string | null;
  /** Largura do produto em mm — usado para template "custom". */
  larguraMm?: number;
  /** Altura do produto em mm — usado para template "custom". */
  alturaMm?: number;
  value: ArtworkValue;
  onChange: (v: ArtworkValue) => void;
  /** Rótulo legenda (ex: "Frente" / "Verso"). */
  label?: string;
};

export function ArtworkPicker({ userId, produtoId, categorySlug, larguraMm, alturaMm, value, onChange, label }: Props) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Resolve template para o editor
  const slugKey = (categorySlug ?? "").toLowerCase();
  const template: TemplateKey = SLUG_TO_TEMPLATE[slugKey] ?? "custom";
  // mm → px (300dpi ≈ 11.81 px/mm); cap para evitar canvas gigante
  const dpi = 11.81;
  const customSize =
    template === "custom" && larguraMm && alturaMm
      ? { w: Math.min(4000, Math.round(larguraMm * dpi)), h: Math.min(4000, Math.round(alturaMm * dpi)) }
      : undefined;

  async function uploadBlob(blob: Blob, ext: string, displayName: string) {
    if (blob.size > MAX) {
      toast.error("Arquivo maior que 25MB.");
      return;
    }
    setBusy(true);
    try {
      // Remove anterior, se houver
      if (value.path) {
        await supabase.storage.from("cart-artworks").remove([value.path]);
      }
      const path = `${userId}/${produtoId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cart-artworks").upload(path, blob, {
        cacheControl: "3600",
        upsert: false,
        contentType: blob.type || (ext === "pdf" ? "application/pdf" : `image/${ext}`),
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      onChange({ path, filename: displayName });
      toast.success("Arte salva");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File) {
    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
    await uploadBlob(file, ext, file.name);
  }

  async function handleEditorSave(blob: Blob) {
    await uploadBlob(blob, "png", `arte-${Date.now()}.png`);
  }

  async function handleRemove() {
    if (!value.path) return;
    setBusy(true);
    await supabase.storage.from("cart-artworks").remove([value.path]);
    onChange({ path: null, filename: null });
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {value.path ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <FileCheck2 className="h-5 w-5 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.filename ?? "Arte enviada"}</p>
            <p className="text-xs text-muted-foreground">Pronto para envio à produção</p>
          </div>
          <Button size="sm" variant="ghost" onClick={handleRemove} disabled={busy}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Enviar arquivo
          </Button>
          <CardEditor
            triggerNode={
              <Button type="button" variant="default" disabled={busy}>
                <PenTool className="mr-2 h-4 w-4" />
                Personalizar online
              </Button>
            }
            dialogTitle="Personalize sua arte"
            defaultTemplate={template}
            categorySlug={categorySlug ?? undefined}
            customSize={customSize}
            allowResizeCanvas={template === "custom" && !customSize}
            enableSave
            saveLabel="Salvar e usar esta arte"
            onSave={handleEditorSave}
            lockTemplate
            hideTemplateSelector
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Aceitamos PDF, JPG, PNG (até 25MB). Você também pode personalizar a arte direto no navegador.
      </p>
    </div>
  );
}
