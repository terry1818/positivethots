import { selectGuide, type GuideName } from "./guideRotation";
const images = import.meta.glob<string>("/src/assets/guides/guide-*.webp", { eager: true, query: "?url", import: "default" });
export function guideFileUrl(file: string) {
  return images[`/src/assets/guides/${file}`];
}
export function guideUrl(name: GuideName, userId = "", day?: string) {
  return images[`/src/assets/guides/${selectGuide(name, userId, day)}`];
}