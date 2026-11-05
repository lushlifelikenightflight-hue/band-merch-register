import { expect, test } from "@playwright/test";

// Installed Chrome avoids downloading a second browser runtime for this check.
test.use({ browserName: "chromium", channel: "chrome" });

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
]) {
  test(`画像処理の再試行と保存 ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("./");
    await page.getByRole("button", { name: "はじめる" }).click();
    await page.getByRole("link", { name: "商品", exact: true }).click();
    await page.getByRole("button", { name: "新規", exact: true }).click();
    await page.getByLabel(/商品名/).fill("切り抜き検証商品");
    await page.getByLabel("価格（円）").fill("1000");
    const png = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, 600, 800);
      ctx.fillStyle = "blue";
      ctx.fillRect(600, 0, 600, 800);
      return canvas.toDataURL("image/png").split(",")[1];
    });
    const file = {
      name: "crop.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    };
    await page.locator('input[accept="image/*"]').setInputFiles(file);
    const dialog = page.getByRole("dialog", { name: "画像の位置を調整" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "キャンセル" }).click();
    await expect(dialog).toHaveCount(0);
    await page.locator('input[accept="image/*"]').setInputFiles(file);
    await dialog.getByRole("slider", { name: "画像の拡大率" }).fill("2");
    await dialog.getByRole("slider", { name: "画像の左右位置" }).fill("0.3");
    await page.evaluate(() => {
      const original = window.createImageBitmap.bind(window);
      let calls = 0;
      window.createImageBitmap = ((
        ...args: Parameters<typeof createImageBitmap>
      ) => {
        if (++calls === 1)
          return Promise.reject(new Error("injected temporary failure"));
        return new Promise((resolve, reject) => {
          setTimeout(() => original(...args).then(resolve, reject), 400);
        });
      }) as typeof createImageBitmap;
    });
    await dialog.getByRole("button", { name: "この位置で使う" }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "この位置で使う" }),
    ).toBeEnabled();
    await dialog.getByRole("button", { name: "この位置で使う" }).click();
    await expect(
      dialog.getByRole("slider", { name: "画像の拡大率" }),
    ).toBeDisabled();
    await expect(
      dialog.getByRole("button", { name: "中央に戻す" }),
    ).toBeDisabled();
    await expect(dialog).toHaveCount(0);
    const image = page.getByRole("img", { name: "選択した商品画像" });
    await expect(image).toBeVisible();
    expect(
      await image.evaluate((node: HTMLImageElement) => [
        node.naturalWidth,
        node.naturalHeight,
      ]),
    ).toEqual([800, 800]);
    await page.getByRole("button", { name: "保存する" }).click();
    // Wait for the IndexedDB transaction before testing durable reload.
    await expect(page.locator(".sheet-backdrop")).toHaveCount(0);
    await expect(page.locator(".management-card").first()).toContainText(
      "切り抜き検証商品",
    );
    await page.reload();
    await expect(page.locator(".management-card").first()).toContainText(
      "切り抜き検証商品",
    );
    await page.getByRole("link", { name: "会計", exact: true }).click();
    for (const count of ["2", "3", "4", "5"]) {
      await page
        .getByRole("combobox", { name: "商品カードの表示列数" })
        .selectOption(count);
      await expect(page.locator(".product-grid")).toHaveAttribute(
        "data-columns",
        count,
      );
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
