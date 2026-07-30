import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { seedDatabase } from "./db/database";
import "./styles/global.css";

async function start() {
  let startupError = "";
  try {
    await seedDatabase();
  } catch {
    startupError =
      "保存データを開けませんでした。Safariの設定と空き容量を確認してください。";
  }

  const root = document.getElementById("root");
  if (!root) throw new Error("Root element is missing");
  createRoot(root).render(
    <StrictMode>
      {startupError ? (
        <p className="startup-error" role="alert">
          {startupError}
        </p>
      ) : (
        <BrowserRouter
          basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}
        >
          <App />
        </BrowserRouter>
      )}
    </StrictMode>,
  );
}

void start();
