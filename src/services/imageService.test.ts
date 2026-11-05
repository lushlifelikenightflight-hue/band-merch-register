import { describe, expect, it } from "vitest";
import { calculateSquareCrop } from "./imageService";

describe("calculateSquareCrop", () => {
  it("横長画像を中央の正方形へ切り抜く", () => {
    expect(
      calculateSquareCrop(1200, 800, { zoom: 1, panX: 0, panY: 0 }),
    ).toEqual({ x: 200, y: 0, size: 800 });
  });

  it("拡大率と位置指定を切り抜き座標へ反映する", () => {
    expect(
      calculateSquareCrop(1200, 800, { zoom: 2, panX: 1, panY: -1 }),
    ).toEqual({ x: 0, y: 400, size: 400 });
  });

  it("縦長画像を端まで移動できる範囲に制限する", () => {
    expect(
      calculateSquareCrop(600, 1200, { zoom: 1, panX: 5, panY: 5 }),
    ).toEqual({ x: 0, y: 0, size: 600 });
  });

  it("画像サイズが不正な場合は処理しない", () => {
    expect(() =>
      calculateSquareCrop(0, 800, { zoom: 1, panX: 0, panY: 0 }),
    ).toThrow("画像のサイズを取得できませんでした。");
  });
});
