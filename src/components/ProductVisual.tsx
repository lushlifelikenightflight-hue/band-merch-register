import {
  Camera,
  CircleEllipsis,
  Disc3,
  KeyRound,
  Shirt,
  Sparkles,
  Sticker,
  Waves,
} from "lucide-react";
import type { Product } from "../types/models";

const icons = {
  shirt: Shirt,
  disc: Disc3,
  sticker: Sticker,
  towel: Waves,
  keyring: KeyRound,
  camera: Camera,
  other: CircleEllipsis,
};

export function ProductVisual({
  product,
  size = 48,
}: {
  product: Product;
  size?: number;
}) {
  if (product.imageData) {
    return <img className="product-image" src={product.imageData} alt="" />;
  }
  const Icon = icons[product.presetIcon] ?? Sparkles;
  return <Icon size={size} aria-hidden="true" />;
}
