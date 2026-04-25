import { fetchCategories, fetchProducts, type DBCategory } from "@/lib/catalog";
import type { Tables } from "@/integrations/supabase/types";

type ProductRow = Tables<"products"> & {
  categories: Pick<DBCategory, "id" | "slug" | "name"> | null;
};

const TTL_MS = 60_000; // 1 minuto

type Entry<T> = { data: T; expires: number; promise?: Promise<T> };

const categoriesCache: { current?: Entry<DBCategory[]> } = {};
const productsCache = new Map<string, Entry<ProductRow[]>>();

function isFresh<T>(e?: Entry<T>) {
  return !!e && e.expires > Date.now();
}

export function getCachedCategories(): Promise<DBCategory[]> {
  const e = categoriesCache.current;
  if (isFresh(e)) return Promise.resolve(e!.data);
  if (e?.promise) return e.promise;
  const promise = fetchCategories().then((data) => {
    categoriesCache.current = { data, expires: Date.now() + TTL_MS };
    return data;
  });
  categoriesCache.current = { data: e?.data ?? [], expires: 0, promise };
  return promise;
}

export function getCachedProducts(filters: { categorySlug?: string; q?: string } = {}): Promise<ProductRow[]> {
  const key = `${filters.categorySlug ?? ""}|${filters.q ?? ""}`;
  const e = productsCache.get(key);
  if (isFresh(e)) return Promise.resolve(e!.data);
  if (e?.promise) return e.promise;
  const promise = fetchProducts(filters).then((data) => {
    productsCache.set(key, { data: data as ProductRow[], expires: Date.now() + TTL_MS });
    return data as ProductRow[];
  });
  productsCache.set(key, { data: (e?.data as ProductRow[]) ?? [], expires: 0, promise });
  return promise;
}

export function invalidateCatalogCache() {
  categoriesCache.current = undefined;
  productsCache.clear();
}
