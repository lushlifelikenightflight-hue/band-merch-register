export const presetIcons = [
  "shirt",
  "disc",
  "sticker",
  "towel",
  "keyring",
  "camera",
  "ticket",
  "other",
] as const;
export type PresetIcon = (typeof presetIcons)[number];

export const checkoutColumnCounts = [2, 3, 4, 5] as const;
export type CheckoutColumnCount = (typeof checkoutColumnCounts)[number];

export interface Product {
  id: string;
  name: string;
  price: number;
  imageData?: string;
  presetIcon: PresetIcon;
  sortOrder: number;
  active: boolean;
  isSoldOut: boolean;
  stock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  stockTracked?: boolean;
}

export interface Sale {
  id: string;
  soldAt: string;
  items: SaleItem[];
  total: number;
  received: number;
  change: number;
}

export interface AppSettings {
  id: "app";
  seeded: boolean;
  schemaVersion: number;
  soundEnabled: boolean;
  checkoutColumns?: CheckoutColumnCount;
}

export type BackupAppSettings = Omit<
  AppSettings,
  "soundEnabled" | "checkoutColumns"
> & {
  soundEnabled?: boolean;
  checkoutColumns?: CheckoutColumnCount;
};

export type BackupProduct = Omit<Product, "isSoldOut" | "stock"> & {
  isSoldOut?: boolean;
  stock?: number;
};

export interface BackupData {
  format: "band-merch-register";
  version: 1;
  exportedAt: string;
  products: BackupProduct[];
  sales: Sale[];
  settings: BackupAppSettings[];
}

export interface NormalizedBackupData extends Omit<
  BackupData,
  "products" | "settings"
> {
  products: Product[];
  settings: AppSettings[];
}
