import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/catalog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/conta/pedidos")({
  component: OrdersPage,
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

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Tables<"orders">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Meus pedidos</h1>
      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Você ainda não fez nenhum pedido</p>
          <Button asChild className="mt-4"><Link to="/produtos">Ver produtos</Link></Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to="/pedido/$id"
              params={{ id: o.id }}
              className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-brand/40"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
              <p className="font-bold">{formatBRL(Number(o.total))}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
