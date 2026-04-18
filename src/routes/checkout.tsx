import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, CreditCard, QrCode, FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/catalog";
import { calculateShipping, FREE_SHIPPING_AMOUNT } from "@/lib/shipping";
import { productionDaysForCart, effectiveComplexity } from "@/lib/production-time";

const addressSchema = z.object({
  recipient: z.string().trim().min(2).max(120),
  zip_code: z.string().trim().min(8).max(10),
  street: z.string().trim().min(2).max(200),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(100).optional(),
  neighborhood: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().length(2),
});

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — GráficaPro" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [unitsMap, setUnitsMap] = useState<Record<string, number>>({});

  const [addr, setAddr] = useState({
    recipient: "", zip_code: "", street: "", number: "",
    complement: "", neighborhood: "", city: "", state: "",
  });
  const [payment, setPayment] = useState<"pix" | "credit_card" | "boleto">("pix");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/checkout" } });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1)
      .then(({ data }) => {
        if (data && data[0]) {
          const a = data[0];
          setAddr({
            recipient: a.recipient, zip_code: a.zip_code, street: a.street, number: a.number,
            complement: a.complement ?? "", neighborhood: a.neighborhood, city: a.city, state: a.state,
          });
        }
      });
  }, [user]);

  // Busca numeric_value das opções de quantidade para calcular o prazo conforme regra.
  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.quantity_option_id).filter(Boolean))) as string[];
    if (ids.length === 0) { setUnitsMap({}); return; }
    supabase
      .from("product_options")
      .select("id, numeric_value")
      .in("id", ids)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach((o) => { map[o.id] = Number(o.numeric_value ?? 1); });
        setUnitsMap(map);
      });
  }, [items]);

  // Frete real por CEP — null antes do CEP estar válido.
  const shippingQuote = useMemo(
    () => calculateShipping(addr.zip_code, subtotal),
    [addr.zip_code, subtotal],
  );

  // Prazo: produção (regra simples/complex × 3000un) + 1d postagem + dias do frete por região.
  const productionDays = useMemo(() => {
    if (items.length === 0) return 0;
    return productionDaysForCart(
      items.map((it) => {
        const units = (it.quantity_option_id && unitsMap[it.quantity_option_id]) || 1;
        const totalQty = units * it.qty;
        const complexity = effectiveComplexity(
          it.products?.complexity ?? null,
          it.products?.categories?.complexity ?? null,
        );
        return { qty: totalQty, complexity, urgency: it.urgency as "standard" | "express" };
      }),
    );
  }, [items, unitsMap]);

  const estimatedDays = productionDays + (shippingQuote?.deliveryDays ?? 0);
  const shipping = shippingQuote?.cost ?? 0;
  const total = subtotal + shipping;

  if (!user) return null;
  if (items.length === 0) {
    return (
      <SiteLayout>
        <section className="container-page py-20 text-center">
          <p className="text-muted-foreground">Seu carrinho está vazio.</p>
          <Button asChild className="mt-4"><Link to="/produtos">Ver produtos</Link></Button>
        </section>
      </SiteLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = addressSchema.safeParse(addr);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!shippingQuote) return toast.error("CEP inválido para cálculo de frete.");

    setSubmitting(true);
    await supabase.from("addresses").upsert({ ...parsed.data, user_id: user.id, is_default: true });

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      payment_method: payment,
      subtotal,
      shipping,
      total,
      shipping_address: parsed.data,
      customer_notes: notes || null,
      estimated_days: estimatedDays,
    }).select().single();

    if (error || !order) {
      setSubmitting(false);
      return toast.error(error?.message ?? "Erro ao criar pedido");
    }

    // Itens — copia artwork_path do carrinho e marca como "pending" se já tiver arte.
    const itemsPayload = items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.products?.name ?? "Produto",
      product_image: it.products?.image ?? null,
      config: {
        size_option_id: it.size_option_id,
        material_option_id: it.material_option_id,
        finish_option_id: it.finish_option_id,
        quantity_option_id: it.quantity_option_id,
        urgency: it.urgency,
      },
      unit_price: it.unit_price,
      qty: it.qty,
      total_price: it.total_price,
      artwork_path: it.artwork_path ?? null,
      artwork_status: (it.artwork_path ? "pending" : "none") as "pending" | "none",
      artwork_uploaded_at: it.artwork_path ? new Date().toISOString() : null,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
    if (itemsErr) {
      setSubmitting(false);
      return toast.error("Erro ao salvar itens: " + itemsErr.message);
    }

    await clear();
    toast.success("Pedido criado com sucesso!");
    navigate({ to: "/pedido/$id", params: { id: order.id } });
  };

  return (
    <SiteLayout>
      <section className="container-page py-10">
        <h1 className="font-display text-3xl font-bold">Finalizar pedido</h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">Endereço de entrega</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Destinatário" value={addr.recipient} onChange={(v) => setAddr({ ...addr, recipient: v })} />
                <Field label="CEP" value={addr.zip_code} onChange={(v) => setAddr({ ...addr, zip_code: v })} />
                <div className="sm:col-span-2"><Field label="Rua / Avenida" value={addr.street} onChange={(v) => setAddr({ ...addr, street: v })} /></div>
                <Field label="Número" value={addr.number} onChange={(v) => setAddr({ ...addr, number: v })} />
                <Field label="Complemento (opcional)" value={addr.complement} onChange={(v) => setAddr({ ...addr, complement: v })} required={false} />
                <Field label="Bairro" value={addr.neighborhood} onChange={(v) => setAddr({ ...addr, neighborhood: v })} />
                <Field label="Cidade" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
                <Field label="UF" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v.toUpperCase() })} maxLength={2} />
              </div>
              {shippingQuote && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Frete para <strong>{shippingQuote.regionLabel}</strong>:{" "}
                  {shippingQuote.freeShippingApplied
                    ? <span className="text-success font-semibold">Grátis</span>
                    : <strong>{formatBRL(shippingQuote.cost)}</strong>}
                  {" · "}entrega em {shippingQuote.deliveryDays} dias úteis após a produção
                </p>
              )}
              {!shippingQuote && addr.zip_code.replace(/\D/g, "").length >= 5 && (
                <p className="mt-3 text-xs text-destructive">CEP inválido. Confira os 8 dígitos.</p>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">Forma de pagamento</h2>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as never)} className="mt-4 grid gap-2 sm:grid-cols-3">
                <PayOption id="pix" current={payment} icon={QrCode} label="PIX" desc="Aprovação imediata" />
                <PayOption id="credit_card" current={payment} icon={CreditCard} label="Cartão" desc="Até 12x" />
                <PayOption id="boleto" current={payment} icon={FileText} label="Boleto" desc="Vence em 3 dias" />
              </RadioGroup>
              <p className="mt-3 text-xs text-muted-foreground">
                * Pagamento simulado nesta versão. Integração real (Stripe/PIX) na próxima fase.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <Label>Observações (opcional)</Label>
              <Textarea className="mt-2" rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: instruções de entrega, prazos especiais..." />
            </div>
          </div>

          <aside className="h-fit rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold">Seu pedido</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((it) => (
                <li key={it.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1">{it.qty}× {it.products?.name}</span>
                  <span className="shrink-0 font-medium">{formatBRL(Number(it.total_price))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t pt-4 text-sm">
              <Row label="Subtotal" value={formatBRL(subtotal)} />
              <Row
                label="Frete"
                value={
                  shippingQuote
                    ? (shipping === 0 ? "Grátis" : formatBRL(shipping))
                    : "Informe o CEP"
                }
              />
              <Row
                label="Prazo estimado"
                value={shippingQuote ? `${estimatedDays} dias úteis` : "—"}
              />
              {!shippingQuote?.freeShippingApplied && (
                <p className="pt-2 text-[11px] text-muted-foreground">
                  Frete grátis acima de {formatBRL(FREE_SHIPPING_AMOUNT)}.
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
              <span>Total</span><span className="text-brand">{formatBRL(total)}</span>
            </div>
            <Button type="submit" size="lg" className="mt-6 h-12 w-full rounded-xl shadow-glow" disabled={submitting || !shippingQuote}>
              {submitting ? "Processando..." : "Confirmar pedido"}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-success" /> Compra 100% segura
            </p>
          </aside>
        </form>
      </section>
    </SiteLayout>
  );
}

function Field({ label, value, onChange, required = true, maxLength }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; maxLength?: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1.5" value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={maxLength} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}

function PayOption({ id, current, icon: Icon, label, desc }: { id: "pix" | "credit_card" | "boleto"; current: string; icon: React.ElementType; label: string; desc: string }) {
  const active = current === id;
  return (
    <Label htmlFor={`pm-${id}`} className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors ${active ? "border-brand bg-brand-soft" : "hover:border-brand/40"}`}>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`pm-${id}`} value={id} />
        <Icon className="h-4 w-4 text-brand" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <span className="ml-6 text-xs text-muted-foreground">{desc}</span>
    </Label>
  );
}
