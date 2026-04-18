import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Package, Tags, Settings2, ShoppingBag, Shield, ArrowLeft, BarChart3, Users, Plug } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { verifyAdmin } from "@/utils/admin.functions";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
    // Validação server-side: previne bypass via DevTools (BUG-010).
    try {
      const { isAdmin } = await verifyAdmin();
      if (!isAdmin) throw redirect({ to: "/" });
    } catch (err) {
      if ((err as { isRedirect?: boolean })?.isRedirect) throw err;
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

const tabs = [
  { to: "/admin/dashboard", label: "Dashboard", icon: BarChart3, exact: false },
  { to: "/admin", label: "Produtos", icon: Package, exact: true },
  { to: "/admin/categorias", label: "Categorias", icon: Tags, exact: false },
  { to: "/admin/opcoes", label: "Opções", icon: Settings2, exact: false },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, exact: false },
  { to: "/admin/clientes", label: "Clientes", icon: Users, exact: false },
  { to: "/admin/integracoes", label: "Integrações", icon: Plug, exact: false },
] as const;

function AdminLayout() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setAllowed(false); setChecking(false); }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) {
        setAllowed(!!data);
        setChecking(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  if (checking) {
    return (
      <SiteLayout>
        <div className="container-page flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </SiteLayout>
    );
  }

  if (!allowed) {
    return (
      <SiteLayout>
        <div className="container-page py-24 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-muted-foreground">Você não tem permissão para acessar o painel administrativo.</p>
          <Button asChild className="mt-6"><Link to="/">Voltar para o site</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="border-b bg-surface-muted">
        <div className="container-page py-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" />
            <h1 className="font-display text-2xl font-bold">Painel administrativo</h1>
          </div>
        </div>
      </section>

      <section className="container-page py-6">
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl border bg-card p-1">
          {tabs.map((t) => {
            const active = t.exact
              ? location.pathname === t.to
              : location.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-brand text-brand-foreground shadow-soft" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </section>
    </SiteLayout>
  );
}
