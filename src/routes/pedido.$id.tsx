import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Package, Truck, Clock } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/catalog";
import { ArtworkUpload } from "@/components/site/ArtworkUpload";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import type { Tables } from "@/integrations/supabase/types";

type OrderFull = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
  order_status_history: Tables<"order_status_history">[];
};

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({ meta: [{ title: "Detalhes do pedido — GráficaPro" }] }),
  notFoundComponent: () => (
    <SiteLayout><div className="container-page py-20 text-center">Pedido não encontrado.</div></SiteLayout>
  ),
  component: OrderPage,
});

const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_analise: "Em análise",
  arte_pendente: "Arte pendente",
  arte_aprovada: "Arte aprovada",
  em_producao: "Em produção",
  finalizado: "Finalizado",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function OrderPage() {
  const { id } = Route.useParams();
  const { isAdmin } = useIsAdmin();
  const [order, setOrder] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    supabase
      .from("orders")
      .select("*, order_items(*), order_status_history(*)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data as OrderFull | null);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <SiteLayout><div className="container-page py-20 text-center text-muted-foreground">Carregando...</div></SiteLayout>;
  if (!order) throw notFound();

  const addr = order.shipping_address as Record<string, string>;

  return (
    <SiteLayout>
      <section className="container-page py-10">
        <div className="rounded-2xl border bg-gradient-to-br from-brand-soft to-card p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Pedido confirmado!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedido <span className="font-mono font-semibold text-foreground">{order.order_number}</span>
          </p>
          <Badge className="mt-3 bg-brand text-brand-foreground hover:bg-brand">{STATUS_LABEL[order.status] ?? order.status}</Badge>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-brand" /> Itens</h2>
              <ul className="mt-4 divide-y">
                {order.order_items.map((it) => (
                  <li key={it.id} className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-lg bg-surface-muted text-2xl">{it.product_image ?? "📦"}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{it.product_name}</p>
                        <p className="text-xs text-muted-foreground">{it.qty} un · {formatBRL(Number(it.unit_price))} / un</p>
                      </div>
                      <p className="font-semibold">{formatBRL(Number(it.total_price))}</p>
                    </div>
                    <ArtworkUpload orderId={order.id} item={it} onChange={load} isAdmin={isAdmin} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <h2 className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4 text-brand" /> Endereço de entrega</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {addr.recipient}<br />
                {addr.street}, {addr.number}{addr.complement ? ` — ${addr.complement}` : ""}<br />
                {addr.neighborhood} · {addr.city}/{addr.state} · CEP {addr.zip_code}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <h2 className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-brand" /> Acompanhamento</h2>
              <ol className="mt-4 space-y-3">
                {order.order_status_history
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((h) => (
                    <li key={h.id} className="flex gap-3 text-sm">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                      <div>
                        <p className="font-medium">{STATUS_LABEL[h.status] ?? h.status}</p>
                        <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                    </li>
                  ))}
              </ol>
            </div>
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold">Resumo financeiro</h2>
            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={formatBRL(Number(order.subtotal))} />
              <Row label="Frete" value={Number(order.shipping) === 0 ? "Grátis" : formatBRL(Number(order.shipping))} />
              <Row label="Pagamento" value={order.payment_method.toUpperCase()} />
              {order.estimated_days && <Row label="Prazo" value={`${order.estimated_days} dias úteis`} />}
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total</span><span className="text-brand">{formatBRL(Number(order.total))}</span>
            </div>
            <Button asChild className="w-full"><Link to="/conta/pedidos">Ver meus pedidos</Link></Button>
            <Button asChild variant="outline" className="w-full"><Link to="/produtos">Continuar comprando</Link></Button>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
