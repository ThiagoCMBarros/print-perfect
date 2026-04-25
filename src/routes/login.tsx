import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});
const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(1, "Informe a senha").max(72),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Entrar — GráficaPro" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  // Cadastro
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email: loginEmail, password: loginPwd });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);
    if (error) return toast.error(error.includes("Invalid") ? "E-mail ou senha incorretos" : error);
    toast.success("Bem-vindo de volta!");
    // Se houver redirect explícito, respeita. Caso contrário, admin vai para /admin, demais para /.
    if (search.redirect && search.redirect !== "/") {
      navigate({ to: search.redirect });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleRow) {
        navigate({ to: "/admin" });
        return;
      }
    }
    navigate({ to: "/" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ fullName: name, email, phone, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName, parsed.data.phone);
    setLoading(false);
    if (error) return toast.error(error.includes("already") ? "Este e-mail já está cadastrado" : error);
    toast.success("Cadastro realizado! Você já pode comprar.");
    navigate({ to: search.redirect || "/" });
  };

  const handleReset = async () => {
    if (!loginEmail) return toast.error("Informe seu e-mail no campo acima");
    const { error } = await resetPassword(loginEmail);
    if (error) return toast.error(error);
    toast.success("Enviamos um link de redefinição para seu e-mail");
  };

  return (
    <SiteLayout>
      <section className="container-page grid place-items-center py-16">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
              <LogIn className="h-5 w-5" />
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold">Acesse sua conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">Para finalizar pedidos e acompanhar a produção</p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="le">E-mail</Label>
                  <Input id="le" type="email" autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="lp">Senha</Label>
                  <Input id="lp" type="password" autoComplete="current-password" value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <button type="button" onClick={handleReset} className="block w-full text-center text-xs text-muted-foreground hover:text-brand">
                  <Mail className="mr-1 inline h-3 w-3" /> Esqueci minha senha
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="n">Nome completo</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="e">E-mail</Label>
                  <Input id="e" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="ph">Telefone (opcional)</Label>
                  <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                </div>
                <div>
                  <Label htmlFor="p">Senha</Label>
                  <Input id="p" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                  <p className="mt-1 text-xs text-muted-foreground">Mínimo 8 caracteres</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  {loading ? "Criando..." : "Criar minha conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-brand">← Voltar para a loja</Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
