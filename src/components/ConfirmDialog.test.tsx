import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("確認ダイアログ", () => {
  it("内容を表示して確定操作を通知する", async () => {
    const confirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="削除しますか？"
        onConfirm={confirm}
        onCancel={() => undefined}
      >
        <p>確認内容</p>
      </ConfirmDialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "確定する" }));
    expect(confirm).toHaveBeenCalledOnce();
  });
});
