import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — GráficaPro" },
      { name: "description", content: "Conheça os termos e condições de uso dos serviços da GráficaPro." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <article className="container-page max-w-3xl py-16">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">Atualizada em {new Date().toLocaleDateString("pt-BR")}</p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <div>
            <h2 className="font-display text-xl font-bold">1. Aceitação</h2>
            <p className="mt-2">Ao usar a GráficaPro você concorda com estes termos. Se discordar de qualquer cláusula, não utilize o serviço.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">2. Pedidos e prazos</h2>
            <p className="mt-2">Os prazos de produção informados começam a contar após a aprovação da arte. Pedidos com arte reprovada terão o prazo recalculado a partir da nova aprovação.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">3. Aprovação de arte</h2>
            <p className="mt-2">É responsabilidade do cliente conferir ortografia, cores e medidas antes de aprovar a arte. Após aprovação, o pedido entra em produção e não pode ser alterado.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">4. Pagamento</h2>
            <p className="mt-2">Aceitamos PIX, cartão de crédito e boleto. A produção só inicia após confirmação do pagamento.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">5. Frete e entrega</h2>
            <p className="mt-2">Frete fixo de R$ 29,90 para todo o Brasil, gratuito acima de R$ 250,00. Atrasos por parte da transportadora são de responsabilidade desta.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">6. Cancelamento e reembolso</h2>
            <p className="mt-2">Pedidos podem ser cancelados sem custo enquanto não entrarem em produção. Após produção iniciada, não há possibilidade de reembolso, salvo defeito comprovado de fabricação.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">7. Propriedade intelectual</h2>
            <p className="mt-2">O cliente declara possuir todos os direitos sobre as artes enviadas. A GráficaPro não se responsabiliza por violação de direitos de terceiros.</p>
          </div>
        </section>
      </article>
    </SiteLayout>
  ),
});
