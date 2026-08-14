export type SoundEffect = "addItem" | "checkoutComplete";

interface Tone {
  frequency: number;
  duration: number;
  volume: number;
}

export const SOUND_PATTERNS = {
  addItem: [{ frequency: 660, duration: 0.06, volume: 0.09 }],
  checkoutComplete: [
    { frequency: 523.25, duration: 0.09, volume: 0.1 },
    { frequency: 659.25, duration: 0.12, volume: 0.11 },
  ],
} as const satisfies Record<SoundEffect, readonly Tone[]>;

type AudioContextConstructor = new () => AudioContext;
type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };

let audioContext: AudioContext | undefined;

function getAudioContext(): AudioContext {
  if (audioContext) return audioContext;
  const audioWindow = window as AudioWindow;
  const Context = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!Context) throw new Error("WEB_AUDIO_UNAVAILABLE");
  audioContext = new Context();
  return audioContext;
}

function playPattern(context: AudioContext, effect: SoundEffect): void {
  let startAt = context.currentTime;

  for (const tone of SOUND_PATTERNS[effect]) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const endAt = startAt + tone.duration;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(tone.volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt);
    startAt = endAt + 0.025;
  }
}

export function playSoundEffect(
  effect: SoundEffect,
  soundEnabled: boolean,
): void {
  if (!soundEnabled) return;

  try {
    const context = getAudioContext();
    if (context.state === "suspended") {
      void context
        .resume()
        .then(() => playPattern(context, effect))
        .catch(() => {
          // Sound is optional feedback. Playback restrictions must not block a sale.
        });
      return;
    }
    playPattern(context, effect);
  } catch {
    // Web Audio can be unavailable in restricted environments; core actions continue.
  }
}
