/**
 * Trigger haptic feedback on supported devices.
 * Respects prefers-reduced-motion and fails silently.
 */
export function haptic(pattern: number | number[] = 30) {
  if (typeof navigator === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  navigator.vibrate?.(pattern);
}
