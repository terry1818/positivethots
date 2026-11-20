import { GuideArt, type GuideName } from "./GuideArt";

const images = { waving: "guide-waving", celebration: "guide-celebrate-all", graduate: "guide-graduate", heart: "guide-high-five", confused: "guide-thinking", shrug: "guide-encourage", binoculars: "guide-tier-advanced" } satisfies Record<string, GuideName>;
export type MascotMood = keyof typeof images;
const sizes = { sm: 48, md: 96, lg: 160, path: 104 };

export function Mascot({ mood, size = "md", animate = true, alt }: {
  mood: MascotMood; size?: keyof typeof sizes; animate?: boolean; alt?: string;
}) {
  return <GuideArt name={images[mood]} size={sizes[size]} animate={animate} alt={alt ?? ""} />;
}