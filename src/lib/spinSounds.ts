/**
 * The daily spin wheel's recorded sounds: a wooden click for the pointer, a soft push of air at the
 * start, and a bell phrase for each prize tier. The files are rendered by scripts/make_spin_sounds.py.
 * They are fetched the first time the wheel opens; until they are ready (or if decoding fails) the
 * callers fall back to the simple synthesised versions in soundGenerator.ts.
 */
import tick1 from "@/assets/sounds/spin/tick-1.wav";
import tick2 from "@/assets/sounds/spin/tick-2.wav";
import tick3 from "@/assets/sounds/spin/tick-3.wav";
import start from "@/assets/sounds/spin/start.mp3";
import winCommon from "@/assets/sounds/spin/win-common.mp3";
import winUncommon from "@/assets/sounds/spin/win-uncommon.mp3";
import winRare from "@/assets/sounds/spin/win-rare.mp3";
import winVeryRare from "@/assets/sounds/spin/win-very-rare.mp3";
import { getAudioContext, type SpinRarity } from "@/lib/soundGenerator";

const FILES = {
  tick1, tick2, tick3, start,
  common: winCommon, uncommon: winUncommon, rare: winRare, very_rare: winVeryRare,
} as const;
type SpinSound = keyof typeof FILES;

const buffers = new Map<SpinSound, AudioBuffer>();
let loading: Promise<void> | null = null;

/** Fetch and decode every wheel sound once. Safe to call again; safe to call before the first tap. */
export function preloadSpinSounds(): Promise<void> {
  if (loading) return loading;
  const ctx = getAudioContext();
  if (!ctx || typeof fetch !== "function") return Promise.resolve();
  loading = Promise.all((Object.keys(FILES) as SpinSound[]).map(async name => {
    try {
      const data = await (await fetch(FILES[name])).arrayBuffer();
      buffers.set(name, await ctx.decodeAudioData(data));
    } catch {
      // One missing sound must not break the wheel; that sound falls back to the synthesised version.
    }
  })).then(() => undefined);
  return loading;
}

function play(name: SpinSound, gain: number, rate = 1, pan = 0): boolean {
  const ctx = getAudioContext();
  const buffer = buffers.get(name);
  if (!ctx || !buffer) return false;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const volume = ctx.createGain();
  volume.gain.value = gain;
  source.connect(volume);
  if (pan !== 0 && typeof ctx.createStereoPanner === "function") {
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    volume.connect(panner);
    panner.connect(ctx.destination);
  } else {
    volume.connect(ctx.destination);
  }
  source.start();
  return true;
}

/** How one click should be played for a wheel that is `pace` of the way to stopped (0 fast, 1 nearly still).
 *  Slower clicks are a little louder and lower, so the last few land with weight. Exported for the test. */
export function tickShape(pace: number, variation = 0) {
  const p = Math.min(1, Math.max(0, pace));
  return { gain: 0.2 + 0.2 * p, rate: 1.04 - 0.1 * p + 0.03 * (variation - 0.5) };
}

let lastTick = -Infinity;
let tickTurn = 0;
/** One pointer click. Returns false when the recording is not ready, so the caller can fall back. */
export function playSpinTickSample(pace: number): boolean {
  if (!buffers.has("tick1")) return false;
  const now = performance.now();
  if (now - lastTick < 50) return true; // at full speed the clicks would smear into a buzz
  lastTick = now;
  tickTurn = (tickTurn + 1 + Math.floor(Math.random() * 2)) % 3; // never the same click twice in a row
  const { gain, rate } = tickShape(pace, Math.random());
  return play((["tick1", "tick2", "tick3"] as const)[tickTurn], gain, rate, (Math.random() - 0.5) * 0.3);
}

export function playSpinStartSample(): boolean {
  return play("start", 0.5);
}

export function playSpinWinSample(rarity: SpinRarity): boolean {
  return play(rarity, 0.6);
}
