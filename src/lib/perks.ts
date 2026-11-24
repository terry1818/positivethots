// Three perks can be earned two ways: by finishing a Learn section, or with a plan.
//   Priority visibility: finish Relationships, or Premium / VIP.
//   Mentor badge:        finish Advanced, or VIP.
//   Advanced filters:    finish Identity, or Premium / VIP.
// The plan half comes from the server (get_plan_perks returns flags, never the plan). The learning
// half is worked out from badges, which every member can already see.
export type PlanFlags = { priority: boolean; mentor: boolean };
export type MemberPerks = { priority: boolean; mentor: boolean };

/** Sections a member has finished: every module in the section has a badge. */
export function sectionsFinished(modules: { id: string; tier: string }[], earned: Set<string>): Set<string> {
  const byTier = new Map<string, string[]>();
  for (const m of modules) byTier.set(m.tier, [...(byTier.get(m.tier) ?? []), m.id]);
  const done = new Set<string>();
  for (const [tier, ids] of byTier) if (ids.length > 0 && ids.every((id) => earned.has(id))) done.add(tier);
  return done;
}

export function memberPerks(plan: PlanFlags | undefined, finished: Set<string>): MemberPerks {
  return {
    priority: !!plan?.priority || finished.has("relationships"),
    mentor: !!plan?.mentor || finished.has("advanced"),
  };
}

export function canUseAdvancedFilters(ownPlan: string | null | undefined, finished: Set<string>): boolean {
  return ownPlan === "premium" || ownPlan === "vip" || finished.has("identity");
}
