import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Shield, ShieldOff, Search, Mail, Phone, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/catalog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClients,
});

type Row = {
  user_id: string;
  email: string;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  orders_count: number;
  total_spent: number;
};

function AdminClients() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    // @ts-expect-error RPC ainda não está nos types regen
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleAdmin(r: Row) {
    const ok = confirm(`${r.is_admin ? "Remover admin de" : "Promover a admin"} ${r.email}?`);
    if (!ok) return;
    // @ts-expect-error RPC ainda não está nos types
    const { error } = await supabase.rpc("set_user_admin", { _user_id: r.user_id, _make_admin: !r.is_admin });
    if (error) return toast.error(error.message);
    toast.success("Atualizado.");
    load();
  }

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return r.email?.toLowerCase().includes(s) || r.full_name?.toLowerCase().includes(s);
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Clientes</h2>
          <p className="text-sm text-muted-foreground">{rows.length} usuários cadastrados</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 w-64 pl-9" placeholder="Buscar por nome ou email..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Contato</th>
                <th className="p-3">Cadastro</th>
                <th className="p-3 text-right">Pedidos</th>
                <th className="p-3 text-right">Total gasto</th>
                <th className="p-3">Permissão</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.user_id} className="border-b last:border-0 hover:bg-accent/30">
                  <td className="p-3">
                    <p className="font-semibold">{r.full_name ?? "—"}</p>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {r.email}</p>
                    {r.phone && <p className="mt-0.5 flex items-center gap-1.5"><Phone className="h-3 w-3" /> {r.phone}</p>}
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 text-right font-semibold">
                    <span className="inline-flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />{r.orders_count}</span>
                  </td>
                  <td className="p-3 text-right font-semibold">{formatBRL(Number(r.total_spent))}</td>
                  <td className="p-3">
                    {r.is_admin ? <Badge>Admin</Badge> : <Badge variant="outline">Cliente</Badge>}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant={r.is_admin ? "outline" : "default"} onClick={() => toggleAdmin(r)}>
                      {r.is_admin ? <><ShieldOff className="mr-1.5 h-3.5 w-3.5" /> Remover admin</> : <><Shield className="mr-1.5 h-3.5 w-3.5" /> Promover</>}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
