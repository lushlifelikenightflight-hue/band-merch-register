import { describe, expect, it } from "vitest";
import type { Product } from "../../types/models";
import { reorderProducts } from "./productOrder";

const products = ["a", "b", "c"].map((id, sortOrder): Product => ({
  id,
  name: id,
  price: 100,
  presetIcon: "shirt",
  sortOrder,
  active: true,
  isSoldOut: false,
  createdAt: "",
  updatedAt: "",
}));

describe("reorderProducts", () => {
  it("moves a product and normalizes every sort order", () => {
    const result = reorderProducts(products, "c", "a");
    expect(result.map(({ id, sortOrder }) => [id, sortOrder])).toEqual([
      ["c", 0],
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("returns the current order when an id is unknown", () => {
    expect(reorderProducts(products, "x", "a")).toEqual(products);
  });
});
