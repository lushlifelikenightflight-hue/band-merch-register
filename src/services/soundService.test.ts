import { beforeAll, describe, expect, it, vi } from "vitest";

const play = vi.fn(() => Promise.reject(new Error("blocked")));

class MockAudio {
  currentTime = 5;
  paused = true;
  ended = false;
  preload = "";
  volume = 1;
  readonly src: string;
  readonly play = play;

  constructor(src: string) {
    this.src = src;
  }
}

beforeAll(() => {
  vi.stubGlobal("Audio", MockAudio);
});

describe("効果音サービス", () => {
  it("base path付きURL、音量、巻き戻しを設定して失敗を握りつぶす", async () => {
    const { getSoundUrl, playSoundEffect, SOUND_VOLUME } =
      await import("./soundService");
    expect(getSoundUrl("addItem")).toContain("sounds/01_additem.mp3");
    expect(SOUND_VOLUME.addItem).toBe(0.3);
    expect(() => playSoundEffect("addItem", true)).not.toThrow();
    await Promise.resolve();
    expect(play).toHaveBeenCalledOnce();
  });

  it("無効時は再生しない", async () => {
    const { playSoundEffect } = await import("./soundService");
    play.mockClear();
    playSoundEffect("checkoutComplete", false);
    expect(play).not.toHaveBeenCalled();
  });
});
