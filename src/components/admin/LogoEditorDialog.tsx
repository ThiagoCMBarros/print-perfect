import { Button } from "@/components/ui/button";
import { CardEditor } from "@/components/site/card-editor/CardEditor";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  /** "logo_url" ou "favicon_url" */
  target: "logo_url" | "favicon_url";
  /** URL atual (opcional) — será carregada como camada inicial. */
  currentUrl?: string;
  onUploaded: (publicUrl: string) => void;
};

const PRESETS = {
  logo_url: { w: 800, h: 240, label: "Editor de logotipo" },
  favicon_url: { w: 256, h: 256, label: "Editor de favicon" },
};

export function LogoEditorDialog({ target, currentUrl, onUploaded }: Props) {
  const preset = PRESETS[target];

  async function handleSave(blob: Blob) {
    const path = `${target}-${Date.now()}.png`;
    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, blob, { upsert: true, contentType: "image/png" });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
    onUploaded(pub.publicUrl);
    toast.success(`${target === "logo_url" ? "Logotipo" : "Favicon"} atualizado — clique em Salvar tudo`);
  }

  return (
    <CardEditor
      defaultTemplate="custom"
      hideTemplateSelector
      allowResizeCanvas
      customSize={{ w: preset.w, h: preset.h }}
      defaultBackground={{ type: "transparent" }}
      emptyDefault
      enableSave
      saveLabel="Aplicar e enviar"
      dialogTitle={preset.label}
      triggerNode={
        <Button type="button" variant="outline" size="sm">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          {currentUrl ? "Editar no editor" : "Criar com editor"}
        </Button>
      }
      onSave={handleSave}
    />
  );
}
