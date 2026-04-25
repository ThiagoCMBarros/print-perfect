import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/conta/enderecos")({
  component: AddressesPage,
});

function AddressesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Tables<"addresses">[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setList(data ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    toast.success("Endereço removido");
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Meus endereços</h1>
      {list.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Você ainda não cadastrou endereços. Eles serão salvos automaticamente ao finalizar um pedido.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <div key={a.id} className="rounded-2xl border bg-card p-5">
              <p className="font-semibold">{a.recipient} {a.is_default && <span className="ml-1 text-xs text-brand">· Padrão</span>}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}<br />
                {a.neighborhood} · {a.city}/{a.state} · CEP {a.zip_code}
              </p>
              <Button variant="ghost" size="sm" className="mt-3 text-muted-foreground hover:text-destructive" onClick={() => remove(a.id)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remover
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
