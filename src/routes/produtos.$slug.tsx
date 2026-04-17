import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, ShoppingCart, Upload, PenTool, MessageCircle,
  Clock, ShieldCheck, Truck, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import {
  calcPrice, formatBRL, getCategory, getProductBySlug, products,
} from "@/data/products";

export const Route = createFileRoute("/produtos/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: p
        ? [
            { title: `${p.name} — GráficaPro` },
            { name: "description", content: p.shortDescription },
            { property: "og:title", content: `${p.name} — GráficaPro` },
            { property: "og:description", content: p.shortDescription },
          ]
        : [{ title: "Produto não encontrado — GráficaPro" }],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Produto não encontrado</h1>
        <p className="mt-2 text-muted-foreground">O produto que você procura não existe ou foi removido.</p>
        <Button asChild className="mt-6"><Link to="/produtos">Ver catálogo</Link></Button>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button asChild className="mt-6"><Link to="/produtos">Voltar ao catálogo</Link></Button>
      </div>
    </SiteLayout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const category = getCategory(product.categoryId);

  const [sizeId, setSizeId] = useState(product.sizes[0].id);
  const [materialId, setMaterialId] = useState(product.materials[0].id);
  const [finishId, setFinishId] = useState(product.finishes[0].id);
  const [quantityId, setQuantityId] = useState(product.quantities[0].id);
  const [urgency, setUrgency] = useState<"standard" | "express">("standard");

  const price = useMemo(
    () => calcPrice(product, sizeId, materialId, finishId, quantityId, urgency),
    [product, sizeId, materialId, finishId, quantityId, urgency],
  );

  const related = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 3);

  return (
    <SiteLayout>
      <div className="container-page pt-6">
        <Link to="/produtos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
        </Link>
      </div>

      <section className="container-page grid gap-10 py-8 lg:grid-cols-2">
        {/* Galeria */}
        <div className="space-y-3">
          <div
            className="grid aspect-square place-items-center overflow-hidden rounded-3xl border"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            <span className="text-[10rem] leading-none">{product.image}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <button
                key={i}
                className="grid aspect-square place-items-center rounded-xl border bg-surface-muted text-3xl transition-colors hover:border-brand"
              >
                {product.image}
              </button>
            ))}
          </div>
        </div>

        {/* Configurador */}
        <div>
          {category && <Badge variant="secondary" className="rounded-full">{category.name}</Badge>}
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.description}</p>

          <div className="mt-6 space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
            <OptionGroup
              label="Tamanho"
              value={sizeId}
              onChange={setSizeId}
              options={product.sizes.map((o: { id: string; label: string }) => ({ id: o.id, label: o.label }))}
            />
            <OptionGroup
              label="Material / gramatura"
              value={materialId}
              onChange={setMaterialId}
              options={product.materials.map((o: { id: string; label: string }) => ({ id: o.id, label: o.label }))}
            />
            <OptionGroup
              label="Acabamento"
              value={finishId}
              onChange={setFinishId}
              options={product.finishes.map((o: { id: string; label: string }) => ({ id: o.id, label: o.label }))}
            />
            <OptionGroup
              label="Quantidade"
              value={quantityId}
              onChange={setQuantityId}
              options={product.quantities.map((o: { id: string; value: number }) => ({
                id: o.id,
                label: `${o.value.toLocaleString("pt-BR")} un`,
              }))}
            />

            <div>
              <p className="mb-2 text-sm font-semibold">Prazo de produção</p>
              <RadioGroup
                value={urgency}
                onValueChange={(v) => setUrgency(v as never)}
                className="grid grid-cols-2 gap-2"
              >
                {(["standard", "express"] as const).map((u) => (
                  <Label
                    key={u}
                    htmlFor={`u-${u}`}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border bg-background p-3 text-sm transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                  >
                    <RadioGroupItem id={`u-${u}`} value={u} />
                    <div>
                      <p className="font-medium">{u === "standard" ? "Padrão" : "Express"}</p>
                      <p className="text-xs text-muted-foreground">
                        {u === "standard" ? `${product.productionDays} dias úteis` : `${Math.max(1, Math.ceil(product.productionDays / 2))} dias (+35%)`}
                      </p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Resumo / preço */}
          <div className="mt-6 rounded-2xl border-2 border-brand/20 bg-brand-soft/50 p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total estimado</p>
                <p className="font-display text-4xl font-bold text-brand">{formatBRL(price.total)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBRL(price.unit)} por unidade · pronto em {price.days} {price.days === 1 ? "dia útil" : "dias úteis"}
                </p>
              </div>
              <Clock className="h-10 w-10 text-brand/40" />
            </div>

            <Tabs defaultValue="upload" className="mt-5">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload"><Upload className="mr-1.5 h-3.5 w-3.5" /> Enviar arte</TabsTrigger>
                <TabsTrigger value="editor"><PenTool className="mr-1.5 h-3.5 w-3.5" /> Personalizar</TabsTrigger>
                <TabsTrigger value="help"><MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Ajuda</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-3 rounded-xl border-2 border-dashed bg-background p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Arraste sua arte ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground">PDF, AI, PSD, JPG, PNG · até 50MB</p>
              </TabsContent>
              <TabsContent value="editor" className="mt-3 rounded-xl bg-background p-5 text-sm">
                <p className="font-medium">Editor online (em breve nesta versão)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Personalize com texto, imagens e cores diretamente no navegador. Frente e verso, área segura e sangria automática.
                </p>
              </TabsContent>
              <TabsContent value="help" className="mt-3 rounded-xl bg-background p-5 text-sm">
                <p className="font-medium">Solicite ajuda com a arte</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nossa equipe pode criar ou ajustar sua arte. Atendimento em até 4h úteis.
                </p>
              </TabsContent>
            </Tabs>

            <Button size="lg" className="mt-5 h-12 w-full rounded-xl text-base shadow-glow">
              <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar ao carrinho
            </Button>

            <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Compra segura</li>
              <li className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-brand" /> Envio nacional</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Aprovação de arte</li>
            </ul>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-page pb-16">
          <h2 className="font-display text-2xl font-bold">Você também pode gostar</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}

function OptionGroup({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                active
                  ? "border-brand bg-brand text-brand-foreground shadow-soft"
                  : "border-border bg-background text-foreground hover:border-brand/40"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
