import { GuideArt, type GuideName } from "./GuideArt";
const moods: Record<string, GuideName> = { graduate: "guide-graduate", confused: "guide-thinking", thinking: "guide-thinking", shrug: "guide-encourage", waving: "guide-waving", celebration: "guide-high-five", heart: "guide-thumbs-up", binoculars: "guide-thinking", celebrating: "guide-high-five", proud: "guide-graduate", encouraging: "guide-encourage", empathetic: "guide-encourage" };
export function Mascot({ mood, size = "md", animate = true, alt = "" }: { mood: string; size?: "sm" | "md" | "lg" | "path"; animate?: boolean; alt?: string }) {
  return <GuideArt name={moods[mood] || "guide-waving"} size={{ sm: 64, md: 112, lg: 160, path: 112 }[size]} animate={animate} alt={alt}/>;
}
export function MascotReaction({ emotion, animate = true }: { emotion: string; size?: string; position?: string; animate?: boolean }) {
  return <GuideArt name={moods[emotion] || "guide-encourage"} size={160} animate={animate}/>;
}