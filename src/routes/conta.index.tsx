import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/conta/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      }
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado");
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Meu perfil</h1>
      <form onSubmit={save} className="mt-6 max-w-lg space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <Label>E-mail</Label>
          <Input value={user?.email ?? ""} disabled className="mt-1.5" />
        </div>
        <div>
          <Label>Nome completo</Label>
          <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
      </form>
    </div>
  );
}
