import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ShoppingCart, Upload, PenTool, MessageCircle,
  Clock, ShieldCheck, Truck, Check, ImageIcon, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { CardEditor } from "@/components/site/CardEditor";
import { toast } from "sonner";
import {
  calcPrice, fetchProductBySlug, formatBRL, getOptions, type ProductWithOptions,
} from "@/lib/catalog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/produtos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — GráficaPro` },
      { name: "description", content: "Configure seu impresso com tamanho, material, acabamento e quantidade." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductWithOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [sizeId, setSizeId] = useState<string | null>(null);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [finishId, setFinishId] = useState<string | null>(null);
  const [quantityId, setQuantityId] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<"standard" | "express">("standard");
  const [adding, setAdding] = useState(false);
  const [artworkPath, setArtworkPath] = useState<string | null>(null);
  const [artworkLabel, setArtworkLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetchProductBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        if (!p) { setNotFound(true); return; }
        setProduct(p);
        setSizeId(getOptions(p, "size")[0]?.id ?? null);
        setMaterialId(getOptions(p, "material")[0]?.id ?? null);
        setFinishId(getOptions(p, "finish")[0]?.id ?? null);
        setQuantityId(getOptions(p, "quantity")[0]?.id ?? null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug]);

  const price = useMemo(
    () => product ? calcPrice(product, sizeId, materialId, finishId, quantityId, urgency) : null,
    [product, sizeId, materialId, finishId, quantityId, urgency],
  );

  if (loading) {
    return (
      <SiteLayout>
        <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (notFound || !product) {
    return (
      <SiteLayout>
        <div className="container-page py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Produto não encontrado</h1>
          <p className="mt-2 text-muted-foreground">O produto que você procura não existe ou foi desativado.</p>
          <Button asChild className="mt-6"><Link to="/produtos">Ver catálogo</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const sizes = getOptions(product, "size");
  const materials = getOptions(product, "material");
  const finishes = getOptions(product, "finish");
  const quantities = getOptions(product, "quantity");

  async function handleAdd() {
    if (!user) {
      toast.info("Faça login para adicionar ao carrinho.");
      navigate({ to: "/login" });
      return;
    }
    if (!price || !product) return;
    setAdding(true);
    const { error } = await add({
      product_id: product.id,
      size_option_id: sizeId,
      material_option_id: materialId,
      finish_option_id: finishId,
      quantity_option_id: quantityId,
      urgency,
      unit_price: price.unit,
      total_price: price.total,
      qty: 1,
    });
    setAdding(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Adicionado ao carrinho!");
    }
  }

  return (
    <SiteLayout>
      <div className="container-page pt-6">
        <Link to="/produtos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
        </Link>
      </div>

      <section className="container-page grid gap-10 py-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div
            className="grid aspect-square place-items-center overflow-hidden rounded-3xl border"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-32 w-32 text-brand/30" />
            )}
          </div>
        </div>

        <div>
          {product.categories && (
            <Badge variant="secondary" className="rounded-full">{product.categories.name}</Badge>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.description ?? product.short_description}</p>

          <div className="mt-6 space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
            {sizes.length > 0 && (
              <OptionGroup label="Tamanho" value={sizeId} onChange={setSizeId}
                options={sizes.map((o) => ({ id: o.id, label: o.label }))} />
            )}
            {materials.length > 0 && (
              <OptionGroup label="Material / gramatura" value={materialId} onChange={setMaterialId}
                options={materials.map((o) => ({ id: o.id, label: o.label }))} />
            )}
            {finishes.length > 0 && (
              <OptionGroup label="Acabamento" value={finishId} onChange={setFinishId}
                options={finishes.map((o) => ({ id: o.id, label: o.label }))} />
            )}
            {quantities.length > 0 && (
              <OptionGroup label="Quantidade" value={quantityId} onChange={setQuantityId}
                options={quantities.map((o) => ({ id: o.id, label: o.label }))} />
            )}

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
                        {u === "standard"
                          ? `${product.production_days} dias úteis`
                          : `${Math.max(1, Math.ceil(product.production_days / 2))} dias (+35%)`}
                      </p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border-2 border-brand/20 bg-brand-soft/50 p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total estimado</p>
                <p className="font-display text-4xl font-bold text-brand">{price ? formatBRL(price.total) : "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {price ? `${formatBRL(price.unit)} por unidade · pronto em ${price.days} ${price.days === 1 ? "dia útil" : "dias úteis"}` : ""}
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
                <label className="block cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">
                    {artworkLabel ?? "Arraste sua arte ou clique para selecionar"}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, AI, PSD, JPG, PNG · até 50MB</p>
                  <input
                    type="file"
                    accept=".pdf,.ai,.psd,.jpg,.jpeg,.png,.svg,.eps,.cdr"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleArtworkUpload(e.target.files[0])}
                  />
                </label>
              </TabsContent>
              <TabsContent value="editor" className="mt-3 rounded-xl bg-background p-5 text-sm">
                <p className="font-medium">Editor online</p>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">
                  Personalize sua arte e salve direto no pedido — ou baixe o PNG em alta resolução.
                </p>
                <CardEditor
                  categorySlug={product.categories?.slug}
                  enableSave
                  onSave={handleArtworkSave}
                />
              </TabsContent>
              <TabsContent value="help" className="mt-3 rounded-xl bg-background p-5 text-sm">
                <p className="font-medium">Solicite ajuda com a arte</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nossa equipe pode criar ou ajustar sua arte. Atendimento em até 4h úteis.
                </p>
              </TabsContent>
            </Tabs>

            <Button
              size="lg"
              className="mt-5 h-12 w-full rounded-xl text-base shadow-glow"
              onClick={handleAdd}
              disabled={adding}
            >
              {adding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
              Adicionar ao carrinho
            </Button>

            <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Compra segura</li>
              <li className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-brand" /> Envio nacional</li>
              <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Aprovação de arte</li>
            </ul>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function OptionGroup({
  label, value, onChange, options,
}: {
  label: string;
  value: string | null;
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
