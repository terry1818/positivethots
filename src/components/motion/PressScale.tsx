import { m, type HTMLMotionProps } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { spring } from "@/lib/motionTokens";

/** Wrap an existing keyboard-accessible Button or interactive card. */
export function PressScale({ children, ...props }: HTMLMotionProps<"div">) {
  const reduced = useReducedMotion();
  return <m.div {...props} whileTap={reduced ? undefined : { scale: 0.96 }} transition={{ type: "spring", ...spring.press }}>{children}</m.div>;
}