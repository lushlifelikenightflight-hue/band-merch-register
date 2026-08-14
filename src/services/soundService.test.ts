import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const start = vi.fn();
const stop = vi.fn();
const connect = vi.fn();
const setValueAtTime = vi.fn();
const exponentialRampToValueAtTime = vi.fn();
const createOscillator = vi.fn(() => ({
  type: "sine",
  frequency: { setValueAtTime },
  connect,
  start,
  stop,
}));
const createGain = vi.fn(() => ({
  gain: { setValueAtTime, exponentialRampToValueAtTime },
  connect,
}));
const resume = vi.fn(() => Promise.resolve());

class MockAudioContext {
  currentTime = 1;
  state: AudioContextState = "running";
  destination = {} as AudioDestinationNode;
  createOscillator = createOscillator;
  createGain = createGain;
  resume = resume;
}

beforeAll(() => {
  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    value: MockAudioContext,
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("効果音サービス", () => {
  it("外部音源を使わずWeb Audioで商品追加音を生成する", async () => {
    const { playSoundEffect, SOUND_PATTERNS } = await import("./soundService");
    expect(SOUND_PATTERNS.addItem).toHaveLength(1);
    expect(() => playSoundEffect("addItem", true)).not.toThrow();
    expect(createOscillator).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("会計完了音を2音で生成する", async () => {
    const { playSoundEffect } = await import("./soundService");
    playSoundEffect("checkoutComplete", true);
    expect(createOscillator).toHaveBeenCalledTimes(2);
  });

  it("無効時は音を生成しない", async () => {
    const { playSoundEffect } = await import("./soundService");
    playSoundEffect("checkoutComplete", false);
    expect(createOscillator).not.toHaveBeenCalled();
  });
});
