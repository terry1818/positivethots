import { m } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { spring } from "@/lib/motionTokens";
import waving from "@/assets/mascot-waving.png";
import celebration from "@/assets/mascot-celebration.png";
import graduate from "@/assets/mascot-graduate.png";
import heart from "@/assets/mascot-heart.png";
import confused from "@/assets/mascot-confused.png";
import shrug from "@/assets/mascot-shrug.png";
import binoculars from "@/assets/mascot-binoculars.png";

const images = { waving, celebration, graduate, heart, confused, shrug, binoculars };
export type MascotMood = keyof typeof images;
const sizes = { sm: 48, md: 96, lg: 160 };

export function Mascot({ mood, size = "md", animate = true, alt }: {
  mood: MascotMood; size?: keyof typeof sizes; animate?: boolean; alt?: string;
}) {
  const reduced = useReducedMotion();
  const dimension = sizes[size];
  const dimensions = { sm: "w-12 h-12", md: "w-24 h-24", lg: "w-40 h-40" };
  return <m.img src={images[mood]} width={dimension} height={dimension} loading="lazy" decoding="async"
    className={`inline-block object-contain shrink-0 ${dimensions[size]}`} alt={alt ?? (mood === "celebration" ? "Mascot celebrating" : `Mascot ${mood}`)}
    initial={animate ? (reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }) : false}
    animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
    transition={reduced ? { duration: 0.1 } : { type: "spring", ...spring.pop }} />;
}