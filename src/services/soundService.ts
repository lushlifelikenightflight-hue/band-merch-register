export type SoundEffect = "addItem" | "checkoutComplete";

const SOUND_PATHS = {
  addItem: "sounds/01_additem.mp3",
  checkoutComplete: "sounds/02_merchandise.mp3",
} as const satisfies Record<SoundEffect, string>;

export const SOUND_VOLUME = {
  addItem: 0.3,
  checkoutComplete: 0.4,
} as const satisfies Record<SoundEffect, number>;

const POOL_SIZE: Record<SoundEffect, number> = {
  addItem: 3,
  checkoutComplete: 1,
};

const pools = new Map<SoundEffect, HTMLAudioElement[]>();
const nextIndexes: Record<SoundEffect, number> = {
  addItem: 0,
  checkoutComplete: 0,
};

export function getSoundUrl(effect: SoundEffect): string {
  return `${import.meta.env.BASE_URL}${SOUND_PATHS[effect]}`;
}

function getPool(effect: SoundEffect): HTMLAudioElement[] {
  const existing = pools.get(effect);
  if (existing) return existing;

  const pool = Array.from({ length: POOL_SIZE[effect] }, () => {
    const audio = new Audio(getSoundUrl(effect));
    audio.preload = "auto";
    audio.volume = SOUND_VOLUME[effect];
    return audio;
  });
  pools.set(effect, pool);
  return pool;
}

export function playSoundEffect(
  effect: SoundEffect,
  soundEnabled: boolean,
): void {
  if (!soundEnabled) return;

  try {
    const pool = getPool(effect);
    const availableIndex = pool.findIndex(
      (audio) => audio.paused || audio.ended,
    );
    const index =
      availableIndex >= 0 ? availableIndex : nextIndexes[effect] % pool.length;
    nextIndexes[effect] = (index + 1) % pool.length;

    const audio = pool[index];
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Sound is optional feedback. Playback restrictions must not block the sale.
    });
  } catch {
    // Audio construction can fail in restricted browsers; core actions continue.
  }
}
