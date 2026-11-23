/**
 * Corrected lesson text that ships with the app (src/content/lesson-text).
 *
 * The lesson text lives in the database. A correction here replaces it on screen only while the
 * database still holds the exact text the correction was written against (`was`), so an edit made
 * later in the admin editor always wins. Titles work the same way through `wt`.
 */
export interface LessonTextEntry {
  /** Module slug: names the file under src/content/lesson-text/modules that holds the corrected text. */
  m: string;
  /** Corrected lesson title, shown while the stored title still equals `wt`. */
  t?: string;
  wt?: string;
}
export interface LessonTextPatch {
  /** Fingerprint of the stored text this correction replaces. */
  was: string;
  text: string;
}

/** FNV-1a over UTF-16 code units plus the length. Must match fnv() in the authoring scripts. */
export function textFingerprint(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(36)}.${text.length}`;
}

export function pickTitle(entry: LessonTextEntry | undefined, storedTitle: string): string {
  return entry?.t && entry.wt === storedTitle ? entry.t : storedTitle;
}

export function pickText(patch: LessonTextPatch | undefined, storedText: string): string {
  return patch && patch.was === textFingerprint(storedText) ? patch.text : storedText;
}
