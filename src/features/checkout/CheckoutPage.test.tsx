import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/database";
import { CheckoutPage } from "./CheckoutPage";

const { playSoundEffectMock } = vi.hoisted(() => ({
  playSoundEffectMock: vi.fn(),
}));

vi.mock("../../services/soundService", () => ({
  playSoundEffect: playSoundEffectMock,
}));

beforeEach(async () => {
  await db.products.clear();
  await db.sales.clear();
  await db.settings.clear();
  await db.settings.put({
    id: "app",
    seeded: true,
    schemaVersion: 2,
    soundEnabled: true,
  });
  playSoundEffectMock.mockClear();
  await db.products.add({
    id: "test-shirt",
    name: "テストTシャツ",
    price: 3000,
    presetIcon: "shirt",
    sortOrder: 0,
    active: true,
    isSoldOut: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

describe("会計画面", () => {
  it("指定金額を加算し、ちょうどと消去を安全に処理する", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);
    for (const label of [
      "100円",
      "500円",
      "1,000円",
      "5,000円",
      "10,000円",
      "ちょうど",
    ])
      expect(
        await screen.findByRole("button", { name: label }),
      ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "2,000円" })).toBeNull();
    expect(screen.queryByRole("button", { name: "3,000円" })).toBeNull();
    expect(screen.getByRole("button", { name: "ちょうど" })).toBeDisabled();

    const input = screen.getByRole("textbox", { name: "預かり金" });
    await user.click(screen.getByRole("button", { name: "100円" }));
    await user.click(screen.getByRole("button", { name: "100円" }));
    expect(input).toHaveValue("200");
    await user.clear(input);
    await user.type(input, "1200");
    await user.click(screen.getByRole("button", { name: "500円" }));
    expect(input).toHaveValue("1700");

    await user.click(
      await screen.findByRole("button", { name: "テストTシャツを1点追加" }),
    );
    expect(screen.getByText("あと ¥1,300")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ちょうど" }));
    expect(input).toHaveValue("3000");
    expect(
      screen.getByText("¥0", { selector: ".change-display strong" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "預かり金を消去" }));
    expect(input).toHaveValue("");
    expect(screen.getByLabelText("テストTシャツの数量")).toHaveTextContent("1");
    expect(screen.getByText("あと ¥3,000")).toBeInTheDocument();
    expect(playSoundEffectMock).toHaveBeenCalledTimes(1);
  });

  it("商品カードの1タップで数量と追加音が1回だけ増える", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);
    await user.click(
      await screen.findByRole("button", { name: "テストTシャツを1点追加" }),
    );
    expect(screen.getByLabelText("テストTシャツの数量")).toHaveTextContent("1");
    expect(playSoundEffectMock).toHaveBeenCalledTimes(1);
    expect(playSoundEffectMock).toHaveBeenCalledWith("addItem", true);
  });

  it("プラスは1回だけ増加・再生し、マイナスでは再生しない", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);
    await user.click(
      await screen.findByRole("button", { name: "テストTシャツを1点増やす" }),
    );
    expect(screen.getByLabelText("テストTシャツの数量")).toHaveTextContent("1");
    expect(playSoundEffectMock).toHaveBeenCalledTimes(1);

    playSoundEffectMock.mockClear();
    await user.click(
      screen.getByRole("button", { name: "テストTシャツを1点減らす" }),
    );
    expect(screen.getByLabelText("テストTシャツの数量")).toHaveTextContent("0");
    expect(playSoundEffectMock).not.toHaveBeenCalled();
  });

  it("効果音オフでは商品追加音を呼ばない", async () => {
    await db.settings.put({
      id: "app",
      seeded: true,
      schemaVersion: 2,
      soundEnabled: false,
    });
    const user = userEvent.setup();
    render(<CheckoutPage />);
    await user.click(
      await screen.findByRole("button", { name: "テストTシャツを1点追加" }),
    );
    expect(playSoundEffectMock).toHaveBeenCalledWith("addItem", false);
  });

  it("保存成功後だけ会計完了音を1回呼ぶ", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);
    await user.click(
      await screen.findByRole("button", { name: "テストTシャツを1点追加" }),
    );
    expect(
      screen.getByText("¥3,000", { selector: ".total-row strong" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "5,000円" }));
    expect(
      screen.getByText("¥2,000", { selector: ".change-display strong" }),
    ).toBeInTheDocument();
    playSoundEffectMock.mockClear();
    await user.click(screen.getByRole("button", { name: "会計完了" }));
    expect(playSoundEffectMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "戻る" }));
    expect(playSoundEffectMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "会計完了" }));
    await user.click(screen.getByRole("button", { name: "会計を保存" }));
    expect(await screen.findByText("会計を保存しました。")).toBeInTheDocument();
    expect(await db.sales.count()).toBe(1);
    expect(playSoundEffectMock).toHaveBeenCalledTimes(1);
    expect(playSoundEffectMock).toHaveBeenCalledWith("checkoutComplete", true);
  });

  it("会計保存失敗時は完了音を呼ばない", async () => {
    const user = userEvent.setup();
    const addSpy = vi.spyOn(db.sales, "add").mockRejectedValueOnce(new Error());
    render(<CheckoutPage />);
    await user.click(
      await screen.findByRole("button", { name: "テストTシャツを1点追加" }),
    );
    await user.click(screen.getByRole("button", { name: "5,000円" }));
    await user.click(screen.getByRole("button", { name: "会計完了" }));
    playSoundEffectMock.mockClear();
    await user.click(screen.getByRole("button", { name: "会計を保存" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "会計を保存できませんでした",
    );
    expect(playSoundEffectMock).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });
});
