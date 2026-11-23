import index from "@/content/lesson-text/index.json";
import { pickText, pickTitle, type LessonTextEntry, type LessonTextPatch } from "./lessonTextCore";

const entries = index as Record<string, LessonTextEntry>;
const files = import.meta.glob<Record<string, LessonTextPatch>>("/src/content/lesson-text/modules/*.json", { import: "default" });
const loaded = new Map<string, Promise<Record<string, LessonTextPatch>>>();

function patchesFor(moduleSlug: string): Promise<Record<string, LessonTextPatch>> {
  if (!loaded.has(moduleSlug)) {
    const load = files[`/src/content/lesson-text/modules/${moduleSlug}.json`];
    // A missing or failed file means the lesson shows its stored text, never an error.
    loaded.set(moduleSlug, load ? load().catch(() => ({})) : Promise.resolve({}));
  }
  return loaded.get(moduleSlug)!;
}

/** The lesson title to show: the corrected one while the stored title is still the one it replaced. */
export function lessonTitle(sectionId: string | null | undefined, storedTitle: string): string {
  return sectionId ? pickTitle(entries[sectionId], storedTitle) : storedTitle;
}

/** The lesson text to show: the corrected text while the stored text is still the one it replaced. */
export async function lessonText(sectionId: string | null | undefined, storedText: string | null | undefined): Promise<string> {
  const text = storedText ?? "";
  const entry = sectionId ? entries[sectionId] : undefined;
  if (!entry || !text) return text;
  return pickText((await patchesFor(entry.m))[sectionId!], text);
}

/** Applies title and text corrections to rows of module_sections. Rows without a correction pass through untouched. */
export async function patchSections<T extends { id: string; title?: string | null; content_text?: string | null }>(rows: T[]): Promise<T[]> {
  return Promise.all(rows.map(async (row) => {
    if (!entries[row.id]) return row;
    const next = { ...row };
    if (typeof row.title === "string") next.title = lessonTitle(row.id, row.title);
    if (typeof row.content_text === "string") next.content_text = await lessonText(row.id, row.content_text);
    return next;
  }));
}
