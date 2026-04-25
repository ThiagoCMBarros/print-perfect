import { fetchCategories, fetchProducts, type DBCategory, type ProdutoWithCategory } from "@/lib/catalog";

const TTL_MS = 60_000;

type Entry<T> = { data: T; expires: number; promise?: Promise<T> };

const categoriesCache: { current?: Entry<DBCategory[]> } = {};
const productsCache = new Map<string, Entry<ProdutoWithCategory[]>>();

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

export function getCachedProducts(filters: { categorySlug?: string; q?: string } = {}): Promise<ProdutoWithCategory[]> {
  const key = `${filters.categorySlug ?? ""}|${filters.q ?? ""}`;
  const e = productsCache.get(key);
  if (isFresh(e)) return Promise.resolve(e!.data);
  if (e?.promise) return e.promise;
  const promise = fetchProducts(filters).then((data) => {
    productsCache.set(key, { data, expires: Date.now() + TTL_MS });
    return data;
  });
  productsCache.set(key, { data: (e?.data as ProdutoWithCategory[]) ?? [], expires: 0, promise });
  return promise;
}

export function invalidateCatalogCache() {
  categoriesCache.current = undefined;
  productsCache.clear();
}
