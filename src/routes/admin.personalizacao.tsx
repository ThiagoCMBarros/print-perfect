import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Upload, Palette, Building2, Phone, Share2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export const Route = createFileRoute("/admin/personalizacao")({
  component: AdminPersonalizacao,
});

type Row = { id: string; category: string; key: string; value: unknown };

const SECTIONS: { category: string; title: string; description: string; icon: React.ElementType; fields: { key: string; label: string; type?: "text" | "textarea" | "color" | "image" }[] }[] = [
  {
    category: "branding",
    title: "Identidade visual",
    description: "Logo, favicon, nome do site e cores da marca",
    icon: Palette,
    fields: [
      { key: "site_name", label: "Nome do site" },
      { key: "tagline", label: "Slogan" },
      { key: "logo_url", label: "Logotipo", type: "image" as const },
      { key: "favicon_url", label: "Favicon", type: "image" as const },
      { key: "primary_color", label: "Cor primária", type: "color" },
      { key: "primary_foreground", label: "Cor do texto sobre a primária", type: "color" },
    ],
  },
  {
    category: "company",
    title: "Dados da empresa",
    description: "Razão social, CNPJ e endereço",
    icon: Building2,
    fields: [
      { key: "legal_name", label: "Razão social" },
      { key: "cnpj", label: "CNPJ" },
      { key: "ie", label: "Inscrição estadual" },
      { key: "address", label: "Endereço completo", type: "textarea" },
    ],
  },
  {
    category: "contact",
    title: "Contato",
    description: "Telefone, WhatsApp, e-mail e horário",
    icon: Phone,
    fields: [
      { key: "phone", label: "Telefone fixo" },
      { key: "whatsapp", label: "WhatsApp (com DDI, somente números — ex: 5511999999999)" },
      { key: "whatsapp_message", label: "Mensagem padrão do WhatsApp", type: "textarea" },
      { key: "email", label: "E-mail de contato" },
      { key: "business_hours", label: "Horário de atendimento" },
    ],
  },
  {
    category: "social",
    title: "Redes sociais",
    description: "Links exibidos no rodapé",
    icon: Share2,
    fields: [
      { key: "instagram", label: "Instagram (URL)" },
      { key: "facebook", label: "Facebook (URL)" },
      { key: "linkedin", label: "LinkedIn (URL)" },
    ],
  },
  {
    category: "seo",
    title: "SEO",
    description: "Title e description padrão do site",
    icon: Search,
    fields: [
      { key: "meta_title", label: "Meta title" },
      { key: "meta_description", label: "Meta description", type: "textarea" },
    ],
  },
];

function AdminPersonalizacao() {
  const { refresh } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const cats = SECTIONS.map((s) => s.category);
      const { data, error } = await supabase
        .from("integration_settings")
        .select("id,category,key,value")
        .in("category", cats);
      if (error) toast.error("Erro ao carregar configurações");
      else {
        setRows(data ?? []);
        const d: Record<string, string> = {};
        for (const r of data ?? []) {
          const k = `${r.category}.${r.key}`;
          d[k] = typeof r.value === "string" ? r.value : JSON.stringify(r.value);
        }
        setDraft(d);
      }
      setLoading(false);
    })();
  }, []);

  function setVal(category: string, key: string, val: string) {
    setDraft((d) => ({ ...d, [`${category}.${key}`]: val }));
  }

  async function saveAll() {
    setSaving(true);
    try {
      for (const r of rows) {
        const k = `${r.category}.${r.key}`;
        const newVal = draft[k] ?? "";
        const oldVal = typeof r.value === "string" ? r.value : JSON.stringify(r.value);
        if (newVal !== oldVal) {
          const { error } = await supabase
            .from("integration_settings")
            .update({ value: newVal as never })
            .eq("id", r.id);
          if (error) throw error;
        }
      }
      toast.success("Personalização salva");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAsset(file: File, target: "logo_url" | "favicon_url") {
    setUploading(target);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${target}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      setVal("branding", target, pub.publicUrl);
      toast.success(`${target === "logo_url" ? "Logo" : "Favicon"} carregado — clique em Salvar`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Personalização da plataforma</h2>
          <p className="text-sm text-muted-foreground">Altere logotipo, dados da empresa, contato e SEO. As mudanças aparecem em todo o site.</p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar tudo
        </Button>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.category}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <section.icon className="h-5 w-5 text-brand" />
              <div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {section.fields.map((f) => {
              const k = `${section.category}.${f.key}`;
              const isLogo = section.category === "branding" && f.key === "logo_url";
              const isFavicon = section.category === "branding" && f.key === "favicon_url";
              return (
                <div key={k} className={f.type === "textarea" || f.type === "image" ? "md:col-span-2 space-y-2" : "space-y-2"}>
                  <Label htmlFor={k}>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea id={k} value={draft[k] ?? ""} onChange={(e) => setVal(section.category, f.key, e.target.value)} rows={2} />
                  ) : f.type === "color" ? (
                    <div className="flex gap-2">
                      <Input type="color" value={draft[k] || "#2563eb"} onChange={(e) => setVal(section.category, f.key, e.target.value)} className="h-10 w-16 p-1" />
                      <Input value={draft[k] ?? ""} onChange={(e) => setVal(section.category, f.key, e.target.value)} className="font-mono" />
                    </div>
                  ) : f.type === "image" ? (
                    <div className="flex items-center gap-4">
                      {draft[k] ? (
                        <img src={draft[k]} alt={f.label} className="h-16 w-16 rounded border bg-white object-contain p-1" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
                          sem imagem
                        </div>
                      )}
                      <input
                        ref={isLogo ? logoInputRef : faviconInputRef}
                        type="file"
                        accept={isFavicon ? "image/png,image/x-icon,image/svg+xml" : "image/*"}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadAsset(file, isLogo ? "logo_url" : "favicon_url");
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => (isLogo ? logoInputRef : faviconInputRef).current?.click()}
                        disabled={uploading === (isLogo ? "logo_url" : "favicon_url")}
                      >
                        {uploading === (isLogo ? "logo_url" : "favicon_url") ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
                        ) : (
                          <><Upload className="mr-2 h-4 w-4" /> {draft[k] ? "Trocar imagem" : "Enviar imagem"}</>
                        )}
                      </Button>
                      {draft[k] && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setVal("branding", isLogo ? "logo_url" : "favicon_url", "")}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Input id={k} value={draft[k] ?? ""} onChange={(e) => setVal(section.category, f.key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar tudo
        </Button>
      </div>
    </div>
  );
}
