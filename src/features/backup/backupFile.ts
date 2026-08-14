import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { BackupData } from "../../types/models";

export function backupFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `band-merch-register-backup-${date.getFullYear()}${pad(
    date.getMonth() + 1,
  )}${pad(date.getDate())}-${pad(date.getHours())}${pad(
    date.getMinutes(),
  )}${pad(date.getSeconds())}.json`;
}

export function createBackupFile(data: BackupData, date = new Date()): File {
  return new File([JSON.stringify(data)], backupFileName(date), {
    type: "application/json",
  });
}

export async function shareOrDownloadBackup(
  file: File,
): Promise<"shared" | "downloaded"> {
  if (Capacitor.isNativePlatform()) {
    const path = `backups/${file.name}`;
    const saved = await Filesystem.writeFile({
      path,
      data: await file.text(),
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    try {
      await Share.share({
        title: "StoreRegiLog+ バックアップ",
        url: saved.uri,
        dialogTitle: "バックアップの保存先を選択",
      });
      return "shared";
    } finally {
      await Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(
        () => undefined,
      );
    }
  }

  if (
    typeof navigator.share === "function" &&
    navigator.canShare?.({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: "StoreRegiLog+ バックアップ",
    });
    return "shared";
  }

  const url = URL.createObjectURL(file);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
  return "downloaded";
}
