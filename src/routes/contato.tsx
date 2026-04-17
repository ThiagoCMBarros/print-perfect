import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — GráficaPro" },
      { name: "description", content: "Fale com a equipe da GráficaPro. Atendimento de segunda a sexta, das 9h às 18h." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <section className="container-page py-16">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Fale com a gente</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Estamos prontos para tirar dúvidas, fazer orçamentos e ajudar com o seu projeto.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: Phone, t: "Telefone", d: "(11) 4000-0000" },
            { icon: Mail, t: "E-mail", d: "contato@graficapro.com.br" },
            { icon: MapPin, t: "Endereço", d: "Rua das Gráficas, 100 — São Paulo/SP" },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  ),
});
