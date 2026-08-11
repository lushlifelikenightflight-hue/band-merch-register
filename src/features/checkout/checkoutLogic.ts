import type { Product, SaleItem } from "../../types/models";

export type Quantities = Record<string, number>;

export function changeQuantity(current: number, delta: number): number {
  return Math.max(0, current + delta);
}

export function buildSaleItems(
  products: Product[],
  quantities: Quantities,
): SaleItem[] {
  return products.flatMap((product) => {
    const quantity = quantities[product.id] ?? 0;
    return quantity > 0
      ? [
          {
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            quantity,
            subtotal: product.price * quantity,
            stockTracked: product.stock !== undefined,
          },
        ]
      : [];
  });
}

export function calculateTotal(items: SaleItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

export function calculatePayment(total: number, received: number) {
  return {
    change: Math.max(0, received - total),
    shortage: Math.max(0, total - received),
    canComplete: total > 0 && received >= total,
  };
}

export function addYen(current: number, amount: number): number | null {
  if (
    !Number.isSafeInteger(current) ||
    !Number.isSafeInteger(amount) ||
    current < 0 ||
    amount < 0
  )
    return null;
  const result = current + amount;
  return Number.isSafeInteger(result) ? result : null;
}
