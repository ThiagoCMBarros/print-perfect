import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Truck, Leaf, Users, Sparkles, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre nós — GráficaPro" },
      { name: "description", content: "Conheça a GráficaPro: gráfica online com qualidade premium, prazo rápido e atendimento humano para empresas e criadores." },
      { property: "og:title", content: "Sobre a GráficaPro" },
      { property: "og:description", content: "Mais de uma década imprimindo ideias com qualidade premium e prazos curtos." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-brand/10 via-background to-background">
        <div className="container-page py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">Sobre nós</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Impressão profissional, descomplicada.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A GráficaPro nasceu para resolver um problema simples: imprimir bem, no prazo, sem burocracia.
            Combinamos parque gráfico de alta tecnologia com uma plataforma online direta ao ponto.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold">Nossa missão</h2>
            <p className="mt-3 text-muted-foreground">
              Tornar a impressão profissional acessível para qualquer pessoa ou negócio — do empreendedor
              individual à grande empresa. Sem mínimos absurdos, sem cotação por e-mail, sem surpresas.
            </p>
            <p className="mt-3 text-muted-foreground">
              Tudo o que oferecemos é configurável online, com preço claro, prazo realista e
              acompanhamento do pedido em tempo real até a entrega na sua porta.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild><Link to="/produtos">Ver catálogo</Link></Button>
              <Button asChild variant="outline"><Link to="/contato">Falar conosco</Link></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { n: "+10 anos", t: "de mercado" },
              { n: "+50 mil", t: "pedidos entregues" },
              { n: "98%", t: "de satisfação" },
              { n: "24h", t: "produção mínima" },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border bg-card p-5 shadow-soft">
                <p className="font-display text-2xl font-extrabold text-brand">{s.n}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-surface-muted">
        <div className="container-page py-16">
          <h2 className="text-center font-display text-3xl font-bold">No que acreditamos</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { I: Award, t: "Qualidade premium", d: "Equipamentos de última geração e controle de qualidade em cada lote." },
              { I: Truck, t: "Entrega rápida", d: "Produção em até 24h e logística para todo o Brasil." },
              { I: Leaf, t: "Compromisso ambiental", d: "Tintas e papéis com origem certificada, processo otimizado para reduzir desperdício." },
              { I: Users, t: "Atendimento humano", d: "Time real para tirar dúvidas, conferir arte e resolver imprevistos." },
              { I: Sparkles, t: "Tecnologia simples", d: "Configurar, comprar e acompanhar em poucos cliques, no celular ou desktop." },
              { I: ShieldCheck, t: "Garantia total", d: "Se algo sair fora do esperado, refazemos. Sem rodeios." },
            ].map(({ I, t, d }) => (
              <div key={t} className="rounded-2xl border bg-card p-6 shadow-soft">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><I className="h-5 w-5" /></div>
                <h3 className="mt-3 font-display text-lg font-bold">{t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 text-center">
        <h2 className="font-display text-3xl font-bold">Pronto para começar?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Configure seu pedido em minutos ou peça um orçamento personalizado.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild size="lg"><Link to="/produtos">Ver produtos</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/orcamento">Pedir orçamento</Link></Button>
        </div>
      </section>
    </SiteLayout>
  );
}
