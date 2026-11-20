import { AnimatePresence } from "motion/react";
import { useLocation, useOutlet } from "react-router-dom";
import { FadeSlide } from "./FadeSlide";

export default function LearnTransitions() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  // 150ms exit + 180ms enter stays below the 350ms route budget.
  return <AnimatePresence mode="wait" initial={false}>
    <FadeSlide key={pathname} enterDuration={0.18} data-learn-transition>{outlet}</FadeSlide>
  </AnimatePresence>;
}