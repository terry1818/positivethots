import manifest from "@/assets/guides/manifest.json";
import alternates from "@/assets/guides/manifest-alternates.json";

export type GuideName = keyof typeof manifest extends `${infer Name}.webp` ? Name : never;
export const guideManifest: Record<string, number[]> = { ...manifest, ...alternates };
export function localGuideDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function selectGuide(name: GuideName, userId = "", day = localGuideDate()): string {
  const choices = Object.keys(guideManifest).filter(file => file === `${name}.webp` || file.startsWith(`${name}-`)).sort();
  let hash = 2166136261;
  for (const char of `${userId}|${day}|${name}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return choices[hash % choices.length];
}