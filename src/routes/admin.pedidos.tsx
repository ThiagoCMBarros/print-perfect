import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/catalog";
import { toast } from "sonner";
import type { Tables, Enums } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
});

type Order = Tables<"orders">;
const STATUSES: Enums<"order_status">[] = [
  "aguardando_pagamento", "pago", "em_analise", "arte_pendente", "arte_aprovada",
  "em_producao", "finalizado", "enviado", "entregue", "cancelado",
];
const STATUS_LABEL: Record<Enums<"order_status">, string> = {
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
const STATUS_VARIANT: Record<Enums<"order_status">, "default" | "secondary" | "outline" | "destructive"> = {
  aguardando_pagamento: "outline",
  pago: "secondary",
  em_analise: "secondary",
  arte_pendente: "outline",
  arte_aprovada: "secondary",
  em_producao: "default",
  finalizado: "default",
  enviado: "default",
  entregue: "default",
  cancelado: "destructive",
};

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Enums<"order_status"> | "all">("all");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setOrders(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [filter]);

  async function updateStatus(o: Order, status: Enums<"order_status">) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status } : x));
  }

  const filtered = orders.filter((o) =>
    !q ? true : o.order_number.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Pedidos</h2>
          <p className="text-sm text-muted-foreground">{orders.length} pedidos</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar nº..." value={q} onChange={(e) => setQ(e.target.value)}
            className="h-10 w-44"
          />
          <Select value={filter} onValueChange={(v) => setFilter(v as never)}>
            <SelectTrigger className="h-10 w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Nº pedido</th>
                <th className="p-3">Data</th>
                <th className="p-3">Pagamento</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Atualizar</th>
                <th className="p-3 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-accent/30">
                  <td className="p-3 font-mono text-xs font-semibold">{o.order_number}</td>
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3 capitalize text-muted-foreground">{o.payment_method}</td>
                  <td className="p-3 font-semibold">{formatBRL(Number(o.total))}</td>
                  <td className="p-3"><Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
                  <td className="p-3">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o, v as Enums<"order_status">)}>
                      <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/pedido/$id" params={{ id: o.id }}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
