const MAX_EDGE = 800;

export interface SquareCropSettings {
  zoom: number;
  panX: number;
  panY: number;
}

export interface SquareCropRect {
  x: number;
  y: number;
  size: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function assertImageFile(file: File): void {
  if (!file.type.startsWith("image/"))
    throw new Error("画像ファイルを選択してください。");
}

export function calculateSquareCrop(
  width: number,
  height: number,
  settings: SquareCropSettings,
): SquareCropRect {
  if (width <= 0 || height <= 0)
    throw new Error("画像のサイズを取得できませんでした。");
  const zoom = clamp(settings.zoom, 1, 3);
  const panX = clamp(settings.panX, -1, 1);
  const panY = clamp(settings.panY, -1, 1);
  const size = Math.min(width, height) / zoom;
  const horizontalTravel = (width - size) / 2;
  const verticalTravel = (height - size) / 2;
  return {
    x: horizontalTravel * (1 - panX),
    y: verticalTravel * (1 - panY),
    size,
  };
}

export async function compressImage(file: File): Promise<string> {
  assertImageFile(file);
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を処理できませんでした。");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.78);
}

export async function cropSquareImage(
  file: File,
  settings: SquareCropSettings,
): Promise<string> {
  assertImageFile(file);
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const crop = calculateSquareCrop(bitmap.width, bitmap.height, settings);
    const outputSize = Math.min(
      MAX_EDGE,
      Math.max(1, Math.round(Math.min(bitmap.width, bitmap.height))),
    );
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を処理できませんでした。");
    context.drawImage(
      bitmap,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      outputSize,
      outputSize,
    );
    return canvas.toDataURL("image/webp", 0.78);
  } finally {
    bitmap.close();
  }
}
