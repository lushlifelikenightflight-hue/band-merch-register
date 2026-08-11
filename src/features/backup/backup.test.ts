import { describe, expect, it } from "vitest";
import { normalizeBackup, validateBackup } from "./backup";

describe("バックアップ検証", () => {
  it("正しい最小データを受け付ける", () => {
    expect(
      validateBackup({
        format: "band-merch-register",
        version: 1,
        exportedAt: new Date().toISOString(),
        products: [],
        sales: [],
        settings: [],
      }),
    ).toBe(true);
  });

  it("形式不正や必須項目不足を拒否する", () => {
    expect(validateBackup({ format: "other", products: [] })).toBe(false);
  });

  it("旧バックアップの効果音設定をオンで補完する", () => {
    const legacy = {
      format: "band-merch-register" as const,
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      products: [],
      sales: [],
      settings: [{ id: "app" as const, seeded: true, schemaVersion: 1 }],
    };
    expect(validateBackup(legacy)).toBe(true);
    expect(normalizeBackup(legacy).settings[0]?.soundEnabled).toBe(true);
  });

  it("在庫は省略または0以上の整数だけを受け付ける", () => {
    const base = {
      id: "item",
      name: "商品",
      price: 100,
      active: true,
      sortOrder: 0,
      presetIcon: "other",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const data = {
      format: "band-merch-register",
      version: 1,
      exportedAt: new Date().toISOString(),
      products: [{ ...base, stock: 3 }],
      sales: [],
      settings: [],
    };
    expect(validateBackup(data)).toBe(true);
    expect(
      validateBackup({ ...data, products: [{ ...base, stock: -1 }] }),
    ).toBe(false);
  });
});
