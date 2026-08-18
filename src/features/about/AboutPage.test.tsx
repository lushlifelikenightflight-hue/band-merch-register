import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AboutPage } from "./AboutPage";
import { LegalDocumentPage } from "./LegalDocumentPage";

describe("アプリ情報", () => {
  it("プライバシーとサポートをアプリ内ルートで開く", () => {
    render(
      <MemoryRouter>
        <AboutPage onShowGuide={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /プライバシーポリシー/ }),
    ).toHaveAttribute("href", "/about/privacy");
    expect(screen.getByRole("link", { name: /サポート・FAQ/ })).toHaveAttribute(
      "href",
      "/about/support",
    );
  });

  it("同梱したオフライン文書と戻る導線を表示する", () => {
    render(
      <MemoryRouter>
        <LegalDocumentPage document="privacy" title="プライバシーポリシー" />
      </MemoryRouter>,
    );

    expect(screen.getByTitle("プライバシーポリシー")).toHaveAttribute(
      "src",
      "/privacy.html",
    );
    expect(screen.getByRole("link", { name: /戻る/ })).toHaveAttribute(
      "href",
      "/about",
    );
  });
});
