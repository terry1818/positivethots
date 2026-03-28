import { useCallback, useSyncExternalStore } from "react";
import {
  playMatchSound,
  playMessageSound,
  playBadgeUnlockSound,
  playThotSound,
  playStreakMilestoneSound,
  playButtonTapSound,
} from "@/lib/soundGenerator";
import { isNative } from "@/lib/capacitor";

const SOUND_KEY = "sound_effects_enabled";
const HAPTIC_KEY = "haptic_feedback_enabled";

// Tiny external store so all consumers stay in sync without context
const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }

function getSoundEnabled(): boolean {
  try { return localStorage.getItem(SOUND_KEY) !== "false"; } catch { return true; }
}
function getHapticEnabled(): boolean {
  try { return localStorage.getItem(HAPTIC_KEY) !== "false"; } catch { return true; }
}

export function setSoundEnabled(v: boolean) {
  localStorage.setItem(SOUND_KEY, String(v));
  notify();
}
export function setHapticEnabled(v: boolean) {
  localStorage.setItem(HAPTIC_KEY, String(v));
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

async function haptic(style: "light" | "medium" | "heavy") {
  if (!isNative()) {
    // Web fallback
    if (navigator.vibrate) {
      const ms = style === "light" ? 10 : style === "medium" ? 25 : 50;
      navigator.vibrate(ms);
    }
    return;
  }
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics" as any);
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {
    // plugin not available
  }
}

export function useSoundEffects() {
  const soundEnabled = useSyncExternalStore(subscribe, getSoundEnabled, () => true);
  const hapticEnabled = useSyncExternalStore(subscribe, getHapticEnabled, () => true);

  const playMatch = useCallback(() => {
    if (soundEnabled) playMatchSound();
    if (hapticEnabled) haptic("medium");
  }, [soundEnabled, hapticEnabled]);

  const playMessage = useCallback(() => {
    if (soundEnabled) playMessageSound();
    if (hapticEnabled) haptic("light");
  }, [soundEnabled, hapticEnabled]);

  const playBadgeUnlock = useCallback(() => {
    if (soundEnabled) playBadgeUnlockSound();
    if (hapticEnabled) haptic("heavy");
  }, [soundEnabled, hapticEnabled]);

  const playThot = useCallback(() => {
    if (soundEnabled) playThotSound();
    if (hapticEnabled) haptic("medium");
  }, [soundEnabled, hapticEnabled]);

  const playStreakMilestone = useCallback(() => {
    if (soundEnabled) playStreakMilestoneSound();
    if (hapticEnabled) haptic("heavy");
  }, [soundEnabled, hapticEnabled]);

  const playButtonTap = useCallback(() => {
    if (soundEnabled) playButtonTapSound();
    if (hapticEnabled) haptic("light");
  }, [soundEnabled, hapticEnabled]);

  return {
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
