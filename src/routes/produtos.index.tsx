import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PageLoader } from "@/components/site/PageLoader";
import { type DBCategory } from "@/lib/catalog";
import { getCachedCategories, getCachedProducts } from "@/lib/catalog-cache";
import type { Tables } from "@/integrations/supabase/types";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["bestsellers", "price-asc", "price-desc", "new"]).optional(),
  maxPrice: z.number().optional(),
  maxDays: z.number().optional(),
});

export const Route = createFileRoute("/produtos/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Catálogo de produtos — GráficaPro" },
      { name: "description", content: "Veja todos os produtos gráficos disponíveis: cartões, panfletos, banners, adesivos e mais." },
      { property: "og:title", content: "Catálogo — GráficaPro" },
      { property: "og:description", content: "Todos os impressos da GráficaPro em um só lugar, com filtros por categoria, preço e prazo." },
    ],
  }),
  component: ProductsPage,
});

type ProductRow = Tables<"products"> & {
  categories: Pick<DBCategory, "id" | "slug" | "name"> | null;
};

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getCachedCategories(), getCachedProducts({ categorySlug: search.category, q: search.q })])
      .then(([cats, prods]) => {
        if (cancelled) return;
        setCategories(cats);
        setProducts(prods as ProductRow[]);
      })
      .catch((err) => console.error("[produtos.index] fetch error", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mounted, search.category, search.q]);

  type SearchT = z.infer<typeof searchSchema>;
  const update = (patch: Partial<SearchT>) =>
    navigate({ search: (prev: SearchT) => ({ ...prev, ...patch }) });

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.maxPrice) list = list.filter((p) => Number(p.base_price) <= search.maxPrice!);
    if (search.maxDays) list = list.filter((p) => p.production_days <= search.maxDays!);
    switch (search.sort) {
      case "price-asc": list.sort((a, b) => Number(a.base_price) - Number(b.base_price)); break;
      case "price-desc": list.sort((a, b) => Number(b.base_price) - Number(a.base_price)); break;
      case "new": list.sort((a, b) => Number(!!b.new_release) - Number(!!a.new_release)); break;
      case "bestsellers":
      default: list.sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller));
    }
    return list;
  }, [products, search.maxPrice, search.maxDays, search.sort]);

  const activeCategory = categories.find((c) => c.slug === search.category);
  const hasFilters = !!(search.category || search.q || search.maxPrice || search.maxDays);

  return (
    <SiteLayout>
      <section className="border-b bg-surface-muted">
        <div className="container-page py-10">
          <p className="text-sm text-muted-foreground">Catálogo</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
            {activeCategory ? activeCategory.name : "Todos os produtos"}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {activeCategory?.description ?? "Encontre o impresso perfeito para seu negócio com a qualidade GráficaPro."}
          </p>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontal className="h-4 w-4 text-brand" /> Filtros
                </h3>
                {hasFilters && (
                  <button
                    className="text-xs text-muted-foreground hover:text-brand"
                    onClick={() => navigate({ search: {} })}
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="mt-5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Buscar</label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Nome do produto"
                    value={search.q ?? ""}
                    onChange={(e) => update({ q: e.target.value || undefined })}
                    className="h-10 pl-9"
                  />
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categoria</p>
                <div className="mt-2 flex flex-col">
                  <button
                    onClick={() => update({ category: undefined })}
                    className={`rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                      !search.category ? "bg-brand-soft font-semibold text-brand" : "hover:bg-accent"
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => update({ category: c.slug })}
                      className={`rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        search.category === c.slug ? "bg-brand-soft font-semibold text-brand" : "hover:bg-accent"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preço máximo</p>
                  <span className="text-xs font-semibold">R$ {search.maxPrice ?? 500}</span>
                </div>
                <Slider
                  className="mt-3"
                  value={[search.maxPrice ?? 500]}
                  min={5}
                  max={500}
                  step={5}
                  onValueChange={([v]) => update({ maxPrice: v })}
                />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prazo máx (dias)</p>
                  <span className="text-xs font-semibold">{search.maxDays ?? 7} dias</span>
                </div>
                <Slider
                  className="mt-3"
                  value={[search.maxDays ?? 7]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={([v]) => update({ maxDays: v })}
                />
              </div>
            </div>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
              </p>
              <Select
                value={search.sort ?? "bestsellers"}
                onValueChange={(v) => update({ sort: v as never })}
              >
                <SelectTrigger className="h-10 w-[200px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bestsellers">Mais vendidos</SelectItem>
                  <SelectItem value="new">Lançamentos</SelectItem>
                  <SelectItem value="price-asc">Menor preço</SelectItem>
                  <SelectItem value="price-desc">Maior preço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {search.category && activeCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {activeCategory.name}
                    <button onClick={() => update({ category: undefined })} aria-label="Remover">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {search.q && (
                  <Badge variant="secondary" className="gap-1">
                    "{search.q}"
                    <button onClick={() => update({ q: undefined })} aria-label="Remover">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {loading ? (
              <PageLoader />
            ) : filtered.length === 0 ? (
              <div className="mt-12 rounded-2xl border border-dashed bg-card p-12 text-center">
                <p className="font-semibold">Nenhum produto encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">Tente ajustar os filtros.</p>
                <Button className="mt-5" onClick={() => navigate({ search: {} })}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
