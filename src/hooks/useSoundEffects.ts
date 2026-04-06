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
    const { triggerHaptic } = await import("@/lib/haptics");
    triggerHaptic(style);
  } catch {}
}

export function useSoundEffects() {
  const soundEnabled = useSyncExternalStore(subscribe, getSoundEnabled, () => true);
  const hapticEnabled = useSyncExternalStore(subscribe, getHapticEnabled, () => true);

  const playMatch = useCallback(() => { if (_soundEnabled) playMatchSound(); haptic("heavy"); }, []);
  const playMessage = useCallback(() => { if (_soundEnabled) playMessageSound(); haptic("light"); }, []);
  const playBadgeUnlock = useCallback(() => { if (_soundEnabled) playBadgeUnlockSound(); haptic("heavy"); }, []);
  const playThot = useCallback(() => { if (_soundEnabled) playThotSound(); haptic("medium"); }, []);
  const playStreakMilestone = useCallback(() => { if (_soundEnabled) playStreakMilestoneSound(); haptic("heavy"); }, []);
  const playButtonTap = useCallback(() => { if (_soundEnabled) playButtonTapSound(); haptic("light"); }, []);

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
