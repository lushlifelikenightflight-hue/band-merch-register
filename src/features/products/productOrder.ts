import type { Product } from "../../types/models";

export function reorderProducts(
  products: Product[],
  activeId: string,
  overId: string,
): Product[] {
  const from = products.findIndex((product) => product.id === activeId);
  const to = products.findIndex((product) => product.id === overId);
  if (from < 0 || to < 0 || from === to) return products;

  const reordered = [...products];
  const [moved] = reordered.splice(from, 1);
  if (!moved) return products;
  reordered.splice(to, 0, moved);
  return reordered.map((product, sortOrder) => ({ ...product, sortOrder }));
}
