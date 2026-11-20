import { reportError } from "./errorReporting";
// Like position saves, retries survive route changes without browser storage.
const jobs = new Map<string, () => Promise<void>>();
export function retryFinish(key: string, job: () => Promise<void>) {
  if (jobs.has(key)) return;
  jobs.set(key, job);
  const attempt = async () => {
    try { await job(); jobs.delete(key); }
    catch (error) {
      void reportError(error instanceof Error ? error : new Error("Finish save failed"));
      setTimeout(() => { if (jobs.has(key)) void attempt(); }, 3000);
    }
  };
  setTimeout(() => void attempt(), 3000);
}