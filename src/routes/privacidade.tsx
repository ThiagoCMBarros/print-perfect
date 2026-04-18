import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — GráficaPro" },
      { name: "description", content: "Saiba como a GráficaPro coleta, usa e protege seus dados pessoais conforme a LGPD." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <article className="container-page max-w-3xl py-16 prose prose-slate dark:prose-invert">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">Atualizada em 18/04/2026</p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <div>
            <h2 className="font-display text-xl font-bold">1. Dados que coletamos</h2>
            <p className="mt-2">Coletamos nome, e-mail, telefone, endereço de entrega e dados de pagamento necessários para processar pedidos. Também armazenamos arquivos de arte enviados para impressão.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">2. Como usamos seus dados</h2>
            <p className="mt-2">Utilizamos seus dados para processar pedidos, emitir notas fiscais, enviar comunicações sobre o status do pedido e melhorar nossos serviços.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">3. Compartilhamento</h2>
            <p className="mt-2">Não vendemos seus dados. Compartilhamos apenas com transportadoras (para entrega) e processadores de pagamento, conforme necessário para a execução do contrato.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">4. Seus direitos (LGPD)</h2>
            <p className="mt-2">Você pode solicitar a qualquer momento o acesso, correção, exclusão ou portabilidade dos seus dados, escrevendo para contato@graficapro.com.br.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">5. Segurança</h2>
            <p className="mt-2">Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito e em repouso e controle de acesso baseado em função.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">6. Cookies</h2>
            <p className="mt-2">Usamos cookies essenciais para autenticação e funcionamento do site, e cookies analíticos para entender o uso e melhorar a experiência.</p>
          </div>
        </section>
      </article>
    </SiteLayout>
  ),
});
