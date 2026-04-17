import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Orçamento personalizado — GráficaPro" },
      { name: "description", content: "Solicite um orçamento sob medida para projetos gráficos especiais." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <section className="container-page py-20 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">Orçamento personalizado</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Esta página será o formulário de orçamento sob medida com upload de arquivo. Disponível na próxima fase, junto com o backend.
        </p>
        <Button asChild className="mt-7"><Link to="/produtos">Ver produtos</Link></Button>
      </section>
    </SiteLayout>
  ),
});
