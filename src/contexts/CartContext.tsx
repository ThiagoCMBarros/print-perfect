import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { Tables, Json } from "@/integrations/supabase/types";

export type CartItemRow = Tables<"cart_items"> & {
  produtos:
    | (Pick<Tables<"produtos">, "id" | "nome" | "imagem" | "slug" | "complexidade"> & {
        categories: { complexity: "simple" | "medium" | "complex" } | null;
      })
    | null;
};

type CartCtx = {
  items: CartItemRow[];
  count: number;
  subtotal: number;
  loading: boolean;
  add: (input: AddItemInput) => Promise<{ error: string | null }>;
  remove: (id: string) => Promise<void>;
  updateQty: (id: string, qty: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

export type AddItemInput = {
  produto_id: string;
  composicao: Json;
  urgency: "standard" | "express";
  unit_price: number;
  total_price: number;
  qtd: number;
  artwork_path?: string | null;
  artwork_back_path?: string | null;
};

const Ctx = createContext<CartCtx | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("cart_items")
      .select("*, produtos(id, nome, imagem, slug, complexidade, categories(complexity))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as unknown as CartItemRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add: CartCtx["add"] = async (input) => {
    if (!user) return { error: "Faça login para adicionar ao carrinho." };
    const { error } = await supabase.from("cart_items").insert({
      ...input,
      user_id: user.id,
    });
    if (error) return { error: error.message };
    await refresh();
    return { error: null };
  };

  const remove = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    await refresh();
  };

  const updateQty = async (id: string, qty: number) => {
    const safeQty = Math.max(1, Math.min(9999, Math.floor(qty)));
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const unit = Number(item.unit_price);
    const newTotal = Number((unit * safeQty).toFixed(2));
    await supabase
      .from("cart_items")
      .update({ qtd: safeQty, total_price: newTotal })
      .eq("id", id);
    await refresh();
  };

  const clear = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    await refresh();
  };

  const subtotal = items.reduce((acc, i) => acc + Number(i.total_price), 0);
  const count = items.reduce((acc, i) => acc + i.qtd, 0);

  return (
    <Ctx.Provider value={{ items, count, subtotal, loading, add, remove, updateQty, clear, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
