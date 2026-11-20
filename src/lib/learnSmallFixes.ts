export function rollDailyReward(userId: string, date: string) {
  let seed = 2166136261;
  for (const char of `${userId}:${date}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  seed ^= seed >>> 16;
  seed = Math.imul(seed, 0x85ebca6b);
  seed ^= seed >>> 13;
  seed = Math.imul(seed, 0xc2b2ae35);
  seed ^= seed >>> 16;
  const r = (seed >>> 0) / 4294967296;
  if (r < 0.6) return { xp: 5, isBoost: false, tier: "micro" as const };
  if (r < 0.8) return { xp: 10, isBoost: false, tier: "micro" as const };
  if (r < 0.9) return { xp: 15, isBoost: false, tier: "small" as const };
  if (r < 0.95) return { xp: 25, isBoost: false, tier: "small" as const };
  return { xp: 0, isBoost: true, tier: "medium" as const };
}

export function moduleCompletionPercent(completed: number, total: number, badgeEarned: boolean) {
  if (badgeEarned) return 100;
  const raw = total > 0 ? Math.round(completed / total * 100) : 0;
  return raw >= 100 ? 95 : raw;
}

export function extractTakeaway(content: string): string {
  const clean = (text: string) => text.replace(/\*\*/g, "").replace(/^\s*-\s+/gm, "").replace(/\s+/g, " ").trim();
  const bold = content.match(/\*\*(.{20,120}?)\*\*/);
  if (bold) return clean(bold[1]);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20 && !/^[#[]/.test(p.trim()));
  const paragraph = clean(paragraphs[paragraphs.length - 1] || "");
  const sentences = paragraph.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [];
  let result = "";
  for (const sentence of sentences) {
    const next = `${result} ${sentence.trim()}`.trim();
    if (next.length > 180) break;
    result = next;
  }
  if (result || !paragraph) return result;
  const prefix = paragraph.slice(0, 180);
  const boundary = prefix.lastIndexOf(" ");
  return `${boundary >= 0 ? prefix.slice(0, boundary) : ""}...`;
}