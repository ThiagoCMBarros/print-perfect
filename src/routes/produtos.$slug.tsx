import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Construction, ImageIcon, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchProductBySlug, type ProdutoWithCategory } from "@/lib/catalog";

export const Route = createFileRoute("/produtos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — GráficaPro` },
      { name: "description", content: "Configure seu impresso com a nova arquitetura por composição." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<ProdutoWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProductBySlug(slug)
      .then((p) => {
        if (!p) setNotFound(true);
        else setProduct(p);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <SiteLayout><div className="container-page flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div></SiteLayout>;
  }

  if (notFound || !product) {
    return (
      <SiteLayout>
        <div className="container-page py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Produto não encontrado</h1>
          <Button asChild className="mt-6"><Link to="/produtos">Ver catálogo</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border bg-card">
            <div className="relative grid aspect-[4/3] place-items-center" style={{ backgroundImage: "var(--gradient-hero)" }}>
              {product.imagem ? (
                <img src={product.imagem} alt={product.nome} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-20 w-20 text-brand/30" />
              )}
            </div>
          </div>

          <div>
            {product.categories && (
              <p className="text-sm text-muted-foreground">{product.categories.name}</p>
            )}
            <h1 className="mt-1 font-display text-3xl font-bold">{product.nome}</h1>
            <div className="mt-2 flex gap-2">
              {product.bestseller && <Badge>Mais vendido</Badge>}
              {product.novidade && <Badge variant="secondary">Lançamento</Badge>}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{product.descricao_curta ?? product.descricao ?? ""}</p>

            <div className="mt-6 rounded-2xl border bg-card p-5 text-sm">
              <p><span className="text-muted-foreground">Dimensões: </span><strong>{Number(product.largura_mm)}×{Number(product.altura_mm)} mm</strong></p>
              <p className="mt-1"><span className="text-muted-foreground">Área: </span><strong>{Number(product.area_mm2 ?? 0).toFixed(2)} mm²</strong></p>
              <p className="mt-1"><span className="text-muted-foreground">Margem: </span><strong>{Number(product.margem_percent)}%</strong></p>
              <p className="mt-1"><span className="text-muted-foreground">Prazo: </span><strong>A partir de {product.dias_producao} dias úteis</strong></p>
            </div>

            <div className="mt-6 rounded-2xl border-2 border-dashed bg-card p-6 text-center">
              <Construction className="mx-auto h-10 w-10 text-brand" />
              <p className="mt-3 font-semibold">Configurador em reconstrução</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Em breve você poderá escolher material → gramatura → revestimento → acabamentos
                e ver o preço calculado em tempo real.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/orcamento">Pedir orçamento</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
