import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Loader2, ShoppingCart, Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { fetchProductBySlug, calcProductPrice, formatBRL, type ProdutoWithCategory, type CalcResult } from "@/lib/catalog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/produtos/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — GráficaPro` },
      { name: "description", content: "Configure seu impresso: material, gramatura, revestimento e acabamentos com preço calculado em tempo real." },
    ],
  }),
  component: ProductPage,
});

type Material = { id: string; nome: string; tipo_material_id: string };
type TipoMaterial = { id: string; nome: string };
type Gramatura = { id: string; nome: string; material_id: string; valor_mm2: number };
type Revestimento = { id: string; nome: string };
type Aplicacao = { id: string; nome: string; multiplicador: number };
type Acabamento = { id: string; nome: string; valor_unitario: number; qtd_padrao: number };

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();

  const [product, setProduct] = useState<ProdutoWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // composição
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [tipos, setTipos] = useState<TipoMaterial[]>([]);
  const [gramaturas, setGramaturas] = useState<Gramatura[]>([]);
  const [revestimentos, setRevestimentos] = useState<Revestimento[]>([]);
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [acabamentos, setAcabamentos] = useState<Acabamento[]>([]);

  const [materialId, setMaterialId] = useState<string>("");
  const [gramaturaId, setGramaturaId] = useState<string>("");
  const [revestimentoId, setRevestimentoId] = useState<string>("none");
  const [aplicacaoId, setAplicacaoId] = useState<string>("");
  const [acabSel, setAcabSel] = useState<Map<string, number>>(new Map());
  const [qtd, setQtd] = useState<number>(1);

  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProductBySlug(slug)
      .then(async (p) => {
        if (!p) { setNotFound(true); return; }
        setProduct(p);

        const [
          { data: mp }, { data: gp }, { data: rp }, { data: ap },
          { data: tipoData }, { data: aplicData },
        ] = await Promise.all([
          supabase.from("produto_materiais_permitidos").select("material_id, materiais(id, nome, tipo_material_id)").eq("produto_id", p.id),
          supabase.from("produto_gramaturas_permitidas").select("gramatura_id, gramaturas(id, nome, material_id, valor_mm2)").eq("produto_id", p.id),
          supabase.from("produto_revestimentos_permitidos").select("revestimento_id, revestimentos(id, nome)").eq("produto_id", p.id),
          supabase.from("produto_acabamentos_permitidos").select("acabamento_id, qtd_padrao, acabamentos(id, nome, valor_unitario)").eq("produto_id", p.id),
          supabase.from("tipos_material").select("id, nome"),
          supabase.from("revestimento_aplicacoes").select("id, nome, multiplicador").eq("ativo", true).order("sort_order"),
        ]);

        type MR = { materiais: Material | null };
        type GR = { gramaturas: Gramatura | null };
        type RR = { revestimentos: Revestimento | null };
        type AR = { acabamentos: { id: string; nome: string; valor_unitario: number } | null; qtd_padrao: number };

        const mats = ((mp as MR[] | null) ?? []).map((r) => r.materiais).filter(Boolean) as Material[];
        const grams = ((gp as GR[] | null) ?? []).map((r) => r.gramaturas).filter(Boolean) as Gramatura[];
        const revs = ((rp as RR[] | null) ?? []).map((r) => r.revestimentos).filter(Boolean) as Revestimento[];
        const acabs: Acabamento[] = ((ap as AR[] | null) ?? [])
          .filter((r) => r.acabamentos)
          .map((r) => ({ id: r.acabamentos!.id, nome: r.acabamentos!.nome, valor_unitario: Number(r.acabamentos!.valor_unitario), qtd_padrao: r.qtd_padrao }));

        setMateriais(mats);
        setGramaturas(grams);
        setRevestimentos(revs);
        setAcabamentos(acabs);
        setTipos((tipoData as TipoMaterial[]) ?? []);
        setAplicacoes((aplicData as Aplicacao[]) ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Reset gramatura quando muda material
  useEffect(() => {
    setGramaturaId("");
  }, [materialId]);
  // Reset aplicação quando muda revestimento
  useEffect(() => {
    setAplicacaoId("");
  }, [revestimentoId]);

  const gramaturasFiltradas = useMemo(
    () => gramaturas.filter((g) => g.material_id === materialId),
    [gramaturas, materialId],
  );

  // Calcular preço sempre que mudar algo relevante
  useEffect(() => {
    if (!product || !gramaturaId) {
      setCalc(null);
      return;
    }
    const acabPayload = Array.from(acabSel.entries())
      .filter(([, q]) => q > 0)
      .map(([id, q]) => ({ acabamento_id: id, qtd: q }));

    setCalcLoading(true);
    calcProductPrice({
      produto_id: product.id,
      gramatura_id: gramaturaId,
      revestimento_id: revestimentoId !== "none" ? revestimentoId : null,
      aplicacao_id: revestimentoId !== "none" && aplicacaoId ? aplicacaoId : null,
      acabamentos: acabPayload,
      qtd,
    })
      .then((res) => setCalc(res))
      .finally(() => setCalcLoading(false));
  }, [product, gramaturaId, revestimentoId, aplicacaoId, acabSel, qtd]);

  function toggleAcabamento(id: string, checked: boolean) {
    const next = new Map(acabSel);
    if (checked) {
      const def = acabamentos.find((a) => a.id === id)?.qtd_padrao ?? 1;
      next.set(id, def);
    } else {
      next.delete(id);
    }
    setAcabSel(next);
  }
  function updateAcabQtd(id: string, q: number) {
    const next = new Map(acabSel);
    next.set(id, Math.max(1, q));
    setAcabSel(next);
  }

  async function handleAddToCart() {
    if (!user) {
      toast.error("Faça login para adicionar ao carrinho.");
      navigate({ to: "/login" });
      return;
    }
    if (!product || !calc || !gramaturaId) {
      toast.error("Configure a composição antes de adicionar.");
      return;
    }
    setAdding(true);
    const composicao: Json = {
      material_id: materialId,
      material_nome: materiais.find((m) => m.id === materialId)?.nome ?? null,
      gramatura_id: gramaturaId,
      gramatura_nome: gramaturas.find((g) => g.id === gramaturaId)?.nome ?? null,
      revestimento_id: revestimentoId !== "none" ? revestimentoId : null,
      revestimento_nome: revestimentoId !== "none" ? revestimentos.find((r) => r.id === revestimentoId)?.nome ?? null : null,
      aplicacao_id: aplicacaoId || null,
      aplicacao_nome: aplicacaoId ? aplicacoes.find((a) => a.id === aplicacaoId)?.nome ?? null : null,
      acabamentos: Array.from(acabSel.entries()).map(([id, q]) => ({
        id,
        nome: acabamentos.find((a) => a.id === id)?.nome ?? null,
        qtd: q,
      })),
    };

    const { error } = await add({
      produto_id: product.id,
      composicao,
      urgency: "standard",
      unit_price: calc.unit_price,
      total_price: calc.total,
      qtd,
    });
    setAdding(false);
    if (error) return toast.error(error);
    toast.success("Adicionado ao carrinho");
    navigate({ to: "/carrinho" });
  }

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

  const tipoNome = Object.fromEntries(tipos.map((t) => [t.id, t.nome]));
  const showAplicacao = revestimentoId !== "none" && aplicacoes.length > 0;
  const canAdd = !!gramaturaId && !!calc && (revestimentoId === "none" || !!aplicacaoId || aplicacoes.length === 0);

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
            {product.descricao_curta && (
              <p className="mt-4 text-sm text-muted-foreground">{product.descricao_curta}</p>
            )}

            <Card className="mt-6 p-4 text-sm">
              <p><span className="text-muted-foreground">Dimensões: </span><strong>{Number(product.largura_mm)}×{Number(product.altura_mm)} mm</strong></p>
              <p className="mt-1"><span className="text-muted-foreground">Prazo: </span><strong>A partir de {product.dias_producao} dias úteis</strong></p>
            </Card>

            {/* Configurador */}
            <Card className="mt-6 space-y-4 p-5">
              <h2 className="font-display text-lg font-bold">Configure seu produto</h2>

              <div>
                <Label>Material</Label>
                {materiais.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">Nenhum material disponível para este produto.</p>
                ) : (
                  <Select value={materialId} onValueChange={setMaterialId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o material" /></SelectTrigger>
                    <SelectContent>
                      {materiais.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          [{tipoNome[m.tipo_material_id] ?? "—"}] {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {materialId && (
                <div>
                  <Label>Gramatura</Label>
                  {gramaturasFiltradas.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">Sem gramaturas para este material.</p>
                  ) : (
                    <Select value={gramaturaId} onValueChange={setGramaturaId}>
                      <SelectTrigger><SelectValue placeholder="Selecione a gramatura" /></SelectTrigger>
                      <SelectContent>
                        {gramaturasFiltradas.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {revestimentos.length > 0 && (
                <div>
                  <Label>Revestimento (opcional)</Label>
                  <Select value={revestimentoId} onValueChange={setRevestimentoId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem revestimento</SelectItem>
                      {revestimentos.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showAplicacao && (
                <div>
                  <Label>Aplicação do revestimento</Label>
                  <Select value={aplicacaoId} onValueChange={setAplicacaoId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {aplicacoes.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {acabamentos.length > 0 && (
                <div>
                  <Label>Acabamentos (opcional)</Label>
                  <div className="mt-2 space-y-2">
                    {acabamentos.map((a) => {
                      const sel = acabSel.has(a.id);
                      return (
                        <div key={a.id} className="flex items-center gap-3 rounded-lg border p-2">
                          <Checkbox checked={sel} onCheckedChange={(v) => toggleAcabamento(a.id, !!v)} />
                          <span className="flex-1 text-sm">{a.nome} <span className="text-muted-foreground">— {formatBRL(a.valor_unitario)}/un</span></span>
                          {sel && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Qtd</Label>
                              <Input type="number" min={1} className="w-20" value={acabSel.get(a.id) ?? 1}
                                onChange={(e) => updateAcabQtd(a.id, Number(e.target.value))} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={qtd} onChange={(e) => setQtd(Math.max(1, Number(e.target.value)))} />
              </div>
            </Card>

            {/* Preço */}
            <Card className="mt-4 p-5">
              {calcLoading && <p className="text-sm text-muted-foreground"><Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Calculando...</p>}
              {!calc && !calcLoading && <p className="text-sm text-muted-foreground">Selecione material e gramatura para ver o preço.</p>}
              {calc && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Preço unitário</span><strong>{formatBRL(calc.unit_price)}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({calc.qtd}×)</span><span>{formatBRL(calc.subtotal)}</span></div>
                  {calc.desconto > 0 && (
                    <div className="flex justify-between text-emerald-600"><span>Desconto por quantidade</span><span>− {formatBRL(calc.desconto)}</span></div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-base"><strong>Total</strong><strong className="text-brand">{formatBRL(calc.total)}</strong></div>
                </div>
              )}

              <Button className="mt-4 w-full" disabled={!canAdd || adding} onClick={handleAddToCart}>
                {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                Adicionar ao carrinho
              </Button>
              {!canAdd && calc && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3 w-3" /> Complete os campos obrigatórios.</p>}
            </Card>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
