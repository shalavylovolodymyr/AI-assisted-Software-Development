import { api } from "../api";
import type { Page } from "../types";

export async function allPages<T>(
  path: string,
  filters = new URLSearchParams(),
): Promise<T[]> {
  const params = new URLSearchParams(filters);
  params.set("page_size", "100");
  params.set("page", "1");
  const first = await api<Page<T>>(`${path}?${params}`);
  const rows = [...first.items];
  const pages = Math.ceil(first.total / 100);
  for (let start = 2; start <= pages; start += 5) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(5, pages - start + 1) }, (_, index) => {
        const next = new URLSearchParams(params);
        next.set("page", String(start + index));
        return api<Page<T>>(`${path}?${next}`);
      }),
    );
    batch.forEach((page) => rows.push(...page.items));
  }
  return rows;
}
