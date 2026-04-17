import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar — GráficaPro" }],
  }),
  component: () => (
    <SiteLayout>
      <section className="container-page grid place-items-center py-24">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
            <LogIn className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Área do cliente</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Login, cadastro e área do cliente serão habilitados na próxima fase com Lovable Cloud.
          </p>
          <Button asChild className="mt-6 w-full"><Link to="/produtos">Continuar comprando</Link></Button>
        </div>
      </section>
    </SiteLayout>
  ),
});
