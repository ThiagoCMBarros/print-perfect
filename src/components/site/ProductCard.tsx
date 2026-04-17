import { Link } from "@tanstack/react-router";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL, type Product } from "@/data/products";

export function ProductCard({ product }: { product: Product }) {
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
        <span className="text-7xl transition-transform duration-300 group-hover:scale-110">{product.image}</span>
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.bestseller && (
            <Badge className="bg-brand text-brand-foreground hover:bg-brand">Mais vendido</Badge>
          )}
          {product.newRelease && (
            <Badge variant="secondary" className="bg-warning/90 text-warning-foreground">
              Lançamento
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{product.shortDescription}</p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-brand" />
          Pronto em {product.productionDays} {product.productionDays === 1 ? "dia útil" : "dias úteis"}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">A partir de</p>
            <p className="text-xl font-bold text-foreground">{formatBRL(product.basePrice)}</p>
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
