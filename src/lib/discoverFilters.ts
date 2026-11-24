// Advanced filters for Discover. Chosen on this device, applied to the people already offered to the
// member; nothing about the choice is sent anywhere.
export type DiscoverFilters = { genders: string[]; styles: string[] };
export const NO_FILTERS: DiscoverFilters = { genders: [], styles: [] };
const KEY = "pt_discover_filters";

export function loadFilters(): DiscoverFilters {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && Array.isArray(raw.genders) && Array.isArray(raw.styles)) {
      return { genders: raw.genders.filter((v: unknown) => typeof v === "string"), styles: raw.styles.filter((v: unknown) => typeof v === "string") };
    }
  } catch { /* storage can be unavailable; filters are a convenience */ }
  return NO_FILTERS;
}

export function saveFilters(f: DiscoverFilters) {
  try { localStorage.setItem(KEY, JSON.stringify(f)); } catch { /* same */ }
}

export const filtersActive = (f: DiscoverFilters) => f.genders.length + f.styles.length > 0;

/** An empty group means "anyone". A person with no value stated is only shown when that group is empty. */
export function passesFilters(p: { gender?: string | null; relationship_style?: string | null }, f: DiscoverFilters): boolean {
  if (f.genders.length > 0 && !(p.gender && f.genders.includes(p.gender))) return false;
  if (f.styles.length > 0 && !(p.relationship_style && f.styles.includes(p.relationship_style))) return false;
  return true;
}

/** The values people nearby have actually stated, most common first, so no option leads nowhere. */
export function filterOptions(people: { gender?: string | null; relationship_style?: string | null }[]) {
  const tally = (pick: (p: (typeof people)[number]) => string | null | undefined) => {
    const counts = new Map<string, number>();
    for (const p of people) { const v = pick(p); if (v) counts.set(v, (counts.get(v) ?? 0) + 1); }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value]) => value);
  };
  return { genders: tally((p) => p.gender), styles: tally((p) => p.relationship_style) };
}

export const filterLabel = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
