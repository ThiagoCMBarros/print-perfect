import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Loader2, Send } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — GráficaPro" },
      { name: "description", content: "Fale com a equipe da GráficaPro. Atendimento de segunda a sexta, das 9h às 18h." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      return toast.error("Preencha nome, e-mail e mensagem.");
    }
    setBusy(true);
    const { error } = await supabase.functions.invoke("send-contact", { body: form });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Mensagem enviada! Responderemos em até 1 dia útil.");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  }

  return (
    <SiteLayout>
      <section className="container-page py-16">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Fale com a gente</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Estamos prontos para tirar dúvidas, fazer orçamentos e ajudar com o seu projeto.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {[
              { icon: Phone, t: "Telefone", d: "(11) 4000-0000" },
              { icon: Mail, t: "E-mail", d: "contato@graficapro.com.br" },
              { icon: MapPin, t: "Endereço", d: "Rua das Gráficas, 100 — São Paulo/SP" },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border bg-card p-5 flex items-start gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand shrink-0">
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{c.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border bg-surface-muted p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Horário de atendimento</p>
              <p className="mt-1">Segunda a sexta, das 9h às 18h.</p>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-2xl border bg-card p-6 shadow-soft space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar mensagem
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
