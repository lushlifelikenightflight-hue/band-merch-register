import { describe, expect, it } from "vitest";
import type { Product } from "../../types/models";
import {
  addYen,
  buildSaleItems,
  calculatePayment,
  calculateTotal,
  changeQuantity,
} from "./checkoutLogic";

const product: Product = {
  id: "shirt",
  name: "Tシャツ",
  price: 3000,
  presetIcon: "shirt",
  sortOrder: 0,
  active: true,
  isSoldOut: false,
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
};

describe("会計ロジック", () => {
  it("安全な整数円だけを加算する", () => {
    expect(addYen(0, 500)).toBe(500);
    expect(addYen(500, 500)).toBe(1000);
    expect(addYen(Number.MAX_SAFE_INTEGER, 1)).toBeNull();
    expect(addYen(-1, 100)).toBeNull();
  });
  it("数量を増減し、0未満にしない", () => {
    expect(changeQuantity(0, 1)).toBe(1);
    expect(changeQuantity(0, -1)).toBe(0);
  });

  it("選択商品から小計と合計を整数で計算する", () => {
    const items = buildSaleItems([product], { shirt: 2 });
    expect(items[0]?.subtotal).toBe(6000);
    expect(calculateTotal(items)).toBe(6000);
  });

  it("お釣り、不足額、完了条件を計算する", () => {
    expect(calculatePayment(3000, 5000)).toEqual({
      change: 2000,
      shortage: 0,
      canComplete: true,
    });
    expect(calculatePayment(3000, 2500)).toEqual({
      change: 0,
      shortage: 500,
      canComplete: false,
    });
    expect(calculatePayment(0, 1000).canComplete).toBe(false);
  });
});
