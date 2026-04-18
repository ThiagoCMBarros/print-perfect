import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Sparkles, MessageCircle, Phone, Clock, CheckCircle2, Upload, X, Loader2, Paperclip } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = "image/*,application/pdf,.ai,.psd,.cdr,.eps,.svg,.zip,.rar";

const WHATSAPP_NUMBER = "5511976905156";

const productTypes = [
  "Cartão de visita",
  "Flyer / Panfleto",
  "Banner / Faixa",
  "Adesivo",
  "Folder / Catálogo",
  "Cardápio",
  "Convite",
  "Brinde personalizado",
  "Outro",
];

const quantities = ["Até 100", "100 a 500", "500 a 1.000", "1.000 a 5.000", "Mais de 5.000"];
const deadlines = ["Urgente (até 3 dias)", "Padrão (4 a 7 dias)", "Sem pressa (mais de 7 dias)"];

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Orçamento personalizado via WhatsApp — GráficaPro" },
      { name: "description", content: "Solicite um orçamento sob medida para o seu projeto gráfico. Resposta rápida pelo WhatsApp." },
      { property: "og:title", content: "Orçamento personalizado via WhatsApp — GráficaPro" },
      { property: "og:description", content: "Conte os detalhes do seu projeto e receba um orçamento sob medida pelo WhatsApp." },
    ],
  }),
  component: OrcamentoPage,
});

function OrcamentoPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [productType, setProductType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [deadline, setDeadline] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildMessage = (fileUrl?: string) => {
    const lines = [
      "Olá! Gostaria de solicitar um orçamento personalizado.",
      "",
      name && `*Nome:* ${name}`,
      phone && `*Telefone:* ${phone}`,
      productType && `*Tipo de produto:* ${productType}`,
      quantity && `*Quantidade:* ${quantity}`,
      deadline && `*Prazo desejado:* ${deadline}`,
      details && `\n*Detalhes do projeto:*\n${details}`,
      fileUrl && `\n*Arquivo de referência:*\n${fileUrl}`,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let fileUrl: string | undefined;

    if (file) {
      setUploading(true);
      try {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("quote-references")
          .upload(path, file, { contentType: file.type || undefined });
        if (error) throw error;
        const { data } = supabase.storage.from("quote-references").getPublicUrl(path);
        fileUrl = data.publicUrl;
      } catch (err) {
        console.error(err);
        toast.error("Falha ao enviar arquivo. Tente novamente.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const message = encodeURIComponent(buildMessage(fileUrl));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isValid = name.trim() && productType && details.trim();

  return (
    <SiteLayout>
      <section className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">Orçamento personalizado</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Conte os detalhes do seu projeto e enviaremos uma proposta sob medida diretamente pelo WhatsApp.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp / Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 90000-0000"
                      type="tel"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de produto *</Label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade estimada</Label>
                    <Select value={quantity} onValueChange={setQuantity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {quantities.map((q) => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Prazo desejado</Label>
                  <Select value={deadline} onValueChange={setDeadline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {deadlines.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Detalhes do projeto *</Label>
                  <Textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Descreva tamanho, material, acabamento, cores, prazo de entrega e qualquer outra informação importante..."
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo de referência (opcional)</Label>
                  <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept={ACCEPTED_TYPES}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {!file ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                    >
                      <Upload className="h-4 w-4" />
                      Anexar arquivo (imagem, PDF, AI, PSD…) — até 20MB
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <Paperclip className="h-4 w-4 shrink-0 text-brand" />
                        <span className="truncate">{file.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover arquivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#25D366] text-white hover:bg-[#1ebe57]"
                  disabled={!isValid || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando arquivo...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5" />
                      Enviar pelo WhatsApp
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Ao enviar, você será redirecionado para o WhatsApp com a mensagem já preenchida.
                </p>
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold">Fale direto conosco</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prefere ligar ou mandar uma mensagem rápida? Estamos disponíveis no número:
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 text-brand hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">(11) 97690-5156</span>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold">Como funciona</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>Preencha o formulário com os detalhes do projeto</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>Enviamos sua proposta personalizada pelo WhatsApp</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>Após aprovação, iniciamos a produção</span>
                  </li>
                </ul>
                <div className="mt-5 flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
                  <Clock className="h-4 w-4" />
                  <span>Resposta em até 2h úteis</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
