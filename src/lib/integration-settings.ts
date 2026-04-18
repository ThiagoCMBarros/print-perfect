import { supabase } from "@/integrations/supabase/client";

export type IntegrationSetting = {
  id: string;
  category: string;
  key: string;
  value: unknown;
  description: string | null;
  is_sensitive: boolean;
  updated_at: string;
};

/** Lê uma setting por (category, key). Retorna fallback se não existir. */
export async function getSetting<T = unknown>(
  category: string,
  key: string,
  fallback: T,
): Promise<T> {
  const { data } = await supabase
    .from("integration_settings")
    .select("value")
    .eq("category", category)
    .eq("key", key)
    .maybeSingle();
  if (!data) return fallback;
  return (data.value as T) ?? fallback;
}

/** Lê todas as settings de uma categoria como objeto { key: value }. */
export async function getCategorySettings(
  category: string,
): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from("integration_settings")
    .select("key,value")
    .eq("category", category);
  const out: Record<string, unknown> = {};
  for (const row of data ?? []) out[row.key] = row.value;
  return out;
}
