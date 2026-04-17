import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, ShoppingBag, DollarSign, Users, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/catalog";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;

const COLORS = ["hsl(var(--brand))", "hsl(var(--brand) / 0.7)", "hsl(var(--brand) / 0.5)", "hsl(var(--brand) / 0.35)", "hsl(var(--brand) / 0.2)"];

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: it }, { count }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at"),
        supabase.from("order_items").select("*"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      setOrders(o ?? []);
      setItems(it ?? []);
      setUsersCount(count ?? 0);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const validOrders = orders.filter((o) => o.status !== "cancelado");
  const monthOrders = validOrders.filter((o) => new Date(o.created_at) >= monthStart);
  const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket = monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0;

  // Série últimos 30 dias
  const days: { date: string; pedidos: number; faturamento: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const dayOrders = validOrders.filter((o) => {
      const t = new Date(o.created_at);
      return t >= d && t < next;
    });
    days.push({
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      pedidos: dayOrders.length,
      faturamento: dayOrders.reduce((s, o) => s + Number(o.total), 0),
    });
  }

  // Status distribution
  const statusMap = validOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Top produtos
  const productMap = items.reduce<Record<string, { name: string; qty: number; revenue: number }>>((acc, it) => {
    const key = it.product_name;
    if (!acc[key]) acc[key] = { name: key, qty: 0, revenue: 0 };
    acc[key].qty += it.qty;
    acc[key].revenue += Number(it.total_price);
    return acc;
  }, {});
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Visão geral</h2>
        <p className="text-sm text-muted-foreground">Métricas dos últimos 30 dias</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pedidos do mês" value={String(monthOrders.length)} icon={ShoppingBag} />
        <Stat label="Faturamento mês" value={formatBRL(monthRevenue)} icon={DollarSign} />
        <Stat label="Ticket médio" value={formatBRL(avgTicket)} icon={TrendingUp} />
        <Stat label="Clientes" value={String(usersCount)} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Faturamento — últimos 30 dias">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={days}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Line type="monotone" dataKey="faturamento" stroke="hsl(var(--brand))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Pedidos por dia">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="pedidos" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Status dos pedidos">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top 5 produtos por faturamento">
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto vendido ainda.</p>
          ) : (
            <ul className="divide-y">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 py-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft font-bold text-brand">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} unid.</p>
                  </div>
                  <p className="font-bold text-brand">{formatBRL(p.revenue)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-brand" /> {title}</h3>
      {children}
    </div>
  );
}
