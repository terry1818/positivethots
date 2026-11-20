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


// Learning sounds are quiet, gesture-gated and deduplicated per sound.
let learningGesture = false;
const lastLearningSound = new Map<string, number>();
if (typeof window !== "undefined") {
  const unlock = () => { learningGesture = true; };
  window.addEventListener("pointerdown", unlock, { once: true, capture: true });
  window.addEventListener("keydown", unlock, { once: true, capture: true });
}
export const learningSoundNotes = {
  nodeTap: [330], cardOpen: [660], lessonStart: [440, 660], cardAdvance: [520],
  correct: [660, 880], miss: [220], nodeComplete: [330, 660, 880],
  trailFill: [330, 440, 550, 660], chestOpen: [880, 1100, 1320, 1540, 1760],
  levelComplete: [523, 659, 784, 1047], lockedTap: [150],
  // Finishing a lesson: a rising five-note major arpeggio that lands on a held top note.
  lessonComplete: [523, 659, 784, 1047, 1319],
} as const;
export function comboExtraNotes(combo: number) { return combo === 3 ? 1 : combo === 5 ? 2 : combo === 10 ? 3 : 0; }
export function playLearningSound(name: keyof typeof learningSoundNotes | "combo", combo = 0) {
  if (!learningGesture) return;
  const now = performance.now();
  if (now - (lastLearningSound.get(name) ?? -Infinity) < 80) return;
  lastLearningSound.set(name, now);
  const c = getCtx(); if (!c) return;
  if (name === "trailFill") {
    const osc = c.createOscillator(), gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.frequency.setValueAtTime(330, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + .4);
    gain.gain.setValueAtTime(.001, c.currentTime);
    gain.gain.linearRampToValueAtTime(.055, c.currentTime + .04);
    gain.gain.exponentialRampToValueAtTime(.001, c.currentTime + .4);
    osc.start(); osc.stop(c.currentTime + .4); return;
  }
  const frequencies: readonly number[] = name === "combo" ? [660, 880, ...[1047, 1320, 1568].slice(0, comboExtraNotes(combo))] : learningSoundNotes[name];
  const spacing = name === "levelComplete" ? .16 : name === "lessonComplete" ? .1 : .055;
  const length = name === "nodeTap" ? .06 : name === "cardOpen" ? .08 : name === "cardAdvance" ? .04 : name === "levelComplete" ? .22 : name === "lessonComplete" ? .2 : .1;
  frequencies.forEach((frequency, i) => {
    const osc = c.createOscillator(), gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination); osc.type = "sine";
    const t = c.currentTime + i * spacing;
    const hold = name === "lessonComplete" && i === frequencies.length - 1 ? .35 : 0;
    osc.frequency.setValueAtTime(frequency, t);
    if (name === "nodeTap" || name === "lockedTap") osc.frequency.exponentialRampToValueAtTime(frequency * .6, t + length);
    gain.gain.setValueAtTime(.001, t);
    gain.gain.linearRampToValueAtTime(name === "cardAdvance" ? .018 : .055, t + .006);
    gain.gain.exponentialRampToValueAtTime(.001, t + length + hold);
    osc.start(t); osc.stop(t + length + hold);
  });
}
