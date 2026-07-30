import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { db } from "../../db/database";
import type { BackupData, NormalizedBackupData } from "../../types/models";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { normalizeBackup, validateBackup } from "./backup";
import { createBackupFile, shareOrDownloadBackup } from "./backupFile";

export function BackupPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<NormalizedBackupData | null>(null);
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const [message, setMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  async function exportBackup() {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const data: BackupData = {
        format: "band-merch-register",
        version: 1,
        exportedAt: new Date().toISOString(),
        products: await db.products.toArray(),
        sales: await db.sales.toArray(),
        settings: await db.settings.toArray(),
      };
      const result = await shareOrDownloadBackup(createBackupFile(data));
      setMessage(
        result === "shared"
          ? "バックアップを作成しました。共有メニューから「ファイルに保存」を選択してください。"
          : "バックアップをダウンロードしました。端末外にも保管してください。",
      );
    } catch (error) {
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "共有をキャンセルしました。"
          : "バックアップを作成できませんでした。",
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function chooseFile(file?: File) {
    if (!file) return;
    setIsReading(true);
    try {
      const value: unknown = JSON.parse(await file.text());
      if (!validateBackup(value)) throw new Error();
      setPending(normalizeBackup(value));
      setMessage("");
    } catch {
      setMessage("正しいバックアップファイルではありません。");
    } finally {
      setIsReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function restore() {
    if (!pending || isRestoring) return;
    setIsRestoring(true);
    try {
      await db.transaction(
        "rw",
        db.products,
        db.sales,
        db.settings,
        async () => {
          if (mode === "replace") {
            await Promise.all([
              db.products.clear(),
              db.sales.clear(),
              db.settings.clear(),
            ]);
          }
          await db.products.bulkPut(pending.products);
          await db.sales.bulkPut(pending.sales);
          await db.settings.bulkPut(pending.settings);
        },
      );
      setPending(null);
      setMessage(
        mode === "replace"
          ? "データを置き換えました。"
          : "データを追加しました。重複IDはバックアップ側で更新しました。",
      );
    } catch {
      setMessage("復元に失敗しました。端末の空き容量を確認してください。");
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <>
      <div className="backup-actions">
        <button
          className="secondary"
          onClick={exportBackup}
          disabled={isExporting || isReading || isRestoring}
        >
          <Download />
          {isExporting ? "作成中…" : "バックアップ"}
        </button>
        <label
          className={`secondary button-label ${
            isExporting || isReading || isRestoring ? "disabled" : ""
          }`}
        >
          <Upload />
          {isReading ? "読込中…" : "復元"}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            disabled={isExporting || isReading || isRestoring}
            onChange={(e) => chooseFile(e.target.files?.[0])}
          />
        </label>
      </div>
      <p className="backup-help">
        iPhone・iPadでは「バックアップ」後の共有メニューから「ファイルに保存」を選びます。
        復元する場合は保存したJSONファイルを選択してください。
      </p>
      {message && (
        <p className="inline-message" role="status">
          {message}
        </p>
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        title="バックアップを復元"
        confirmLabel="復元する"
        busy={isRestoring}
        onConfirm={restore}
        onCancel={() => {
          if (!isRestoring) setPending(null);
        }}
      >
        {pending && (
          <dl className="backup-summary">
            <div>
              <dt>作成日時</dt>
              <dd>{new Date(pending.exportedAt).toLocaleString("ja-JP")}</dd>
            </div>
            <div>
              <dt>商品</dt>
              <dd>{pending.products.length}件</dd>
            </div>
            <div>
              <dt>会計履歴</dt>
              <dd>{pending.sales.length}件</dd>
            </div>
          </dl>
        )}
        <p>復元方法を選択してください。</p>
        <label className="radio-row">
          <input
            type="radio"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
          />
          現在のデータをすべて置き換える
        </label>
        <label className="radio-row">
          <input
            type="radio"
            checked={mode === "merge"}
            onChange={() => setMode("merge")}
          />
          現在のデータへ追加する
        </label>
        <small>
          追加時に同じIDがあるデータはバックアップ側の内容で更新します。
        </small>
        {mode === "replace" && (
          <p className="restore-warning" role="alert">
            現在の商品・会計履歴・設定はすべて削除され、選択したバックアップの内容に置き換わります。復元後に元へ戻すことはできません。
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
