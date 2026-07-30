import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../db/database";
import { ProductsPage } from "./ProductsPage";

beforeEach(async () => {
  await db.products.clear();
  await db.settings.clear();
  await db.settings.put({
    id: "app",
    seeded: true,
    schemaVersion: 2,
    soundEnabled: true,
  });
});

describe("商品管理", () => {
  it("新規商品を先頭へ追加し既存順序と一意なsortOrderを維持する", async () => {
    const now = new Date().toISOString();
    await db.products.bulkAdd(
      ["Tシャツ", "CD", "ステッカー"].map((name, sortOrder) => ({
        id: name,
        name,
        price: 1000,
        presetIcon: "shirt" as const,
        sortOrder,
        active: true,
        isSoldOut: false,
        createdAt: now,
        updatedAt: now,
      })),
    );
    const user = userEvent.setup();
    render(<ProductsPage />);
    await user.click(screen.getByRole("button", { name: "新規" }));
    await user.type(screen.getByLabelText(/商品名/), "タオル");
    await user.type(screen.getByLabelText("価格（円）"), "2500");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(async () => {
      const saved = await db.products.orderBy("sortOrder").toArray();
      expect(saved.map((product) => product.name)).toEqual([
        "タオル",
        "Tシャツ",
        "CD",
        "ステッカー",
      ]);
      expect(saved.map((product) => product.sortOrder)).toEqual([0, 1, 2, 3]);
    });
  });

  it("商品を登録し、編集し、削除できる", async () => {
    const user = userEvent.setup();
    render(<ProductsPage />);
    await user.click(screen.getByRole("button", { name: "新規" }));
    await user.type(screen.getByLabelText(/商品名/), "タオル");
    await user.type(screen.getByLabelText("価格（円）"), "2500");
    await user.click(screen.getByRole("button", { name: "保存する" }));
    expect(await screen.findByText("タオル")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "タオルを編集" }));
    const name = screen.getByLabelText(/商品名/);
    await user.clear(name);
    await user.type(name, "ツアータオル");
    await user.click(screen.getByRole("button", { name: "保存する" }));
    expect(await screen.findByText("ツアータオル")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "ツアータオルを削除" }),
    );
    await user.click(screen.getByRole("button", { name: "削除する" }));
    expect(
      await screen.findByText("ツアータオル").catch(() => null),
    ).toBeNull();
  });

  it("効果音設定をIndexedDBへ保存して再描画後も維持する", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ProductsPage />);
    const toggle = await screen.findByRole("switch", { name: /効果音/ });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    await waitFor(async () =>
      expect((await db.settings.get("app"))?.soundEnabled).toBe(false),
    );

    unmount();
    render(<ProductsPage />);
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: /効果音/ })).not.toBeChecked(),
    );
  });
});
