import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, Trash2 } from "lucide-react";
import { db } from "../../db/database";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { formatYen } from "../../utils/money";
import type { Sale } from "../../types/models";
import { groupSalesByLocalDay, localDayKey } from "./salesLogic";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDay(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function SalesPage() {
  const sales = useLiveQuery(
    () => db.sales.orderBy("soldAt").reverse().toArray(),
    [],
    [],
  );
  const groups = groupSalesByLocalDay(sales);
  const [expandedDays, setExpandedDays] = useState(
    () => new Set([localDayKey(new Date())]),
  );
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Sale | "all" | null>(null);

  function toggleDay(key: string) {
    setExpandedDays((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function deleteSales() {
    if (deleting === "all") await db.sales.clear();
    else if (deleting) await db.sales.delete(deleting.id);
    setDeleting(null);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">SALES LOG</p>
          <h1>履歴</h1>
        </div>
      </header>

      <div className="history-heading">
        <h2 className="section-title">日別売上</h2>
        {sales.length > 0 && (
          <button
            className="danger-text compact"
            onClick={() => setDeleting("all")}
          >
            <Trash2 />
            全履歴削除
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="empty-card">会計履歴はまだありません。</p>
      ) : (
        <div className="daily-groups">
          {groups.map((group) => {
            const isOpen = expandedDays.has(group.key);
            return (
              <section className="daily-group" key={group.key}>
                <button
                  className="daily-group-header"
                  onClick={() => toggleDay(group.key)}
                  aria-expanded={isOpen}
                >
                  <span>
                    <strong>{formatDay(group.date)}</strong>
                    <small>
                      {group.saleCount}会計 · {group.itemCount}点
                    </small>
                  </span>
                  <span className="daily-total">{formatYen(group.total)}</span>
                  <ChevronDown className={isOpen ? "rotated" : ""} />
                </button>

                {isOpen && (
                  <div className="daily-content">
                    <div className="daily-stats">
                      <span>
                        売上<strong>{formatYen(group.total)}</strong>
                      </span>
                      <span>
                        会計<strong>{group.saleCount}件</strong>
                      </span>
                      <span>
                        販売<strong>{group.itemCount}点</strong>
                      </span>
                    </div>
                    <ul className="daily-product-counts">
                      {group.products.map((product) => (
                        <li key={product.key}>
                          <span>{product.productName}</span>
                          <strong>{product.quantity}点</strong>
                        </li>
                      ))}
                    </ul>

                    <div className="history-list">
                      {group.sales.map((sale) => {
                        const count = sale.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        );
                        const saleOpen = expandedSale === sale.id;
                        return (
                          <article className="history-card" key={sale.id}>
                            <button
                              className="history-main"
                              onClick={() =>
                                setExpandedSale(saleOpen ? null : sale.id)
                              }
                              aria-expanded={saleOpen}
                            >
                              <span>
                                <strong>{formatYen(sale.total)}</strong>
                                <small>
                                  {formatDateTime(sale.soldAt)} · {count}点
                                </small>
                              </span>
                              <span className="history-payment">
                                <small>預かり {formatYen(sale.received)}</small>
                                <small>お釣り {formatYen(sale.change)}</small>
                              </span>
                              <ChevronDown
                                className={saleOpen ? "rotated" : ""}
                              />
                            </button>
                            {saleOpen && (
                              <div className="history-detail">
                                <ul>
                                  {sale.items.map((item) => (
                                    <li
                                      key={`${item.productId}-${item.productName}`}
                                    >
                                      <span>
                                        {item.productName}
                                        <small>
                                          {formatYen(item.unitPrice)} ×{" "}
                                          {item.quantity}
                                        </small>
                                      </span>
                                      <strong>
                                        {formatYen(item.subtotal)}
                                      </strong>
                                    </li>
                                  ))}
                                </ul>
                                <button
                                  className="danger-text"
                                  onClick={() => setDeleting(sale)}
                                >
                                  <Trash2 />
                                  この履歴を削除
                                </button>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={
          deleting === "all" ? "全履歴を削除しますか？" : "履歴を削除しますか？"
        }
        confirmLabel={deleting === "all" ? "すべて完全に削除" : "削除する"}
        danger
        onConfirm={deleteSales}
        onCancel={() => setDeleting(null)}
      >
        <p>
          {deleting === "all"
            ? "すべての会計履歴が消えます。この操作は取り消せません。必要なら先にバックアップしてください。"
            : "この会計履歴を削除します。日別集計も自動で更新されます。"}
        </p>
      </ConfirmDialog>
    </div>
  );
}
