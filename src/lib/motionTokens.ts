export const duration = { fast: 0.18, normal: 0.3, slow: 0.5 } as const;
export const easing = { smooth: [0.22, 1, 0.36, 1], sharp: [0.4, 0, 0.2, 1] } as const;
export const distance = { sm: 8, md: 16, lg: 24 } as const;
export const spring = { press: { stiffness: 500, damping: 30 }, pop: { stiffness: 380, damping: 22 } } as const;

export function fadeSlideMotion(reduced: boolean, enterDuration: number = duration.normal) {
  return {
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: distance.md },
    animate: reduced ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: reduced ? 0.1 : 0.15 } },
    transition: { duration: reduced ? 0.1 : enterDuration, ease: easing.smooth },
  };
}