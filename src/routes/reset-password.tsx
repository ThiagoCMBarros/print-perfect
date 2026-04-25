import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — GráficaPro" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // O link de recovery loga o usuário automaticamente via hash; verificamos sessão
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) return toast.error("Mínimo 8 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha redefinida!");
    navigate({ to: "/" });
  };

  return (
    <SiteLayout>
      <section className="container-page grid place-items-center py-16">
        <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-8 shadow-soft">
          <h1 className="font-display text-2xl font-bold">Redefinir senha</h1>
          {!ready && (
            <p className="text-sm text-muted-foreground">
              Abra esta página pelo link enviado por e-mail. Caso já tenha aberto, recarregue.
            </p>
          )}
          <div>
            <Label htmlFor="np">Nova senha</Label>
            <Input id="np" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !ready}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}
