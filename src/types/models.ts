export const presetIcons = [
  "shirt",
  "disc",
  "sticker",
  "towel",
  "keyring",
  "camera",
  "other",
] as const;
export type PresetIcon = (typeof presetIcons)[number];

export interface Product {
  id: string;
  name: string;
  price: number;
  imageData?: string;
  presetIcon: PresetIcon;
  sortOrder: number;
  active: boolean;
  isSoldOut: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
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
}

export type BackupAppSettings = Omit<AppSettings, "soundEnabled"> & {
  soundEnabled?: boolean;
};

export type BackupProduct = Omit<Product, "isSoldOut"> & {
  isSoldOut?: boolean;
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
