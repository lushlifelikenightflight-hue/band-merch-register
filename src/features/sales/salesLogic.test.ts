import { describe, expect, it } from "vitest";
import type { Sale } from "../../types/models";
import { summarizeSales } from "./salesLogic";

const sale: Sale = {
  id: "sale-1",
  soldAt: "2026-07-30T10:30:00.000Z",
  items: [
    {
      productId: "cd",
      productName: "CD",
      unitPrice: 2000,
      quantity: 2,
      subtotal: 4000,
    },
  ],
  total: 4000,
  received: 5000,
  change: 1000,
};

describe("当日集計", () => {
  it("対象日の売上、会計数、販売点数、商品別数量を集計する", () => {
    const result = summarizeSales([sale], new Date("2026-07-30T12:00:00.000Z"));
    expect(result).toEqual({
      total: 4000,
      saleCount: 1,
      itemCount: 2,
      productCounts: { CD: 2 },
    });
  });
});
