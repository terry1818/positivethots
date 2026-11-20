import manifest from "@/assets/guides/manifest.json";
import alternates from "@/assets/guides/manifest-alternates.json";
import lessons from "@/assets/guides/manifest-lessons.json";

// Lesson illustrations ("guide-<lesson>-<idea>") share the character component; their suffix is a word, never a single letter.
export type GuideName = keyof typeof manifest | keyof typeof lessons extends `${infer Name}.webp` ? Name : never;
export const guideManifest: Record<string, number[]> = { ...manifest, ...alternates, ...lessons };
export function localGuideDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function guideChoices(name: GuideName): string[] {
  // Alternates are named "<name>-b.webp", "<name>-c.webp"; a longer name such as "guide-level-up" must not match "guide-level".
  return Object.keys(guideManifest).filter(file => file === `${name}.webp` || new RegExp(`^${name}-[a-z]\\.webp$`).test(file)).sort();
}
export function selectGuide(name: GuideName, userId = "", day = localGuideDate()): string {
  const choices = guideChoices(name);
  let hash = 2166136261;
  for (const char of `${userId}|${day}|${name}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return choices[hash % choices.length];
}