import { expect, test } from "@playwright/test";

test("商品登録から会計、履歴、再読み込みまで維持される", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/");
  const assetStatuses = await page.evaluate(async () => {
    const paths = [
      "manifest.webmanifest",
      "icons/icon-192.png",
      "icons/icon-512.png",
      "icons/apple-touch-icon.png",
      "sounds/01_additem.mp3",
      "sounds/02_merchandise.mp3",
    ];
    return Promise.all(
      paths.map(async (path) => {
        const response = await fetch(new URL(path, document.baseURI));
        return [path, response.status] as const;
      }),
    );
  });
  expect(assetStatuses).toEqual([
    ["manifest.webmanifest", 200],
    ["icons/icon-192.png", 200],
    ["icons/icon-512.png", 200],
    ["icons/apple-touch-icon.png", 200],
    ["sounds/01_additem.mp3", 200],
    ["sounds/02_merchandise.mp3", 200],
  ]);
  const manifest = await page.evaluate(async () => {
    const response = await fetch(
      new URL("manifest.webmanifest", document.baseURI),
    );
    return response.json();
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: "icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      }),
      expect.objectContaining({
        src: "icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      }),
    ]),
  );
  const iconDimensions = await page.evaluate(async () => {
    const paths = [
      "icons/icon-192.png",
      "icons/icon-512.png",
      "icons/apple-touch-icon.png",
    ];
    return Promise.all(
      paths.map(
        (path) =>
          new Promise<[string, number, number]>((resolve, reject) => {
            const image = new Image();
            image.onload = () =>
              resolve([path, image.naturalWidth, image.naturalHeight]);
            image.onerror = () => reject(new Error(`Failed to load ${path}`));
            image.src = new URL(path, document.baseURI).href;
          }),
      ),
    );
  });
  expect(iconDimensions).toEqual([
    ["icons/icon-192.png", 192, 192],
    ["icons/icon-512.png", 512, 512],
    ["icons/apple-touch-icon.png", 180, 180],
  ]);
  const appleTouchIcon = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href");
  expect(appleTouchIcon).toBe("./icons/apple-touch-icon.png");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "商品" }).click();
  await page.getByRole("button", { name: "新規" }).click();
  await page.getByLabel(/商品名/).fill("ライブ限定バッジ");
  await page.getByLabel("価格（円）").fill("700");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("ライブ限定バッジ")).toBeVisible();
  await expect(page.locator(".management-card").first()).toContainText(
    "ライブ限定バッジ",
  );
  await page.reload();
  await expect(page.locator(".management-card").first()).toContainText(
    "ライブ限定バッジ",
  );

  await page.getByRole("link", { name: "会計" }).click();
  await expect(page.locator(".product-card").first()).toContainText(
    "ライブ限定バッジ",
  );
  await page.getByRole("button", { name: "ライブ限定バッジを1点追加" }).click();
  const received = page.getByRole("textbox", { name: "預かり金" });
  await page.getByRole("button", { name: "100円" }).click();
  await page.getByRole("button", { name: "100円" }).click();
  await expect(received).toHaveValue("200");
  await page.getByRole("button", { name: "500円" }).click();
  await page.getByRole("button", { name: "1,000円" }).click();
  await expect(received).toHaveValue("1700");
  await expect(page.locator(".change-display strong")).toHaveText("¥1,000");
  await page.getByRole("button", { name: "10,000円" }).click();
  await expect(received).toHaveValue("11700");
  await expect(page.locator(".change-display strong")).toHaveText("¥11,000");
  await page.getByRole("button", { name: "預かり金を消去" }).click();
  await expect(received).toHaveValue("");
  await page.getByRole("button", { name: "ちょうど" }).click();
  await expect(received).toHaveValue("700");
  await expect(page.locator(".change-display strong")).toHaveText("¥0");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "会計完了" }).click();
  await page.getByRole("button", { name: "会計を保存" }).click();
  await expect(page.getByText("会計を保存しました。")).toBeVisible();

  await page.getByRole("link", { name: "履歴" }).click();
  await expect(page.getByText("¥700", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("¥700", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "商品" }).click();
  await expect(page.getByText("ライブ限定バッジ")).toBeVisible();
  const soundToggle = page.getByRole("switch", { name: /効果音/ });
  await soundToggle.uncheck();
  await page.reload();
  await expect(page.getByRole("switch", { name: /効果音/ })).not.toBeChecked();
  expect(consoleErrors).toEqual([]);
});
