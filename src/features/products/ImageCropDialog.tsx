import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { SquareCropSettings } from "../../services/imageService";

interface ImageCropDialogProps {
  previewUrl: string;
  onApply: (settings: SquareCropSettings) => Promise<void>;
  onCancel: () => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  panX: number;
  panY: number;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(-1, value));
}

export function ImageCropDialog({
  previewUrl,
  onApply,
  onCancel,
}: ImageCropDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const aspect = dimensions.height ? dimensions.width / dimensions.height : 1;
  const baseWidth = aspect >= 1 ? aspect * 100 : 100;
  const baseHeight = aspect >= 1 ? 100 : (1 / aspect) * 100;
  const renderedWidth = baseWidth * zoom;
  const renderedHeight = baseHeight * zoom;
  const imageStyle: CSSProperties = {
    width: `${renderedWidth}%`,
    height: `${renderedHeight}%`,
    left: `${(100 - renderedWidth) / 2 + (panX * (renderedWidth - 100)) / 2}%`,
    top: `${(100 - renderedHeight) / 2 + (panY * (renderedHeight - 100)) / 2}%`,
  };

  function panTravel() {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    return {
      x: Math.max(
        0,
        (stage.clientWidth * renderedWidth) / 200 - stage.clientWidth / 2,
      ),
      y: Math.max(
        0,
        (stage.clientHeight * renderedHeight) / 200 - stage.clientHeight / 2,
      ),
    };
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dimensions.width || busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX,
      panY,
    };
  }

  function moveImage(event: PointerEvent<HTMLDivElement>) {
    if (busy) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const travel = panTravel();
    if (travel.x > 0)
      setPanX(clamp(drag.panX + (event.clientX - drag.startX) / travel.x));
    if (travel.y > 0)
      setPanY(clamp(drag.panY + (event.clientY - drag.startY) / travel.y));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  function resetPosition() {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }

  async function applyCrop() {
    if (busy || !dimensions.width || loadFailed) return;
    dragRef.current = null;
    setBusy(true);
    setError("");
    try {
      await onApply({ zoom, panX, panY });
    } catch {
      setError("画像を調整できませんでした。別の画像でお試しください。");
      setBusy(false);
    }
  }

  return (
    <div className="crop-backdrop">
      <section
        className="crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        aria-busy={busy}
      >
        <div className="crop-header">
          <div>
            <h2 id="crop-title">画像の位置を調整</h2>
            <p>枠内をドラッグして、見せたい位置を合わせてください。</p>
          </div>
          <button
            type="button"
            className="secondary compact"
            onClick={onCancel}
            disabled={busy}
          >
            キャンセル
          </button>
        </div>

        <div
          ref={stageRef}
          className="crop-stage"
          tabIndex={0}
          aria-label="画像の切り抜き位置。ドラッグまたは方向キーで調整"
          onPointerDown={beginDrag}
          onPointerMove={moveImage}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (busy) return;
            const step = event.shiftKey ? 0.15 : 0.05;
            if (event.key === "ArrowLeft")
              setPanX((value) => clamp(value - step));
            else if (event.key === "ArrowRight")
              setPanX((value) => clamp(value + step));
            else if (event.key === "ArrowUp")
              setPanY((value) => clamp(value - step));
            else if (event.key === "ArrowDown")
              setPanY((value) => clamp(value + step));
            else return;
            event.preventDefault();
          }}
        >
          <img
            src={previewUrl}
            alt="切り抜き前の商品画像"
            draggable={false}
            style={imageStyle}
            onLoad={(event) =>
              setDimensions({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            onError={() => {
              setLoadFailed(true);
              setError("画像を読み込めませんでした。");
            }}
          />
          <span className="crop-frame" aria-hidden="true" />
        </div>

        <div className="crop-controls">
          <label>
            <span>
              拡大 <output>{Math.round(zoom * 100)}%</output>
            </span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              aria-label="画像の拡大率"
              disabled={busy || loadFailed}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <label>
            <span>
              左右位置 <output>{Math.round(panX * 100)}</output>
            </span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={panX}
              aria-label="画像の左右位置"
              disabled={busy || loadFailed}
              onChange={(event) => setPanX(Number(event.target.value))}
            />
          </label>
          <label>
            <span>
              上下位置 <output>{Math.round(panY * 100)}</output>
            </span>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={panY}
              aria-label="画像の上下位置"
              disabled={busy || loadFailed}
              onChange={(event) => setPanY(Number(event.target.value))}
            />
          </label>
        </div>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <div className="crop-actions">
          <button
            type="button"
            className="secondary"
            onClick={resetPosition}
            disabled={busy || loadFailed}
          >
            中央に戻す
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => void applyCrop()}
            disabled={busy || !dimensions.width || loadFailed}
          >
            {busy ? "処理中…" : "この位置で使う"}
          </button>
        </div>
      </section>
    </div>
  );
}
