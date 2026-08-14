import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Download,
  GripVertical,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import {
  addProductAtStart,
  db,
  saveProductOrder,
  setProductActive,
  setProductSoldOut,
  setSoundEnabled,
} from "../../db/database";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ProductVisual } from "../../components/ProductVisual";
import { compressImage } from "../../services/imageService";
import { formatYen } from "../../utils/money";
import { presetIcons, type PresetIcon, type Product } from "../../types/models";
import { BackupPanel } from "../backup/BackupPanel";
import { reorderProducts } from "./productOrder";

const iconLabels: Record<PresetIcon, string> = {
  shirt: "Tシャツ",
  disc: "CD",
  sticker: "ステッカー",
  towel: "タオル",
  keyring: "キーホルダー",
  camera: "チェキ",
  other: "その他",
};

const emptyForm = {
  name: "",
  price: "",
  stock: "",
  presetIcon: "other" as PresetIcon,
  active: true,
  imageData: undefined as string | undefined,
};

interface SortableProductRowProps {
  product: Product;
  first: boolean;
  last: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSoldOut: () => void;
  onToggleActive: () => void;
  onMove: (direction: -1 | 1) => void;
}

function SortableProductRow({
  product,
  first,
  last,
  onEdit,
  onDelete,
  onToggleSoldOut,
  onToggleActive,
  onMove,
}: SortableProductRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  return (
    <article
      ref={setNodeRef}
      className={`management-card ${isDragging ? "dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="drag-handle"
        aria-label={`${product.name}をドラッグして並び替え`}
        {...attributes}
        {...listeners}
      >
        <GripVertical />
      </button>
      <ProductVisual product={product} />
      <div className="grow">
        <strong>{product.name}</strong>
        <span>{formatYen(product.price)}</span>
        <span>在庫: {product.stock ?? "-"}</span>
        <div className="product-statuses">
          <span className={`status ${product.active ? "active" : ""}`}>
            {product.active ? "表示中" : "非表示"}
          </span>
          <span
            className={`status ${product.isSoldOut ? "sold-out" : "active"}`}
          >
            {product.isSoldOut ? "売り切れ" : "販売中"}
          </span>
        </div>
      </div>
      <div className="management-actions">
        <button
          className="sold-out-action"
          onClick={onToggleSoldOut}
          aria-label={`${product.name}を${product.isSoldOut ? "販売再開" : "売り切れにする"}`}
        >
          <RotateCcw />
          {product.isSoldOut ? "販売再開" : "売り切れ"}
        </button>
        <button
          className="visibility-action"
          onClick={onToggleActive}
          aria-label={`${product.name}を${product.active ? "非表示にする" : "表示する"}`}
        >
          {product.active ? "非表示にする" : "表示する"}
        </button>
        <button
          className="icon-button"
          aria-label={`${product.name}を上へ移動`}
          onClick={() => onMove(-1)}
          disabled={first}
        >
          <ArrowUp />
        </button>
        <button
          className="icon-button"
          aria-label={`${product.name}を下へ移動`}
          onClick={() => onMove(1)}
          disabled={last}
        >
          <ArrowDown />
        </button>
        <button
          className="icon-button"
          aria-label={`${product.name}を編集`}
          onClick={onEdit}
        >
          <Pencil />
        </button>
        <button
          className="icon-button danger-text"
          aria-label={`${product.name}を削除`}
          onClick={onDelete}
        >
          <Trash2 />
        </button>
      </div>
    </article>
  );
}

export function ProductsPage() {
  const products = useLiveQuery(
    () => db.products.orderBy("sortOrder").toArray(),
    [],
    [],
  );
  const [optimisticOrder, setOptimisticOrder] = useState<string[] | null>(null);
  const orderedProducts = optimisticOrder
    ? [
        ...optimisticOrder.flatMap((id) => {
          const product = products.find((candidate) => candidate.id === id);
          return product ? [product] : [];
        }),
        ...products.filter((product) => !optimisticOrder.includes(product.id)),
      ]
    : products;
  const settings = useLiveQuery(() => db.settings.get("app"));
  const [editing, setEditing] = useState<Product | null | "new">(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [soundEnabledOverride, setSoundEnabledOverride] = useState<
    boolean | null
  >(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function openForm(product?: Product) {
    setError("");
    if (product) {
      setEditing(product);
      setForm({
        name: product.name,
        price: String(product.price),
        stock: product.stock === undefined ? "" : String(product.stock),
        presetIcon: product.presetIcon,
        active: product.active,
        imageData: product.imageData,
      });
    } else {
      setEditing("new");
      setForm({ ...emptyForm });
    }
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    const price = Number(form.price);
    const stock = form.stock === "" ? undefined : Number(form.stock);
    if (!form.name.trim()) return setError("商品名を入力してください。");
    if (!Number.isSafeInteger(price) || price < 0)
      return setError("価格は0円以上の整数で入力してください。");
    if (stock !== undefined && (!Number.isSafeInteger(stock) || stock < 0))
      return setError("在庫は0以上の整数で入力するか、空欄にしてください。");
    try {
      const now = new Date().toISOString();
      const original = editing !== "new" ? editing : null;
      const product: Product = {
        id: original?.id ?? crypto.randomUUID(),
        name: form.name.trim(),
        price,
        sortOrder: original?.sortOrder ?? 0,
        presetIcon: form.presetIcon,
        active: form.active,
        isSoldOut: stock === 0 ? true : (original?.isSoldOut ?? false),
        stock,
        imageData: form.imageData,
        createdAt: original?.createdAt ?? now,
        updatedAt: now,
      };
      if (original) await db.products.put(product);
      else await addProductAtStart(product);
      setEditing(null);
    } catch {
      setError(
        "商品を保存できませんでした。端末の空き容量を確認してください。",
      );
    }
  }

  async function handleImage(file?: File) {
    if (!file) return;
    setError("");
    try {
      const imageData = await compressImage(file);
      setForm((current) => ({ ...current, imageData }));
    } catch {
      setError("画像を読み込めませんでした。別の画像を選択してください。");
    }
  }

  async function deleteProduct() {
    if (!deleting) return;
    await db.products.delete(deleting.id);
    setDeleting(null);
  }

  async function updateSoundEnabled(enabled: boolean) {
    setSoundEnabledOverride(enabled);
    try {
      await setSoundEnabled(enabled);
    } catch {
      setError("効果音の設定を保存できませんでした。");
      setSoundEnabledOverride(null);
    }
  }

  async function persistOrder(nextProducts: Product[]) {
    setOptimisticOrder(nextProducts.map((product) => product.id));
    try {
      await saveProductOrder(nextProducts);
    } catch {
      setOptimisticOrder(null);
      setError("商品の並び順を保存できませんでした。");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : activeId;
    if (activeId === overId) return;
    void persistOrder(reorderProducts(orderedProducts, activeId, overId));
  }

  function moveProduct(productId: string, direction: -1 | 1) {
    const index = orderedProducts.findIndex(
      (product) => product.id === productId,
    );
    const target = orderedProducts[index + direction];
    if (!target) return;
    void persistOrder(reorderProducts(orderedProducts, productId, target.id));
  }

  async function toggleSoldOut(product: Product) {
    try {
      await setProductSoldOut(product, !product.isSoldOut);
    } catch {
      setError("売り切れ状態を保存できませんでした。");
    }
  }

  async function toggleActive(product: Product) {
    try {
      await setProductActive(product, !product.active);
    } catch {
      setError("表示状態を保存できませんでした。");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">CATALOG</p>
          <h1>商品</h1>
        </div>
        <button className="primary compact" onClick={() => openForm()}>
          <Plus />
          新規
        </button>
      </header>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <p className="reorder-help">
        ハンドルを長押しして並び替えできます。矢印ボタンでも移動できます。
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedProducts.map((product) => product.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="management-list">
            {orderedProducts.map((product, index) => (
              <SortableProductRow
                key={product.id}
                product={product}
                first={index === 0}
                last={index === orderedProducts.length - 1}
                onEdit={() => openForm(product)}
                onDelete={() => setDeleting(product)}
                onToggleSoldOut={() => void toggleSoldOut(product)}
                onToggleActive={() => void toggleActive(product)}
                onMove={(direction) => moveProduct(product.id, direction)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <section className="settings-section">
        <h2 className="section-title">設定</h2>
        <label className="settings-row">
          <span>
            <strong>効果音</strong>
            <small>商品追加と会計完了を音で知らせます</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={soundEnabledOverride ?? settings?.soundEnabled ?? true}
            onChange={(event) => void updateSoundEnabled(event.target.checked)}
          />
        </label>
      </section>

      <section className="backup-section">
        <h2 className="section-title">データ管理</h2>
        <BackupPanel />
      </section>

      <section className="info-section">
        <h2 className="section-title">アプリ</h2>
        <Link className="settings-link" to="/about">
          <Info />
          <span>
            <strong>アプリ情報とサポート</strong>
            <small>使い方、プライバシー、問い合わせ先</small>
          </span>
        </Link>
      </section>

      {editing && (
        <div className="sheet-backdrop">
          <form className="sheet" onSubmit={saveProduct}>
            <div className="sheet-header">
              <h2>{editing === "new" ? "商品を登録" : "商品を編集"}</h2>
              <button
                type="button"
                className="secondary compact"
                onClick={() => setEditing(null)}
              >
                閉じる
              </button>
            </div>
            <label>
              商品名<span className="required">必須</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              価格（円）
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label>
              在庫（空欄の場合は「-」）
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </label>
            <fieldset>
              <legend>プリセットアイコン</legend>
              <div className="icon-options">
                {presetIcons.map((icon) => (
                  <label key={icon}>
                    <input
                      type="radio"
                      name="icon"
                      checked={form.presetIcon === icon}
                      onChange={() =>
                        setForm({
                          ...form,
                          presetIcon: icon,
                          imageData: undefined,
                        })
                      }
                    />
                    {iconLabels[icon]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="file-button">
              <Upload />
              写真を選ぶ
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImage(e.target.files?.[0])}
              />
            </label>
            {form.imageData && (
              <div className="image-preview">
                <img src={form.imageData} alt="選択した商品画像" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageData: undefined })}
                >
                  画像を外す
                </button>
              </div>
            )}
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              販売中として表示
            </label>
            <button className="primary large" type="submit">
              <Download />
              保存する
            </button>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="商品を削除しますか？"
        confirmLabel="削除する"
        danger
        onConfirm={deleteProduct}
        onCancel={() => setDeleting(null)}
      >
        <p>「{deleting?.name}」を削除します。過去の会計履歴は保持されます。</p>
      </ConfirmDialog>
    </div>
  );
}
