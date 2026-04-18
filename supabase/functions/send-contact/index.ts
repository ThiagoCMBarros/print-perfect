// Edge function: recebe mensagens do formulário de contato
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(ok: boolean, payload: Record<string, unknown> = {}, status = 200) {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, phone, subject, message } = body ?? {};

    if (!name || !email || !message) {
      return respond(false, { error: "Campos obrigatórios faltando." });
    }

    console.log("[contact]", JSON.stringify({
      name, email, phone, subject, message, ts: new Date().toISOString(),
    }));

    return respond(true);
  } catch (e) {
    console.error("[contact] error", e);
    return respond(false, { error: (e as Error).message ?? "Erro inesperado" });
  }
});
