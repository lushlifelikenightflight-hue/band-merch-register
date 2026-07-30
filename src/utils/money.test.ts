import { describe, expect, it } from "vitest";
import { formatYen, parseYen } from "./money";

describe("金額", () => {
  it("日本円形式に整形する", () => expect(formatYen(3000)).toBe("¥3,000"));
  it("整数文字列だけを受け付ける", () => {
    expect(parseYen("2500")).toBe(2500);
    expect(parseYen("2.5")).toBeNull();
    expect(parseYen("-1")).toBeNull();
  });
});
