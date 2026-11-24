import type { GuideName } from "@/lib/guideRotation";
import type { PathIconKind } from "@/components/education/pathIcons";

/**
 * Every Learn section, in the order the path shows them. A section's `id` is the value stored in
 * education_modules.tier. Adding a section means adding one entry here and one `.learn-tier-<id>`
 * colour rule in src/index.css (tests/learn_sections.test.ts checks both). See docs/adding-a-course.md.
 */
export interface SectionFeature { key: string; label: string; description: string; icon: string }
export interface LearnSection {
  id: string;
  /** Shown on section headers and badges. */
  name: string;
  /** Longer name on the roadmap. */
  roadmapName: string;
  /** One or two words, for tight rows. */
  shortName: string;
  /** Foundation only: every module must be finished before Discover opens. */
  gatesDiscover: boolean;
  /** Modules in this section need a plan to open. */
  plan: boolean;
  /** Character art for the section. Must be a file in src/assets/guides. */
  guide: GuideName;
  emblem: PathIconKind;
  /** Badge face colour (Tailwind class). */
  badgeBg: string;
  /** Small tinted chip (Tailwind classes). */
  chip: string;
  /** What the lessons draw on. A source, never an endorsement. */
  sources: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  /** App features that open when every module in the section is finished. */
  features: SectionFeature[];
}

export const LEARN_SECTIONS: readonly LearnSection[] = [
  {
    id: "foundation", name: "Foundation", roadmapName: "Foundation (Required)", shortName: "Foundation",
    gatesDiscover: true, plan: false, guide: "guide-tier-foundation", emblem: "badge",
    badgeBg: "bg-primary", chip: "bg-primary/10 text-primary border-primary/30",
    sources: "Consent, boundaries and emotional skills research", level: "Foundation",
    features: [
      { key: "discovery", label: "Discovery", description: "Browse and connect with other members", icon: "💜" },
      { key: "distance_radar", label: "Distance Radar", description: "Find members near you in Discover", icon: "📡" },
      { key: "basic_matching", label: "Connecting", description: "Connect with compatible people", icon: "💕" },
    ],
  },
  {
    id: "dating_safety", name: "Dating & Safety", roadmapName: "Dating & Safety", shortName: "Dating",
    gatesDiscover: false, plan: false, guide: "guide-story-chat", emblem: "story",
    badgeBg: "bg-[hsl(214_80%_44%)]", chip: "bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400",
    sources: "Dating safety, consent and communication research", level: "Foundation",
    features: [],
  },
  {
    id: "sexual_health", name: "Sexual Health", roadmapName: "Sexual Health", shortName: "Sexual",
    gatesDiscover: false, plan: false, guide: "guide-tier-sexual-health", emblem: "heart",
    badgeBg: "bg-success", chip: "bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400",
    sources: "Sexual health and sex education research", level: "Intermediate",
    features: [
      { key: "sti_sharing", label: "STI Status Sharing", description: "Display verified STI testing info on your profile", icon: "🛡️" },
      { key: "safer_sex_badge", label: "Safer Sex Badge", description: "Show a Safer Sex awareness badge on your profile", icon: "✅" },
    ],
  },
  {
    id: "identity", name: "Identity", roadmapName: "Identity & Diversity", shortName: "Identity",
    gatesDiscover: false, plan: false, guide: "guide-tier-identity", emblem: "star",
    badgeBg: "bg-[hsl(285_55%_45%)]", chip: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
    sources: "Research on orientation, gender and relationship styles", level: "Intermediate",
    features: [
      { key: "advanced_filters", label: "Advanced Filters", description: "Filter Discover by gender and relationship style", icon: "🔍" },
      { key: "profile_linking", label: "Profile Linking", description: "Link your profile publicly with partners", icon: "🔗" },
    ],
  },
  {
    id: "relationships", name: "Relationships", roadmapName: "Healthy Relationships", shortName: "Healthy",
    gatesDiscover: false, plan: false, guide: "guide-tier-relationships", emblem: "story",
    badgeBg: "bg-[hsl(340_65%_55%)]", chip: "bg-pink-500/10 text-pink-600 border-pink-500/30 dark:text-pink-400",
    sources: "Gottman research and Nonviolent Communication", level: "Intermediate",
    features: [
      { key: "priority_matching", label: "Priority Visibility", description: "Be shown sooner in other members' Discover", icon: "⭐" },
      { key: "chat_tools", label: "Conversation Tools", description: "Guided conversation starters and conflict prompts", icon: "💬" },
    ],
  },
  {
    id: "growth", name: "Personal Growth", roadmapName: "Personal Growth", shortName: "Growth",
    gatesDiscover: false, plan: true, guide: "guide-meditate", emblem: "practice",
    badgeBg: "bg-[hsl(186_80%_30%)]", chip: "bg-teal-500/10 text-teal-600 border-teal-500/30 dark:text-teal-400",
    sources: "Habit, self-image and mindfulness research", level: "Intermediate",
    features: [],
  },
  {
    id: "advanced", name: "Advanced", roadmapName: "Advanced Topics", shortName: "Advanced",
    gatesDiscover: false, plan: true, guide: "guide-tier-advanced", emblem: "crown",
    badgeBg: "bg-accent", chip: "bg-accent/10 text-accent border-accent/30",
    sources: "Kink-aware care and relationship research", level: "Advanced",
    features: [
      { key: "events_access", label: "Events & Workshops", description: "Access and get tickets to community events", icon: "🎉" },
      { key: "event_location_sharing", label: "Event Location Sharing", description: "Share live location at events to find nearby attendees", icon: "📍" },
      { key: "mentor_badge", label: "Mentor Badge", description: "Display a Mentor badge on your profile", icon: "🎓" },
      { key: "premium_content", label: "Premium Content", description: "Access exclusive content without a plan", icon: "👑" },
    ],
  },
];

export const SECTION_IDS: readonly string[] = LEARN_SECTIONS.map((s) => s.id);
const BY_ID = new Map(LEARN_SECTIONS.map((s) => [s.id, s]));

/** The section a module belongs to. Unknown or empty values read as Foundation, as the app always did. */
export function learnSection(id: string | null | undefined): LearnSection {
  return BY_ID.get(id ?? "") ?? LEARN_SECTIONS[0];
}

/** Sections that have at least one module, in path order. An empty section is never shown. */
export function sectionsWithModules<T extends { tier: string | null }>(modules: T[]): LearnSection[] {
  const used = new Set(modules.map((m) => m.tier ?? "foundation"));
  return LEARN_SECTIONS.filter((s) => used.has(s.id));
}
