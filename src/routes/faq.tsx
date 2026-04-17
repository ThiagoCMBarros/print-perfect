import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — GráficaPro" },
      { name: "description", content: "Tire dúvidas sobre prazos, formatos de arte, pagamento, frete, devoluções e personalização na GráficaPro." },
      { property: "og:title", content: "FAQ — GráficaPro" },
      { property: "og:description", content: "Tudo que você precisa saber antes de pedir seus impressos." },
    ],
  }),
  component: FaqPage,
});

const FAQ = [
  {
    cat: "Pedidos & prazos",
    items: [
      { q: "Em quanto tempo recebo meu pedido?", a: "O prazo é a soma do tempo de produção (mostrado em cada produto, geralmente 1 a 5 dias úteis) com o frete. Após o pagamento aprovado e a arte conferida, iniciamos a produção." },
      { q: "Posso pedir em quantidade pequena?", a: "Sim. Trabalhamos com quantidades a partir de 50 unidades em cartões e flyers, sem mínimo absurdo." },
      { q: "Tem produção expressa?", a: "Sim. Em vários produtos é possível selecionar a opção 'Expressa' no momento da configuração, com prazo reduzido e taxa adicional." },
    ],
  },
  {
    cat: "Arquivos & arte",
    items: [
      { q: "Quais formatos de arquivo vocês aceitam?", a: "PDF, JPG, PNG, AI e PSD em até 25 MB. Arquivos vetoriais em PDF/AI são preferíveis para garantir a melhor qualidade de impressão." },
      { q: "Vocês fazem a arte para mim?", a: "Sim. Para cartões de visita, flyers e adesivos, oferecemos um editor online simples. Para projetos personalizados, peça um orçamento e nosso time desenha sua arte." },
      { q: "Conferem o arquivo antes de imprimir?", a: "Sim. Toda arte enviada passa por uma revisão básica (sangria, resolução, cores). Se houver algo crítico, avisamos antes de imprimir." },
    ],
  },
  {
    cat: "Pagamento & frete",
    items: [
      { q: "Quais formas de pagamento?", a: "PIX (com 5% off), cartão de crédito em até 10x e boleto bancário." },
      { q: "Quanto custa o frete?", a: "R$ 29,90 fixo para todo o Brasil. Em pedidos acima de R$ 250, o frete é grátis." },
      { q: "Posso retirar no local?", a: "Sim, sem custo adicional. Selecione 'Retirar no local' no checkout." },
    ],
  },
  {
    cat: "Garantia & devolução",
    items: [
      { q: "E se chegar com defeito?", a: "Refazemos o pedido sem custo. Basta nos enviar uma foto em até 7 dias da entrega." },
      { q: "Posso cancelar um pedido?", a: "Sim, enquanto o status for 'aguardando pagamento' ou 'em análise'. Após entrar em produção, não é possível cancelar." },
    ],
  },
];

function FaqPage() {
  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-brand/10 via-background to-background">
        <div className="container-page py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">FAQ</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold md:text-5xl">Perguntas frequentes</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Respostas rápidas para as dúvidas mais comuns dos nossos clientes.</p>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mx-auto max-w-3xl space-y-10">
          {FAQ.map((g) => (
            <div key={g.cat}>
              <h2 className="mb-3 font-display text-xl font-bold">{g.cat}</h2>
              <Accordion type="single" collapsible className="rounded-2xl border bg-card px-4">
                {g.items.map((it) => (
                  <AccordionItem key={it.q} value={it.q}>
                    <AccordionTrigger className="text-left">{it.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border bg-surface-muted p-6 text-center shadow-soft">
          <LifeBuoy className="mx-auto h-8 w-8 text-brand" />
          <h3 className="mt-2 font-display text-lg font-bold">Não encontrou sua resposta?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Fale com nosso atendimento — respondemos em até 1 hora útil.</p>
          <Button asChild className="mt-4"><Link to="/contato">Falar conosco</Link></Button>
        </div>
      </section>
    </SiteLayout>
  );
}
