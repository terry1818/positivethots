import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "motion/react";

export default function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation} strict>{children}</LazyMotion>;
}