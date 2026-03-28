/**
 * Programmatic sound synthesis via Web Audio API.
 * No external audio files needed — all sounds are generated with oscillators + gain envelopes.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx || ctx.state === "closed") {
      ctx = new AudioContext();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function playNote(
  audioCtx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.12,
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;

  const t = audioCtx.currentTime + startOffset;
  // ADSR-ish envelope
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01); // attack 10ms
  gain.gain.linearRampToValueAtTime(volume * 0.7, t + 0.01 + Math.min(duration * 0.3, 0.1)); // decay
  gain.gain.linearRampToValueAtTime(volume * 0.5, t + duration - 0.05); // sustain
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // release

  osc.start(t);
  osc.stop(t + duration);
}

/** Two-note ascending chime C5→E5, 500ms */
export function playMatchSound() {
  const c = getCtx();
  if (!c) return;
  playNote(c, 523.25, 0, 0.25, "sine", 0.15);
  playNote(c, 659.25, 0.15, 0.35, "sine", 0.15);
}

/** Single soft ping G4, 200ms */
export function playMessageSound() {
  const c = getCtx();
  if (!c) return;
  playNote(c, 392.0, 0, 0.2, "triangle", 0.08);
}

/** Three-note ascending C4→E4→G4, 600ms */
export function playBadgeUnlockSound() {
  const c = getCtx();
  if (!c) return;
  playNote(c, 261.63, 0, 0.2, "sine", 0.12);
  playNote(c, 329.63, 0.15, 0.2, "sine", 0.12);
  playNote(c, 392.0, 0.3, 0.3, "sine", 0.14);
}

/** Whoosh + sparkle, 300ms */
export function playThotSound() {
  const c = getCtx();
  if (!c) return;
  // Quick ascending sweep for "whoosh"
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "sine";
  const t = c.currentTime;
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.start(t);
  osc.stop(t + 0.3);

  // Sparkle overtone
  playNote(c, 1318.5, 0.1, 0.15, "sine", 0.06);
}

/** Fanfare arpeggio C4→E4→G4→C5, 800ms */
export function playStreakMilestoneSound() {
  const c = getCtx();
  if (!c) return;
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, i) => {
    playNote(c, freq, i * 0.12, 0.25, "sine", 0.13);
  });
}

/** Very subtle soft click, 50ms */
export function playButtonTapSound() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = "triangle";
  osc.frequency.value = 800;
  const t = c.currentTime;
  gain.gain.setValueAtTime(0.04, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.start(t);
  osc.stop(t + 0.05);
}

/** Celebration sound used by CelebrationModal — C5, E5, G5, C6 arpeggio */
export function playCelebrationSound() {
  const c = getCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    playNote(c, freq, i * 0.1, 0.3, "sine", 0.15);
  });
}
