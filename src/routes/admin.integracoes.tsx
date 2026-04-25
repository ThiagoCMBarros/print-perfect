import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/integracoes")({
  component: AdminIntegrations,
});

type Setting = {
  id: string;
  category: string;
  key: string;
  value: unknown;
  description: string | null;
};

function AdminIntegrations() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Setting[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("integration_settings")
        .select("id,category,key,value,description")
        .not("category", "in", "(branding,company,contact,social,seo)")
        .order("category")
        .order("key");
      if (error) {
        toast.error("Erro ao carregar configurações");
      } else {
        setRows(data ?? []);
        const d: Record<string, string> = {};
        for (const r of data ?? []) {
          d[r.id] = typeof r.value === "string" ? r.value : JSON.stringify(r.value, null, 2);
        }
        setDraft(d);
      }
      setLoading(false);
    })();
  }, []);

  async function save(row: Setting) {
    setSaving(true);
    let parsed: unknown = draft[row.id];
    // Se o valor original era string simples, mantemos string. Caso contrário, tenta JSON.
    if (typeof row.value !== "string") {
      try { parsed = JSON.parse(draft[row.id]); }
      catch { toast.error(`JSON inválido em ${row.category}.${row.key}`); setSaving(false); return; }
    }
    const { error } = await supabase
      .from("integration_settings")
      .update({ value: parsed as never })
      .eq("id", row.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(`${row.category}.${row.key} salvo`);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  }

  const groups = rows.reduce<Record<string, Setting[]>>((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Alert>
        <KeyRound className="h-4 w-4" />
        <AlertTitle>Credenciais sensíveis ficam no cofre</AlertTitle>
        <AlertDescription>
          Esta página guarda apenas configurações públicas (public keys, modos sandbox/live, números, e-mails, feature flags).
          Tokens de acesso, webhook secrets e service keys ficam armazenados em variáveis de ambiente seguras do servidor — nunca no banco.
        </AlertDescription>
      </Alert>

      {Object.entries(groups).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category}</CardTitle>
            <CardDescription>Configurações da integração {category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((row) => {
              const isLong = typeof row.value !== "string" && draft[row.id]?.length > 60;
              return (
                <div key={row.id} className="space-y-2">
                  <Label htmlFor={row.id} className="font-mono text-xs">
                    {row.category}.{row.key}
                  </Label>
                  {row.description && (
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  )}
                  <div className="flex gap-2">
                    {isLong ? (
                      <Textarea
                        id={row.id}
                        value={draft[row.id] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [row.id]: e.target.value }))}
                        rows={3}
                        className="font-mono text-xs"
                      />
                    ) : (
                      <Input
                        id={row.id}
                        value={draft[row.id] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [row.id]: e.target.value }))}
                        className="font-mono text-xs"
                      />
                    )}
                    <Button onClick={() => save(row)} disabled={saving} size="sm">
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
