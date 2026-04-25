import { Link } from "@tanstack/react-router";
import { Clock, ArrowRight, ImageIcon, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/catalog";
import type { Tables } from "@/integrations/supabase/types";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export type ProductCardData = Pick<
  Tables<"products">,
  "id" | "slug" | "name" | "short_description" | "image" | "base_price" | "production_days" | "bestseller" | "new_release"
>;

export function ProductCard({ product }: { product: ProductCardData }) {
  const { isAdmin } = useIsAdmin();
  return (
    <Link
      to="/produtos/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-elevated"
    >
      <div
        className="relative grid aspect-[4/3] place-items-center overflow-hidden"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        {isAdmin && (
          <Link
            to="/admin/produtos/$id"
            params={{ id: product.id }}
            onClick={(e) => e.stopPropagation()}
            title="Editar produto"
            aria-label="Editar produto"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-border backdrop-blur transition hover:bg-brand hover:text-brand-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        )}
        {product.image && /^(https?:|\/)/.test(product.image) ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-brand/40">
            <ImageIcon className="h-16 w-16" />
            <span className="text-[10px] uppercase tracking-wider">Sem imagem</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.bestseller && (
            <Badge className="bg-brand text-brand-foreground hover:bg-brand">Mais vendido</Badge>
          )}
          {product.new_release && (
            <Badge variant="secondary" className="bg-warning/90 text-warning-foreground">
              Lançamento
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {product.short_description ?? ""}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-brand" />
          A partir de 3 dias úteis + 1 dia de postagem
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">A partir de</p>
            <p className="text-xl font-bold text-foreground">{formatBRL(Number(product.base_price))}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-brand hover:bg-brand-soft hover:text-brand"
            tabIndex={-1}
          >
            Detalhes <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
