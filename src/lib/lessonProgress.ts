import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/errorReporting";

// In-memory queue survives lesson unmounts. No browser storage or anonymous writes.
const queue = new Map<string, { user: string; section: string; index: number }>();
let saving = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
async function flush() {
  if (saving) return;
  saving = true;
  try {
    for (const [key, position] of queue) {
      const { error } = await supabase.from("user_section_progress").upsert({
        user_id: position.user, section_id: position.section, last_card_index: position.index,
        last_accessed: new Date().toISOString(),
      }, { onConflict: "user_id,section_id" });
      if (error) { void reportError(new Error(`Lesson position save failed: ${error.message}`)); break; }
      if (queue.get(key) === position) queue.delete(key);
    }
  } catch (error) {
    void reportError(error instanceof Error ? error : new Error("Lesson position save failed"));
  } finally {
    saving = false;
    if (queue.size) retryTimer = setTimeout(() => void flush(), 3000);
  }
}
export function saveLessonPosition(user: string, section: string, index: number) {
  queue.set(`${user}:${section}`, { user, section, index });
  if (retryTimer) clearTimeout(retryTimer);
  void flush();
}
if (typeof window !== "undefined") window.addEventListener("online", () => void flush());
