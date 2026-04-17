import { useState } from "react";
import { Upload, FileCheck2, Clock, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Item = Tables<"order_items">;

const STATUS: Record<Enums<"artwork_status">, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  none: { label: "Sem arte", variant: "outline", icon: Upload },
  pending: { label: "Em análise", variant: "secondary", icon: Clock },
  approved: { label: "Aprovada", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Reprovada", variant: "destructive", icon: XCircle },
};

const MAX = 25 * 1024 * 1024; // 25MB
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.ai,.psd";

export function ArtworkUpload({ orderId, item, onChange, isAdmin = false }: {
  orderId: string;
  item: Item;
  onChange: () => void;
  isAdmin?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(item.artwork_note ?? "");
  const cfg = STATUS[item.artwork_status];
  const Icon = cfg.icon;

  async function handleUpload(file: File) {
    if (file.size > MAX) return toast.error("Arquivo maior que 25MB.");
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${orderId}/${item.id}-${Date.now()}.${ext}`;

    // Remove anterior, se houver
    if (item.artwork_path) {
      await supabase.storage.from("order-artworks").remove([item.artwork_path]);
    }

    const { error: upErr } = await supabase.storage.from("order-artworks").upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (upErr) { setBusy(false); return toast.error(upErr.message); }

    const { error: dbErr } = await supabase.from("order_items").update({
      artwork_path: path,
      artwork_filename: file.name,
      artwork_status: "pending",
      artwork_uploaded_at: new Date().toISOString(),
      artwork_note: null,
    }).eq("id", item.id);
    setBusy(false);
    if (dbErr) return toast.error(dbErr.message);
    toast.success("Arte enviada! Aguarde aprovação.");
    onChange();
  }

  async function downloadArt() {
    if (!item.artwork_path) return;
    const { data, error } = await supabase.storage.from("order-artworks").createSignedUrl(item.artwork_path, 60);
    if (error || !data) return toast.error(error?.message ?? "Erro");
    window.open(data.signedUrl, "_blank");
  }

  async function review(status: "approved" | "rejected") {
    setBusy(true);
    const { error } = await supabase.from("order_items").update({
      artwork_status: status,
      artwork_note: note || null,
      artwork_reviewed_at: new Date().toISOString(),
    }).eq("id", item.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Arte aprovada." : "Arte reprovada.");
    onChange();
  }

  return (
    <div className="mt-3 rounded-xl border bg-surface-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={cfg.variant} className="gap-1.5">
          <Icon className="h-3 w-3" /> {cfg.label}
        </Badge>
        {item.artwork_path && (
          <Button size="sm" variant="ghost" onClick={downloadArt}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar arte
          </Button>
        )}
      </div>

      {item.artwork_filename && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileCheck2 className="h-3.5 w-3.5 text-success" /> {item.artwork_filename}
        </p>
      )}

      {item.artwork_note && item.artwork_status === "rejected" && (
        <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          <strong>Motivo:</strong> {item.artwork_note}
        </p>
      )}

      {/* Cliente: enviar / re-enviar */}
      {!isAdmin && item.artwork_status !== "approved" && (
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-background p-4 text-sm text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {item.artwork_path ? "Reenviar arte" : "Enviar arte (PDF, JPG, PNG, AI, PSD · até 25MB)"}
          <input
            type="file" className="hidden" accept={ACCEPT} disabled={busy}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </label>
      )}

      {/* Admin: aprovar / reprovar */}
      {isAdmin && item.artwork_status === "pending" && (
        <div className="mt-3 space-y-2">
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2}
            placeholder="Nota (opcional p/ aprovação, obrigatória p/ reprovação)"
            className="w-full rounded-md border bg-background p-2 text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" disabled={busy} onClick={() => review("approved")}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Aprovar
            </Button>
            <Button size="sm" variant="destructive" className="flex-1" disabled={busy || !note} onClick={() => review("rejected")}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reprovar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
