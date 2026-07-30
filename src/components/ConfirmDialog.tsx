import { useEffect, useId, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "確定する",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onCancel();
      }}
      aria-labelledby={titleId}
      aria-busy={busy}
    >
      <div className="dialog-content">
        <h2 id={titleId}>{title}</h2>
        <div>{children}</div>
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={busy}
          >
            戻る
          </button>
          <button
            type="button"
            className={danger ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "処理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
