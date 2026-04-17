import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { categories, products } from "@/data/products";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["bestsellers", "price-asc", "price-desc", "new"]).optional(),
  maxPrice: z.number().optional(),
  maxDays: z.number().optional(),
});

export const Route = createFileRoute("/produtos")({
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

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  type SearchT = z.infer<typeof searchSchema>;
  const update = (patch: Partial<SearchT>) =>
    navigate({ search: (prev: SearchT) => ({ ...prev, ...patch }) });

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.category) {
      const cat = categories.find((c) => c.slug === search.category);
      if (cat) list = list.filter((p) => p.categoryId === cat.id);
    }
    if (search.q) {
      const q = search.q.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q),
      );
    }
    if (search.maxPrice) list = list.filter((p) => p.basePrice <= search.maxPrice!);
    if (search.maxDays) list = list.filter((p) => p.productionDays <= search.maxDays!);

    switch (search.sort) {
      case "price-asc": list.sort((a, b) => a.basePrice - b.basePrice); break;
      case "price-desc": list.sort((a, b) => b.basePrice - a.basePrice); break;
      case "new": list.sort((a, b) => Number(!!b.newRelease) - Number(!!a.newRelease)); break;
      case "bestsellers":
      default: list.sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller));
    }
    return list;
  }, [search]);

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
          {/* Sidebar filtros */}
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
                  <span className="text-xs font-semibold">R$ {search.maxPrice ?? 200}</span>
                </div>
                <Slider
                  className="mt-3"
                  value={[search.maxPrice ?? 200]}
                  min={5}
                  max={200}
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
                  max={7}
                  step={1}
                  onValueChange={([v]) => update({ maxDays: v })}
                />
              </div>
            </div>
          </aside>

          {/* Lista */}
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

            {filtered.length === 0 ? (
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
