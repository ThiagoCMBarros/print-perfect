import { useEffect, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { TemplateKey } from "./card-editor/types";
import { TEMPLATES } from "./card-editor/types";

type Props = {
  bucket: "cart-artworks" | "order-artworks";
  frontPath?: string | null;
  backPath?: string | null;
  format?: TemplateKey;
  printSide?: "front" | "front-back";
  size?: "sm" | "md" | "lg";
};

const SIZES = { sm: 110, md: 200, lg: 320 };

export function ArtworkPreview({
  bucket, frontPath, backPath, format = "card", printSide = "front", size = "md",
}: Props) {
  const t = TEMPLATES[format];
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cardW = SIZES[size];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const tasks: Promise<void>[] = [];
      if (frontPath) {
        tasks.push(
          supabase.storage.from(bucket).createSignedUrl(frontPath, 60 * 30).then(({ data }) => {
            if (!cancelled) setFrontUrl(data?.signedUrl ?? null);
          }),
        );
      } else {
        setFrontUrl(null);
      }
      if (backPath) {
        tasks.push(
          supabase.storage.from(bucket).createSignedUrl(backPath, 60 * 30).then(({ data }) => {
            if (!cancelled) setBackUrl(data?.signedUrl ?? null);
          }),
        );
      } else {
        setBackUrl(null);
      }
      await Promise.all(tasks);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [frontPath, backPath, bucket]);

  if (!frontPath && !backPath) return null;

  const isImage = (url: string | null) => {
    if (!url) return false;
    const lower = url.split("?")[0].toLowerCase();
    return /\.(png|jpe?g|webp|gif|svg)$/.test(lower);
  };

  const Card = ({ url, label, blank }: { url: string | null; label: string; blank?: boolean }) => (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative overflow-hidden rounded-lg border bg-white shadow-soft"
        style={{ width: cardW, aspectRatio: `${t.w} / ${t.h}` }}
      >
        {loading && !url && (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {!loading && blank && (
          <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">
            (em branco)
          </div>
        )}
        {url && isImage(url) && (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        )}
        {url && !isImage(url) && (
          <div className="grid h-full w-full place-items-center gap-1 p-2 text-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Arquivo enviado</span>
          </div>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Card url={frontUrl} label="Frente" />
      {printSide === "front-back" && <Card url={backUrl} label="Verso" blank={!backPath} />}
      {printSide === "front" && <Card url={null} label="Verso" blank />}
    </div>
  );
}
