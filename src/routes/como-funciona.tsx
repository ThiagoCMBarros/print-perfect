import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, PenTool, Upload, Package } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: ShoppingBag, t: "1. Escolha o produto", d: "Navegue pelo catálogo e selecione o impresso ideal para o seu projeto." },
  { icon: PenTool, t: "2. Personalize ou envie", d: "Use nosso editor online ou faça upload da sua arte pronta em PDF, AI, PSD, JPG ou PNG." },
  { icon: Upload, t: "3. Finalize o pedido", d: "Pague com PIX, cartão de crédito ou boleto. Tudo seguro e em poucos minutos." },
  { icon: Package, t: "4. Receba em casa", d: "Acompanhe a produção e o envio em tempo real direto do seu painel do cliente." },
];

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona — GráficaPro" },
      { name: "description", content: "Veja como é simples comprar impressos personalizados na GráficaPro em 4 passos." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <section className="container-page py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold sm:text-5xl">Como funciona</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Em apenas 4 passos seu pedido sai do computador e chega impresso no endereço.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.t} className="rounded-2xl border bg-card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="rounded-full"><Link to="/produtos">Começar agora</Link></Button>
        </div>
      </section>
    </SiteLayout>
  ),
});
