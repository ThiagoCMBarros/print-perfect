import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { User, Package, MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/conta")({
  head: () => ({ meta: [{ title: "Minha conta — GráficaPro" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/conta" } });
  }, [loading, user, navigate]);

  if (!user) return null;

  return (
    <SiteLayout>
      <section className="container-page grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border bg-card p-3">
          {[
            { to: "/conta", icon: User, label: "Perfil" },
            { to: "/conta/pedidos", icon: Package, label: "Pedidos" },
            { to: "/conta/enderecos", icon: MapPin, label: "Endereços" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-brand bg-brand-soft" }}
              activeOptions={{ exact: l.to === "/conta" }}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
        </aside>
        <Outlet />
      </section>
    </SiteLayout>
  );
}
