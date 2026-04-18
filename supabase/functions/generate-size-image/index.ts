// Edge Function: gera imagem mockup de uma opção de tamanho com régua via Lovable AI.
// Recebe { option_id } -> baixa a opção, monta o prompt baseado em label/numeric_value
// e no produto, gera a imagem com google/gemini-2.5-flash-image, faz upload no
// bucket público `product-images` e atualiza product_options.image.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ParsedSize = { w: number; h: number; unit: "cm" | "mm" } | null;

function parseSize(label: string): ParsedSize {
  // aceita "10x15", "10 x 15 cm", "100 x 50 mm", "A4", etc.
  const m = label
    .toLowerCase()
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(cm|mm)?/);
  if (m) {
    const w = parseFloat(m[1]);
    const h = parseFloat(m[2]);
    const unit = (m[3] as "cm" | "mm" | undefined) ?? "cm";
    return { w, h, unit };
  }
  // formatos A — aproximações
  const A: Record<string, [number, number]> = {
    a3: [29.7, 42], a4: [21, 29.7], a5: [14.8, 21], a6: [10.5, 14.8], a7: [7.4, 10.5],
  };
  const k = label.trim().toLowerCase();
  if (A[k]) return { w: A[k][0], h: A[k][1], unit: "cm" };
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const { option_id } = await req.json();
    if (!option_id) throw new Error("option_id obrigatório");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // valida usuário admin via JWT do header
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(jwt);
    const userId = userData.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: opt, error: optErr } = await admin
      .from("product_options")
      .select("id, label, option_type, numeric_value, product_id, products(name, categories(name))")
      .eq("id", option_id)
      .maybeSingle();
    if (optErr || !opt) throw new Error(optErr?.message ?? "opção não encontrada");

    const productName: string = (opt as any).products?.name ?? "produto gráfico";
    const categoryName: string = (opt as any).products?.categories?.name ?? "impresso";
    const parsed = parseSize(opt.label);

    let dimsText = opt.label;
    let aspectHint = "the printed item should be shown in a balanced rectangular shape";
    if (parsed) {
      dimsText = `${parsed.w}${parsed.unit} x ${parsed.h}${parsed.unit}`;
      if (parsed.w > parsed.h) aspectHint = "the printed item is HORIZONTAL (landscape) — wider than tall";
      else if (parsed.h > parsed.w) aspectHint = "the printed item is VERTICAL (portrait) — taller than wide";
      else aspectHint = "the printed item is a perfect SQUARE";
    }

    const prompt = `Realistic top-down product photo of a printed ${categoryName.toLowerCase()} (${productName}) in size ${dimsText}, lying flat on a clean light gray studio surface. ${aspectHint}. Next to the printed item, place a real wooden ruler with clear visible centimeter markings, aligned to demonstrate the exact ${dimsText} dimension. Soft natural lighting, gentle shadow, sharp focus, professional product photography style, no text overlays, no watermarks. Show the size accurately and proportionally.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway: ${aiRes.status} ${t}`);
    }
    const aiJson = await aiRes.json();
    const dataUrl: string | undefined =
      aiJson.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl?.startsWith("data:image")) throw new Error("Imagem não retornada");

    const base64 = dataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const path = `option-${opt.id}-${Date.now()}.png`;
    const { error: upErr } = await admin.storage
      .from("product-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = admin.storage.from("product-images").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: updErr } = await admin
      .from("product_options").update({ image: publicUrl }).eq("id", opt.id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ image: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-size-image error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
