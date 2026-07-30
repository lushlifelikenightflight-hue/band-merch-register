import type { BackupData, NormalizedBackupData } from "../../types/models";
import { presetIcons } from "../../types/models";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateBackup(value: unknown): value is BackupData {
  if (!isRecord(value)) return false;
  if (
    value.format !== "band-merch-register" ||
    value.version !== 1 ||
    typeof value.exportedAt !== "string" ||
    !Array.isArray(value.products) ||
    !Array.isArray(value.sales) ||
    !Array.isArray(value.settings)
  )
    return false;

  return (
    value.products.every(
      (product) =>
        isRecord(product) &&
        typeof product.id === "string" &&
        typeof product.name === "string" &&
        Number.isSafeInteger(product.price) &&
        (product.price as number) >= 0 &&
        typeof product.active === "boolean" &&
        (product.isSoldOut === undefined ||
          typeof product.isSoldOut === "boolean") &&
        Number.isInteger(product.sortOrder) &&
        typeof product.presetIcon === "string" &&
        presetIcons.includes(
          product.presetIcon as (typeof presetIcons)[number],
        ),
    ) &&
    value.sales.every(
      (sale) =>
        isRecord(sale) &&
        typeof sale.id === "string" &&
        typeof sale.soldAt === "string" &&
        Array.isArray(sale.items) &&
        Number.isSafeInteger(sale.total) &&
        Number.isSafeInteger(sale.received) &&
        Number.isSafeInteger(sale.change),
    ) &&
    value.settings.every(
      (setting) =>
        isRecord(setting) &&
        setting.id === "app" &&
        typeof setting.seeded === "boolean" &&
        Number.isSafeInteger(setting.schemaVersion) &&
        (setting.soundEnabled === undefined ||
          typeof setting.soundEnabled === "boolean"),
    )
  );
}

export function normalizeBackup(data: BackupData): NormalizedBackupData {
  const appSetting = data.settings.find((setting) => setting.id === "app");
  return {
    ...data,
    products: data.products.map((product) => ({
      ...product,
      isSoldOut: product.isSoldOut ?? false,
    })),
    settings: [
      {
        id: "app",
        seeded: appSetting?.seeded ?? true,
        schemaVersion: 3,
        soundEnabled: appSetting?.soundEnabled ?? true,
      },
    ],
  };
}
