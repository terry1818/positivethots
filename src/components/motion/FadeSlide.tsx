import { m, type HTMLMotionProps } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { duration, fadeSlideMotion } from "@/lib/motionTokens";

export function FadeSlide({ children, enterDuration = duration.normal, ...props }: HTMLMotionProps<"div"> & { enterDuration?: number }) {
  const reduced = useReducedMotion();
  return <m.div {...props} {...fadeSlideMotion(reduced, enterDuration)}>{children}</m.div>;
}