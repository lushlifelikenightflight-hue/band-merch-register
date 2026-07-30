import Dexie, { type EntityTable } from "dexie";
import type { AppSettings, Product, Sale } from "../types/models";

export class MerchDatabase extends Dexie {
  products!: EntityTable<Product, "id">;
  sales!: EntityTable<Sale, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor(name = "band-merch-register") {
    super(name);
    this.version(1).stores({
      products: "id, sortOrder, createdAt",
      sales: "id, soldAt",
      settings: "id",
    });
    this.version(2)
      .stores({
        products: "id, sortOrder, createdAt",
        sales: "id, soldAt",
        settings: "id",
      })
      .upgrade(async (transaction) => {
        const settings = transaction.table<AppSettings>("settings");
        const current = await settings.get("app");
        if (current) {
          await settings.put({
            ...current,
            schemaVersion: 2,
            soundEnabled: current.soundEnabled ?? true,
          });
        }
      });
    this.version(3)
      .stores({
        products: "id, sortOrder, createdAt",
        sales: "id, soldAt",
        settings: "id",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<Product>("products")
          .toCollection()
          .modify((product) => {
            product.isSoldOut ??= false;
          });
      });
  }
}

export const db = new MerchDatabase();

const initialProducts: Array<Pick<Product, "name" | "price" | "presetIcon">> = [
  { name: "Tシャツ", price: 3000, presetIcon: "shirt" },
  { name: "CD", price: 2000, presetIcon: "disc" },
  { name: "ステッカー", price: 500, presetIcon: "sticker" },
  { name: "チェキ", price: 1000, presetIcon: "camera" },
];

export async function seedDatabase(): Promise<void> {
  await db.transaction("rw", db.products, db.settings, async () => {
    const setting = await db.settings.get("app");
    if (setting?.seeded) {
      if (setting.schemaVersion < 3 || setting.soundEnabled === undefined) {
        await db.settings.put({
          ...setting,
          schemaVersion: 3,
          soundEnabled: setting.soundEnabled ?? true,
        });
      }
      return;
    }
    const now = new Date().toISOString();
    await db.products.bulkAdd(
      initialProducts.map((product, index) => ({
        ...product,
        id: crypto.randomUUID(),
        sortOrder: index,
        active: true,
        isSoldOut: false,
        createdAt: now,
        updatedAt: now,
      })),
    );
    await db.settings.put({
      id: "app",
      seeded: true,
      schemaVersion: 3,
      soundEnabled: true,
    });
  });
}

export async function setSoundEnabled(soundEnabled: boolean): Promise<void> {
  const current = await db.settings.get("app");
  await db.settings.put({
    id: "app",
    seeded: current?.seeded ?? true,
    schemaVersion: 3,
    soundEnabled,
  });
}

export async function setProductSoldOut(
  product: Product,
  isSoldOut: boolean,
): Promise<void> {
  await db.products.put({
    ...product,
    isSoldOut,
    updatedAt: new Date().toISOString(),
  });
}

export async function saveProductOrder(products: Product[]): Promise<void> {
  await db.transaction("rw", db.products, async () => {
    await Promise.all(
      products.map((product, sortOrder) =>
        db.products.update(product.id, { sortOrder }),
      ),
    );
  });
}

export async function addProductAtStart(product: Product): Promise<void> {
  await db.transaction("rw", db.products, async () => {
    const existing = await db.products.orderBy("sortOrder").toArray();
    await db.products.bulkPut([
      { ...product, sortOrder: 0 },
      ...existing.map((item, index) => ({ ...item, sortOrder: index + 1 })),
    ]);
  });
}
