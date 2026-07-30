import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { History, Package, RefreshCw, ShoppingCart } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { CheckoutPage } from "./features/checkout/CheckoutPage";
import { ProductsPage } from "./features/products/ProductsPage";
import { SalesPage } from "./features/sales/SalesPage";

export function App() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      // The app remains usable; a human-readable retry notice is shown below.
    },
  });

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
    </div>
  );
}
