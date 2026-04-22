/**
 * BRANDED LANGUAGE — Single Source of Truth
 *
 * NEVER use the alternatives in user-facing text.
 *
 *   "Send a Thot"        — not "Super Like"
 *   "Thot"               — not "super like" (noun)
 *   "Thot Pack"          — not "Super Like Pack"
 *   "You Both Said Yes"  — not "It's a Match"
 *   "Connect"            — not "Swipe Right" or "Like" (as action)
 *   "Pass"               — not "Swipe Left" or "Reject"
 *   "Discovery"          — not "Browse" or "Explore" (for the swipe section)
 *   "Badges"             — not "Achievements" or "Certifications"
 *   "Learn"              — not "Courses" or "Classes" (as section name)
 *
 * Internal database / API field names (e.g. `super_likes` table,
 * `useSuperLikes` hook, `super_like` notification type) are exempted —
 * they remain as-is. Only user-visible strings must use branded terms.
 */

export const BRANDED_TERMS = {
  THOT_SINGULAR: "Thot",
  THOT_ACTION: "Send a Thot",
  THOT_PACK: "Thot Pack",
  MATCH_CELEBRATION: "You Both Said Yes",
  SWIPE_RIGHT: "Connect",
  SWIPE_LEFT: "Pass",
  SECTION_DISCOVER: "Discovery",
  SECTION_LEARN: "Learn",
  BADGE: "Badge",
  BADGES: "Badges",
} as const;

export type BrandedTerm = keyof typeof BRANDED_TERMS;
