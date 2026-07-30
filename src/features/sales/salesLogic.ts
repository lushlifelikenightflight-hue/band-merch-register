import type { Sale } from "../../types/models";

export interface DailySalesGroup {
  key: string;
  date: Date;
  sales: Sale[];
  total: number;
  saleCount: number;
  itemCount: number;
  products: Array<{
    key: string;
    productName: string;
    quantity: number;
  }>;
}

export function localDayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameLocalDay(isoDate: string, target = new Date()): boolean {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

export function summarizeSales(sales: Sale[], target = new Date()) {
  const today = sales.filter((sale) => isSameLocalDay(sale.soldAt, target));
  const productCounts: Record<string, number> = {};
  let itemCount = 0;
  for (const sale of today) {
    for (const item of sale.items) {
      itemCount += item.quantity;
      productCounts[item.productName] =
        (productCounts[item.productName] ?? 0) + item.quantity;
    }
  }
  return {
    total: today.reduce((sum, sale) => sum + sale.total, 0),
    saleCount: today.length,
    itemCount,
    productCounts,
  };
}

export function groupSalesByLocalDay(sales: Sale[]): DailySalesGroup[] {
  const groupedSales = new Map<string, Sale[]>();
  for (const sale of sales) {
    const key = localDayKey(sale.soldAt);
    groupedSales.set(key, [...(groupedSales.get(key) ?? []), sale]);
  }

  return [...groupedSales.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, daySales]) => {
      const productCounts = new Map<
        string,
        { productName: string; quantity: number }
      >();
      let itemCount = 0;
      for (const sale of daySales) {
        for (const item of sale.items) {
          const productKey = item.productId || `name:${item.productName}`;
          const current = productCounts.get(productKey);
          productCounts.set(productKey, {
            productName: current?.productName ?? item.productName,
            quantity: (current?.quantity ?? 0) + item.quantity,
          });
          itemCount += item.quantity;
        }
      }

      return {
        key,
        date: new Date(daySales[0]?.soldAt ?? `${key}T00:00:00`),
        sales: [...daySales].sort((a, b) => b.soldAt.localeCompare(a.soldAt)),
        total: daySales.reduce((sum, sale) => sum + sale.total, 0),
        saleCount: daySales.length,
        itemCount,
        products: [...productCounts.entries()]
          .map(([productKey, value]) => ({ key: productKey, ...value }))
          .sort(
            (a, b) =>
              b.quantity - a.quantity ||
              a.productName.localeCompare(b.productName, "ja"),
          ),
      };
    });
}
