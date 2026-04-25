import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL } from "@/lib/catalog";
import { ArtworkPreview } from "@/components/site/ArtworkPreview";
import { SLUG_TO_TEMPLATE } from "@/components/site/card-editor/types";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — GráficaPro" }] }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { items, subtotal, remove, updateQty, loading } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <SiteLayout>
        <section className="container-page py-20 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Faça login para ver seu carrinho</h1>
          <p className="mt-2 text-sm text-muted-foreground">Seu carrinho fica salvo na sua conta.</p>
          <Button asChild className="mt-6">
            <Link to="/login" search={{ redirect: "/carrinho" }}>Entrar</Link>
          </Button>
        </section>
      </SiteLayout>
    );
  }

  if (loading) {
    return <SiteLayout><div className="container-page py-20 text-center text-muted-foreground">Carregando...</div></SiteLayout>;
  }

  if (items.length === 0) {
    return (
      <SiteLayout>
        <section className="container-page py-20 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Seu carrinho está vazio</h1>
          <Button asChild className="mt-6"><Link to="/produtos">Ver produtos</Link></Button>
        </section>
      </SiteLayout>
    );
  }

  // Frete só é calculado no checkout, após o cliente informar o CEP.
  const total = subtotal;

  return (
    <SiteLayout>
      <section className="container-page py-10">
        <h1 className="font-display text-3xl font-bold">Carrinho</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map((it) => {
              const slug = it.products?.slug ?? "";
              const fmt = SLUG_TO_TEMPLATE[slug]
                ?? (slug.includes("cartao") ? "card"
                  : slug.includes("flyer") || slug.includes("panfleto") ? "flyer"
                  : slug.includes("banner") ? "banner"
                  : slug.includes("adesivo") ? "sticker"
                  : "card");
              return (
                <div key={it.id} className="flex gap-4 rounded-2xl border bg-card p-4">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl text-4xl" style={{ backgroundImage: "var(--gradient-hero)" }}>
                    {it.products?.image && /^(https?:|\/)/.test(it.products.image) ? (
                      <img src={it.products.image} alt={it.products?.name ?? "Produto"} className="h-full w-full object-cover" />
                    ) : (
                      <span>{it.products?.image ?? "📦"}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{it.products?.name ?? "Produto"}</p>
                    <p className="text-xs text-muted-foreground">
                      Urgência: {it.urgency === "express" ? "Express" : "Padrão"} · {formatBRL(Number(it.unit_price))} / un
                    </p>
                    {(it.artwork_path || it.artwork_back_path) && (
                      <div className="mt-3">
                        <ArtworkPreview
                          bucket="cart-artworks"
                          frontPath={it.artwork_path}
                          backPath={it.artwork_back_path}
                          format={fmt}
                          printSide={it.artwork_back_path ? "front-back" : "front"}
                          size="sm"
                        />
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(it.id, it.qty - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{it.qty}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(it.id, it.qty + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <button onClick={() => remove(it.id)} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatBRL(Number(it.total_price))}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold">Resumo</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{shipping === 0 ? "Grátis" : formatBRL(shipping)}</span></div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">Faltam {formatBRL(250 - subtotal)} para frete grátis.</p>
              )}
              <p className="pt-1 text-xs text-muted-foreground">
                Prazo final será calculado no checkout (depende do CEP).
              </p>
            </div>
            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
              <span>Total</span><span className="text-brand">{formatBRL(total)}</span>
            </div>
            <Button size="lg" className="mt-6 h-12 w-full rounded-xl shadow-glow" onClick={() => navigate({ to: "/checkout" })}>
              Finalizar pedido <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
