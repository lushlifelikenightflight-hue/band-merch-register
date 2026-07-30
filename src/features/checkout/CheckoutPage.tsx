import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import { db } from "../../db/database";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ProductVisual } from "../../components/ProductVisual";
import { formatYen, parseYen } from "../../utils/money";
import { playSoundEffect } from "../../services/soundService";
import type { Product } from "../../types/models";
import {
  addYen,
  buildSaleItems,
  calculatePayment,
  calculateTotal,
  changeQuantity,
  type Quantities,
} from "./checkoutLogic";

export function CheckoutPage() {
  const products = useLiveQuery(
    async () =>
      (await db.products.orderBy("sortOrder").toArray()).filter(
        (product) => product.active,
      ),
    [],
    [],
  );
  const settings = useLiveQuery(() => db.settings.get("app"));
  const [quantities, setQuantities] = useState<Quantities>({});
  const [quantityRevisions, setQuantityRevisions] = useState<
    Record<string, string>
  >({});
  const [receivedText, setReceivedText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const effectiveQuantities = useMemo(
    () =>
      Object.fromEntries(
        products.map((product) => [
          product.id,
          !product.isSoldOut &&
          quantityRevisions[product.id] === product.updatedAt
            ? (quantities[product.id] ?? 0)
            : 0,
        ]),
      ),
    [products, quantities, quantityRevisions],
  );
  const items = useMemo(
    () => buildSaleItems(products, effectiveQuantities),
    [products, effectiveQuantities],
  );
  const total = calculateTotal(items);
  const received = parseYen(receivedText) ?? 0;
  const payment = calculatePayment(total, received);

  function setQuantity(product: Product, delta: number) {
    if (delta > 0 && product.isSoldOut) return;
    const currentQuantity = effectiveQuantities[product.id] ?? 0;
    setQuantities((current) => ({
      ...current,
      [product.id]: changeQuantity(currentQuantity, delta),
    }));
    setQuantityRevisions((current) => ({
      ...current,
      [product.id]: product.updatedAt,
    }));
  }

  function addItem(product: Product) {
    if (product.isSoldOut) return;
    setQuantity(product, 1);
    playSoundEffect("addItem", settings?.soundEnabled ?? true);
  }

  function handleReceived(value: string) {
    if (/^\d*$/.test(value) && parseYen(value) !== null) {
      setReceivedText(value);
      setError("");
    } else {
      setError("預かり金は0以上の整数で入力してください。");
    }
  }

  function addReceived(amount: number) {
    const next = addYen(parseYen(receivedText) ?? 0, amount);
    if (next === null) {
      setError("預かり金が大きすぎます。消去して入力し直してください。");
      return;
    }
    setReceivedText(String(next));
    setError("");
  }

  async function completeSale() {
    try {
      const id = crypto.randomUUID();
      await db.sales.add({
        id,
        soldAt: new Date().toISOString(),
        items,
        total,
        received,
        change: payment.change,
      });
      setQuantities({});
      setQuantityRevisions({});
      setReceivedText("");
      setLastSaleId(id);
      setNotice("会計を保存しました。");
      setConfirming(false);
      playSoundEffect("checkoutComplete", settings?.soundEnabled ?? true);
    } catch {
      setError(
        "会計を保存できませんでした。端末の空き容量を確認してください。",
      );
    }
  }

  async function undoLastSale() {
    if (!lastSaleId) return;
    try {
      await db.sales.delete(lastSaleId);
      setLastSaleId(null);
      setNotice("直前の会計を取り消しました。");
      setUndoing(false);
    } catch {
      setError("会計の取り消しに失敗しました。");
    }
  }

  return (
    <div className="page checkout-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">BAND MERCH</p>
          <h1>会計</h1>
        </div>
      </header>
      {notice && (
        <div className="notice success" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>{notice}</span>
          {lastSaleId && (
            <button className="link-button" onClick={() => setUndoing(true)}>
              直前の会計を取り消す
            </button>
          )}
        </div>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      <section aria-labelledby="products-heading">
        <h2 id="products-heading" className="section-title">
          商品を選択
        </h2>
        <div className="product-grid">
          {products.map((product) => {
            const quantity = effectiveQuantities[product.id] ?? 0;
            return (
              <article
                className={`product-card ${quantity ? "selected" : ""} ${
                  product.isSoldOut ? "sold-out" : ""
                }`}
                key={product.id}
              >
                <button
                  className="product-card-main"
                  onClick={() => addItem(product)}
                  aria-label={`${product.name}を1点追加`}
                  disabled={product.isSoldOut}
                >
                  <ProductVisual product={product} />
                  <strong>{product.name}</strong>
                  <span className="product-price">
                    {formatYen(product.price)}
                  </span>
                  {product.isSoldOut && (
                    <span className="sold-out-badge">売り切れ</span>
                  )}
                </button>
                <div className="quantity-controls">
                  <button
                    onClick={() => setQuantity(product, -1)}
                    aria-label={`${product.name}を1点減らす`}
                    disabled={quantity === 0}
                  >
                    <Minus />
                  </button>
                  <output aria-label={`${product.name}の数量`}>
                    {quantity}
                  </output>
                  <button
                    onClick={() => addItem(product)}
                    aria-label={`${product.name}を1点増やす`}
                    disabled={product.isSoldOut}
                  >
                    <Plus />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="order-panel" aria-labelledby="order-heading">
        <h2 id="order-heading" className="section-title">
          注文内容
        </h2>
        {items.length === 0 ? (
          <p className="empty">商品をタップして追加してください</p>
        ) : (
          <ul className="order-list">
            {items.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.productName}
                  <small>
                    {formatYen(item.unitPrice)} × {item.quantity}
                  </small>
                </span>
                <strong>{formatYen(item.subtotal)}</strong>
              </li>
            ))}
          </ul>
        )}
        <div className="total-row">
          <span>合計</span>
          <strong>{formatYen(total)}</strong>
        </div>
      </section>

      <section className="payment-panel" aria-labelledby="payment-heading">
        <h2 id="payment-heading" className="section-title">
          預かり金
        </h2>
        <div className="received-input">
          <span>¥</span>
          <input
            aria-label="預かり金"
            inputMode="numeric"
            pattern="[0-9]*"
            value={receivedText}
            onChange={(event) => handleReceived(event.target.value)}
            placeholder="0"
          />
          <button
            className="icon-button"
            aria-label="預かり金を消去"
            onClick={() => setReceivedText("")}
          >
            <Trash2 />
          </button>
        </div>
        <div className="quick-amounts">
          {[100, 500, 1000, 5000, 10000].map((amount) => (
            <button key={amount} onClick={() => addReceived(amount)}>
              {amount.toLocaleString()}円
            </button>
          ))}
          <button
            onClick={() => setReceivedText(String(total))}
            disabled={total === 0}
          >
            ちょうど
          </button>
        </div>
        {total > 0 && (
          <div
            className={`change-display ${payment.shortage ? "shortage" : "ready"}`}
            aria-live="polite"
          >
            <span>{payment.shortage ? "不足" : "お釣り"}</span>
            <strong>
              {payment.shortage
                ? `あと ${formatYen(payment.shortage)}`
                : formatYen(payment.change)}
            </strong>
          </div>
        )}
      </section>

      <div className="checkout-action">
        <button
          className="primary large"
          disabled={!payment.canComplete}
          onClick={() => setConfirming(true)}
        >
          会計完了
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="会計を完了しますか？"
        confirmLabel="会計を保存"
        onConfirm={completeSale}
        onCancel={() => setConfirming(false)}
      >
        <dl className="confirm-summary">
          <div>
            <dt>合計</dt>
            <dd>{formatYen(total)}</dd>
          </div>
          <div>
            <dt>預かり</dt>
            <dd>{formatYen(received)}</dd>
          </div>
          <div>
            <dt>お釣り</dt>
            <dd>{formatYen(payment.change)}</dd>
          </div>
        </dl>
      </ConfirmDialog>
      <ConfirmDialog
        open={undoing}
        title="直前の会計を取り消しますか？"
        confirmLabel="取り消す"
        danger
        onConfirm={undoLastSale}
        onCancel={() => setUndoing(false)}
      >
        <p>保存した直前の会計履歴を削除します。</p>
      </ConfirmDialog>
    </div>
  );
}
