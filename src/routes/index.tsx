import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Sparkles, Truck, Headphones, ShieldCheck, Upload,
  PenTool, ShoppingBag, Package, Quote, Star,
} from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { categories, products } from "@/data/products";
import heroImg from "@/assets/hero-printing.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GráficaPro — Impressão online rápida e de alta qualidade" },
      {
        name: "description",
        content:
          "Cartões de visita, panfletos, banners, adesivos e mais. Personalize online ou envie sua arte. Entrega para todo o Brasil.",
      },
      { property: "og:title", content: "GráficaPro — Impressão online profissional" },
      {
        property: "og:description",
        content: "Compre impressos personalizados online com agilidade e qualidade premium.",
      },
    ],
  }),
  component: HomePage,
});

const featured = products.filter((p) => p.bestseller || p.newRelease).slice(0, 4);

const advantages = [
  { icon: Sparkles, title: "Qualidade premium", text: "Equipamentos profissionais e papéis selecionados em cada pedido." },
  { icon: Truck, title: "Entrega rápida", text: "Produção em até 48h e envio para todo o Brasil." },
  { icon: ShoppingBag, title: "Compra fácil", text: "Configure, calcule e finalize em poucos minutos." },
  { icon: Headphones, title: "Atendimento especialista", text: "Time dedicado para te ajudar com a melhor solução gráfica." },
];

const steps = [
  { icon: ShoppingBag, title: "Escolha o produto", text: "Navegue pelo catálogo e selecione o impresso ideal." },
  { icon: PenTool, title: "Personalize ou envie", text: "Use o editor online ou faça upload da sua arte pronta." },
  { icon: Upload, title: "Finalize o pedido", text: "Pague com PIX, cartão ou boleto. Tudo seguro." },
  { icon: Package, title: "Receba em casa", text: "Acompanhe a produção e o envio direto pelo painel." },
];

const testimonials = [
  { name: "Ana Carolina", role: "Designer • SP", text: "Qualidade impecável e entrega no prazo. Virou minha gráfica oficial!" },
  { name: "Rodrigo Mendes", role: "Empresário • RJ", text: "Pedi 1.000 cartões e chegaram em 3 dias. Atendimento nota 10." },
  { name: "Marina Silva", role: "Arquiteta • BH", text: "O editor online facilitou demais. Recomendo de olhos fechados." },
];

function HomePage() {
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ backgroundImage: "var(--gradient-hero)" }} />
        <div className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center">
            <Badge className="w-fit rounded-full bg-brand-soft px-3 py-1 text-brand hover:bg-brand-soft">
              ✨ Frete grátis acima de R$ 199
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Impressão profissional<br />
              <span className="text-brand">do jeito que você precisa.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Cartões, banners, adesivos, convites e muito mais — com qualidade gráfica premium,
              prazos rápidos e entrega para todo o Brasil.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-7 shadow-glow">
                <Link to="/produtos">
                  Comprar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7">
                <Link to="/produtos">
                  <PenTool className="mr-2 h-4 w-4" /> Personalizar arte
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Compra 100% segura</span>
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand" /> Envio em até 48h</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-brand/15 blur-3xl" />
            <img
              src={heroImg}
              alt="Materiais gráficos impressos: cartões de visita, flyers e adesivos"
              width={1600}
              height={1024}
              className="rounded-3xl border bg-card object-cover shadow-elevated"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Categorias em destaque</h2>
            <p className="mt-2 text-muted-foreground">Encontre o impresso ideal para o seu negócio</p>
          </div>
          <Button asChild variant="ghost" className="hidden text-brand sm:inline-flex">
            <Link to="/produtos">Ver todas <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => {
            const Icon = (Icons[c.icon as keyof typeof Icons] as Icons.LucideIcon) ?? Icons.Tag;
            return (
              <Link
                key={c.id}
                to="/produtos"
                search={{ category: c.slug }}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-elevated"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium leading-tight">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="bg-surface-muted py-16">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Produtos em destaque</h2>
              <p className="mt-2 text-muted-foreground">Os mais pedidos por nossos clientes</p>
            </div>
            <Button asChild variant="ghost" className="hidden text-brand sm:inline-flex">
              <Link to="/produtos">Ver catálogo completo <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="container-page py-20">
        <div className="text-center">
          <Badge variant="secondary" className="rounded-full">Simples assim</Badge>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Como funciona</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Em 4 passos seu pedido sai do computador e chega impresso no endereço.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border bg-card p-6">
              <span className="absolute -top-3 left-6 rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-brand-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VANTAGENS */}
      <section className="bg-surface-muted py-20">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <div key={a.title} className="flex gap-4 rounded-2xl border bg-card p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground">
                  <a.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="container-page py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Quem usa, recomenda</h2>
          <p className="mt-3 text-muted-foreground">Mais de 25.000 clientes satisfeitos em todo o Brasil.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border bg-card p-7 shadow-soft">
              <Quote className="h-8 w-8 text-brand/20" />
              <blockquote className="mt-3 text-sm leading-relaxed text-foreground">"{t.text}"</blockquote>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft font-semibold text-brand">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                </div>
              </div>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA ORÇAMENTO */}
      <section className="container-page pb-20">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-14 text-center text-brand-foreground sm:px-12"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative font-display text-3xl font-bold sm:text-4xl">
            Precisa de algo sob medida?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-brand-foreground/90">
            Solicite um orçamento personalizado e nossa equipe responde em até 4h úteis.
          </p>
          <div className="relative mt-7">
            <Button asChild size="lg" variant="secondary" className="h-12 rounded-full px-8 text-brand">
              <Link to="/orcamento">
                Pedir orçamento personalizado <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
