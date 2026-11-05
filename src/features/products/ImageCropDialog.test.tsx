import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImageCropDialog } from "./ImageCropDialog";

function loadPreview() {
  const image = screen.getByRole("img", { name: "切り抜き前の商品画像" });
  Object.defineProperties(image, {
    naturalWidth: { value: 1200 },
    naturalHeight: { value: 800 },
  });
  fireEvent.load(image);
}

describe("ImageCropDialog", () => {
  it("画像処理に失敗しても再試行できる", async () => {
    const user = userEvent.setup();
    const onApply = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce(undefined);
    render(
      <ImageCropDialog
        previewUrl="test"
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );
    loadPreview();
    await user.click(screen.getByRole("button", { name: "この位置で使う" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "この位置で使う" });
    expect(retry).toBeEnabled();
    await user.click(retry);
    expect(onApply).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("処理中は位置変更・リセット・キャンセルを無効にする", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn(() => new Promise<void>(() => {}));
    render(
      <ImageCropDialog
        previewUrl="test"
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );
    loadPreview();
    await user.click(screen.getByRole("button", { name: "この位置で使う" }));
    for (const slider of screen.getAllByRole("slider"))
      expect(slider).toBeDisabled();
    expect(screen.getByRole("button", { name: "中央に戻す" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
    fireEvent.keyDown(
      screen.getByLabelText("画像の切り抜き位置。ドラッグまたは方向キーで調整"),
      { key: "ArrowRight" },
    );
    expect(screen.getByRole("slider", { name: "画像の左右位置" })).toHaveValue(
      "0",
    );
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("画像の読み込み失敗時は確定できない", async () => {
    render(
      <ImageCropDialog
        previewUrl="test"
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    loadPreview();
    fireEvent.error(screen.getByRole("img", { name: "切り抜き前の商品画像" }));
    expect(
      screen.getByRole("button", { name: "この位置で使う" }),
    ).toBeDisabled();
  });

  it("拡大率と位置を指定して画像へ適用する", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn().mockResolvedValue(undefined);
    render(
      <ImageCropDialog
        previewUrl="data:image/png;base64,test"
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );

    loadPreview();
    fireEvent.change(screen.getByRole("slider", { name: "画像の拡大率" }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "画像の左右位置" }), {
      target: { value: "0.25" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "画像の上下位置" }), {
      target: { value: "-0.4" },
    });
    await user.click(screen.getByRole("button", { name: "この位置で使う" }));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        zoom: 2,
        panX: 0.25,
        panY: -0.4,
      }),
    );
  });

  it("方向キーで位置を調整し、中央へ戻せる", async () => {
    const user = userEvent.setup();
    render(
      <ImageCropDialog
        previewUrl="data:image/png;base64,test"
        onApply={vi.fn().mockResolvedValue(undefined)}
        onCancel={vi.fn()}
      />,
    );

    loadPreview();
    const stage = screen.getByLabelText(
      "画像の切り抜き位置。ドラッグまたは方向キーで調整",
    );
    stage.focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(screen.getByRole("slider", { name: "画像の左右位置" })).toHaveValue(
      "0.05",
    );
    expect(screen.getByRole("slider", { name: "画像の上下位置" })).toHaveValue(
      "0.05",
    );

    await user.click(screen.getByRole("button", { name: "中央に戻す" }));
    expect(screen.getByRole("slider", { name: "画像の拡大率" })).toHaveValue(
      "1",
    );
    expect(screen.getByRole("slider", { name: "画像の左右位置" })).toHaveValue(
      "0",
    );
    expect(screen.getByRole("slider", { name: "画像の上下位置" })).toHaveValue(
      "0",
    );
  });
});
