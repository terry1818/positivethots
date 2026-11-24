import { useCallback, useSyncExternalStore } from "react";
import {
  playLearningSound,
  comboExtraNotes,
  playMatchSound,
  playMessageSound,
  playBadgeUnlockSound,
  playThotSound,
  playStreakMilestoneSound,
  playButtonTapSound,
  playSpinStartSound,
  playSpinTickSound,
  playSpinWinSound,
  type SpinRarity,
} from "@/lib/soundGenerator";
import { isNative } from "@/lib/capacitor";
import { emitReaction } from "@/lib/pointerFx";

// Tiny external store so all consumers stay in sync without context
let _soundEnabled = true;
let _hapticEnabled = true;

const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }

function getSoundEnabled(): boolean {
  return _soundEnabled;
}
function getHapticEnabled(): boolean {
  return _hapticEnabled;
}

export function setSoundEnabled(v: boolean) {
  _soundEnabled = v;
  notify();
}
export function setHapticEnabled(v: boolean) {
  _hapticEnabled = v;
  notify();
}

/** Initialize from persisted preferences (call once on app load) */
export function initSoundPreferences(sound: boolean, haptic: boolean) {
  _soundEnabled = sound;
  _hapticEnabled = haptic;
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

async function haptic(style: "light" | "medium" | "heavy") {
  if (!_hapticEnabled) return;
  try {
    const { haptic: triggerHaptic } = await import("@/lib/haptics");
    const patterns: Record<string, number> = { light: 10, medium: 30, heavy: 50 };
    triggerHaptic(patterns[style] || 30);
  } catch {}
}

export function useSoundEffects() {
  const soundEnabled = useSyncExternalStore(subscribe, getSoundEnabled, () => true);
  const hapticEnabled = useSyncExternalStore(subscribe, getHapticEnabled, () => true);

  const playMatch = useCallback(() => { emitReaction("win"); if (_soundEnabled) playMatchSound(); haptic("heavy"); }, []);
  const playMessage = useCallback(() => { if (_soundEnabled) playMessageSound(); haptic("light"); }, []);
  const playBadgeUnlock = useCallback(() => { emitReaction("win"); if (_soundEnabled) playBadgeUnlockSound(); haptic("heavy"); }, []);
  const playThot = useCallback(() => { if (_soundEnabled) playThotSound(); haptic("medium"); }, []);
  const playStreakMilestone = useCallback(() => { if (_soundEnabled) playStreakMilestoneSound(); haptic("heavy"); }, []);
  const playButtonTap = useCallback(() => { if (_soundEnabled) playButtonTapSound(); haptic("light"); }, []);

  const playNodeTap = useCallback(() => { if (_soundEnabled) playLearningSound("nodeTap"); void haptic("light"); }, []);
  const playCardOpen = useCallback(() => { if (_soundEnabled) playLearningSound("cardOpen"); }, []);
  const playLessonStart = useCallback(() => { if (_soundEnabled) playLearningSound("lessonStart"); }, []);
  const playCardAdvance = useCallback(() => { if (_soundEnabled) playLearningSound("cardAdvance"); }, []);
  const playCorrect = useCallback(() => { emitReaction("correct"); if (_soundEnabled) playLearningSound("correct"); void haptic("light"); }, []);
  const playMiss = useCallback(() => { emitReaction("miss"); if (_soundEnabled) playLearningSound("miss"); }, []);
  const playCombo = useCallback((n: number) => { if (n >= 5) emitReaction("combo"); if (_soundEnabled && comboExtraNotes(n)) playLearningSound("combo", n); void haptic("light"); }, []);
  const playNodeComplete = useCallback(() => { emitReaction("win"); if (_soundEnabled) playLearningSound("nodeComplete"); void haptic("medium"); }, []);
  const playTrailFill = useCallback(() => { if (_soundEnabled) playLearningSound("trailFill"); }, []);
  const playLessonComplete = useCallback(() => { emitReaction("win"); if (_soundEnabled) playLearningSound("lessonComplete"); void haptic("medium"); }, []);
  const playChestOpen = useCallback(() => { emitReaction("chest"); if (_soundEnabled) playLearningSound("chestOpen"); void haptic("medium"); }, []);
  const playLevelComplete = useCallback(() => { emitReaction("win"); if (_soundEnabled) playLearningSound("levelComplete"); }, []);
  const playSpinStart = useCallback(() => { if (_soundEnabled) playSpinStartSound(); void haptic("light"); }, []);
  const playSpinTick = useCallback((pace = 0) => { if (_soundEnabled) playSpinTickSound(pace); }, []);
  const playSpinWin = useCallback((rarity: SpinRarity) => { if (_soundEnabled) playSpinWinSound(rarity); void haptic(rarity === "common" ? "medium" : "heavy"); }, []);
  const playLockedTap = useCallback(() => { if (_soundEnabled) playLearningSound("lockedTap"); }, []);
  return {
    playNodeTap, playCardOpen, playLessonStart, playCardAdvance, playCorrect, playMiss, playCombo,
    playNodeComplete, playTrailFill, playLessonComplete, playChestOpen, playLevelComplete, playLockedTap,
    playSpinStart, playSpinTick, playSpinWin,
    soundEnabled,
    hapticEnabled,
    setSoundEnabled,
    setHapticEnabled,
    playMatch,
    playMessage,
    playBadgeUnlock,
    playThot,
    playStreakMilestone,
    playButtonTap,
  };
}
