import { test, expect } from "bun:test";
import { duration, easing, distance, spring, fadeSlideMotion } from "../src/lib/motionTokens";

test("shared motion foundation uses the specified durations, easing, distances and springs", () => {
  expect(duration).toEqual({ fast: 0.18, normal: 0.3, slow: 0.5 });
  expect(easing.smooth).toEqual([0.22, 1, 0.36, 1]);
  expect(easing.sharp).toEqual([0.4, 0, 0.2, 1]);
  expect(distance).toEqual({ sm: 8, md: 16, lg: 24 });
  expect(spring.press).toEqual({ stiffness: 500, damping: 30 });
  expect(spring.pop).toEqual({ stiffness: 380, damping: 22 });
});

test("reduced motion fades in 0.1 seconds without transform", () => {
  const config = fadeSlideMotion(true);
  expect(config.initial).toEqual({ opacity: 0 });
  expect(config.animate).toEqual({ opacity: 1 });
  expect(config.transition.duration).toBe(0.1);
  expect(config.exit.transition.duration).toBe(0.1);
});

test("Learn wait transitions total 330ms and normal primitive enters over 300ms", () => {
  expect(fadeSlideMotion(false).transition.duration).toBe(0.3);
  expect(fadeSlideMotion(false, 0.18).transition.duration + fadeSlideMotion(false).exit.transition.duration).toBeCloseTo(0.33);
});