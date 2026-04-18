import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Cache em módulo: evita refazer a mesma query em cada componente que monta o hook.
// TTL de 60s; o cache é por user_id.
type Entry = { value: boolean; expires: number; promise?: Promise<boolean> };
const cache = new Map<string, Entry>();
const TTL = 60_000;

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const cached = cache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.value;
  if (cached?.promise) return cached.promise;
  const promise = Promise.resolve(
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
  ).then(({ data }) => {
    const value = !!data;
    cache.set(userId, { value, expires: Date.now() + TTL });
    return value;
  });
  cache.set(userId, { value: cached?.value ?? false, expires: 0, promise });
  return promise;
}

export function invalidateIsAdminCache(userId?: string) {
  if (userId) cache.delete(userId);
  else cache.clear();
}

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (!user) return false;
    const c = cache.get(user.id);
    return c && c.expires > Date.now() ? c.value : false;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchIsAdmin(user.id).then((v) => {
      if (cancelled) return;
      setIsAdmin(v);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  return { isAdmin, loading };
}
