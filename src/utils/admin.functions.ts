import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

/**
 * Confirma server-side se o usuário autenticado é admin.
 * NÃO usa middleware (que lança Response em caso de falha) — em vez disso
 * trata a ausência de auth como `{ isAdmin: false }` para evitar runtime errors
 * no `beforeLoad` do painel /admin.
 */
export const verifyAdmin = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return { isAdmin: false };

    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return { isAdmin: false };

    const token = authHeader.slice(7);
    if (!token) return { isAdmin: false };

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    const { data: claims } = await supabase.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    if (!userId) return { isAdmin: false };

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  } catch {
    return { isAdmin: false };
  }
});

/**
 * Retorna URL assinada (5 min) para um arquivo do bucket privado `quote-references`.
 * Apenas administradores podem chamar.
 */
export const getQuoteReferenceSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { path: string }) => {
    if (!data?.path || typeof data.path !== "string") throw new Error("path obrigatório");
    if (data.path.length > 512) throw new Error("path inválido");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("forbidden");

    const { data: signed, error } = await supabase.storage
      .from("quote-references")
      .createSignedUrl(data.path, 60 * 5);
    if (error || !signed) throw new Error(error?.message ?? "erro ao assinar url");
    return { url: signed.signedUrl };
  });
