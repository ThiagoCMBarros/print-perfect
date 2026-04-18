import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Confirma server-side se o usuário autenticado é admin.
 * Usado pelo `beforeLoad` do painel /admin para evitar bypass via DevTools.
 */
export const verifyAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) return { isAdmin: false };
    return { isAdmin: !!data };
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
