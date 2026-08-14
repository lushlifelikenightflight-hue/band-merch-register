import { useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { History, Package, RefreshCw, ShoppingCart } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { CheckoutPage } from "./features/checkout/CheckoutPage";
import { ProductsPage } from "./features/products/ProductsPage";
import { SalesPage } from "./features/sales/SalesPage";
import { AboutPage } from "./features/about/AboutPage";

const GUIDE_STORAGE_KEY = "store-regilog-guide-dismissed";

function shouldShowGuide(): boolean {
  try {
    return localStorage.getItem(GUIDE_STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

export function App() {
  const [guideOpen, setGuideOpen] = useState(shouldShowGuide);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      // The app remains usable; a human-readable retry notice is shown below.
    },
  });

  function dismissGuide() {
    try {
      localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    } catch {
      // The guide can still be dismissed for this session.
    }
    setGuideOpen(false);
  }

  return (
    <div className="app-shell">
      {needRefresh && (
        <div className="update-banner" role="status">
          <span>新しいバージョンがあります</span>
          <button onClick={() => void updateServiceWorker(true)}>
            <RefreshCw />
            更新する
          </button>
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<CheckoutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route
            path="/about"
            element={<AboutPage onShowGuide={() => setGuideOpen(true)} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <nav className="tab-bar" aria-label="メインナビゲーション">
        <NavLink to="/" end>
          <ShoppingCart />
          <span>会計</span>
        </NavLink>
        <NavLink to="/products">
          <Package />
          <span>商品</span>
        </NavLink>
        <NavLink to="/sales">
          <History />
          <span>履歴</span>
        </NavLink>
      </nav>
      {guideOpen && (
        <div className="guide-backdrop">
          <section
            className="guide-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
          >
            <p className="eyebrow">WELCOME</p>
            <h2 id="guide-title">3ステップで会計を始められます</h2>
            <ol>
              <li>
                <strong>商品を登録</strong>
                <span>「商品」から名前、価格、在庫、画像を設定します。</span>
              </li>
              <li>
                <strong>会計を保存</strong>
                <span>商品を選び、預かり金を入力して会計を確定します。</span>
              </li>
              <li>
                <strong>バックアップ</strong>
                <span>イベント前後にJSONを作成し、端末外へ保存します。</span>
              </li>
            </ol>
            <p className="guide-note">
              データはこの端末内に保存され、外部サーバーへ送信されません。
            </p>
            <button className="primary large" onClick={dismissGuide}>
              はじめる
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
