import { levelNodes, type LessonSection } from "./learnLevels";
export const LISTEN_ENABLED_TIERS = ["foundation"] as const;
export interface PathScenario { id: string; module_id: string; scenario_slug: string; title: string }
export interface MixedNode { id: string; title: string; section: number; done: boolean; unlocked: boolean; current: boolean; kind: "lesson" | "badge" | "story" | "practice" | "listen" | "chest"; scenarioSlug?: string }
export function mixedLevelNodes(sections: LessonSection[], completed: Set<string>, earned: boolean, unlocked: boolean, tier: string, scenarios: PathScenario[], optionalDone: Set<string>, hasQuestions: boolean): MixedNode[] {
  const mandatory = levelNodes(sections, completed, earned, unlocked);
  const nodes: MixedNode[] = [];
  const stories = scenarios.slice(0, 2);
  const lessonDone = (number: number) => sections.some(s => s.section_number === number && completed.has(s.id));
  const add = (kind: MixedNode["kind"], id: string, title: string, available: boolean, story?: PathScenario) => nodes.push({kind,id,title,section:0,current:false,done:optionalDone.has(id),unlocked:unlocked && available,scenarioSlug:story?.scenario_slug});
  for (const node of mandatory) {
    if (!node.section) { nodes.push({...node,kind:"badge"}); continue; }
    nodes.push({...node,kind:"lesson"});
    if (node.section === 2) {
      add("chest","chest","Chest",lessonDone(1) && lessonDone(2));
      if (stories[0]) add("story",`story:${stories[0].id}`,stories[0].title,lessonDone(2),stories[0]);
    }
    if (node.section === 3 && hasQuestions) add("practice","practice","Practice",lessonDone(3));
    if (node.section === 4) {
      if (hasQuestions && LISTEN_ENABLED_TIERS.some(t => t === tier)) add("listen","listen","Listen",lessonDone(4));
      if (stories[1]) add("story",`story:${stories[1].id}`,stories[1].title,lessonDone(4),stories[1]);
    }
  }
  return nodes;
}
export function storyBubbles(text: string) {
  // Intl sentence segmentation preserves quoted dialogue and abbreviations.
  const IntlWithSegments = Intl as unknown as { Segmenter?: new(locale:string,options:{granularity:string}) => {segment:(text:string)=>Iterable<{segment:string}>} };
  if (IntlWithSegments.Segmenter) return Array.from(new IntlWithSegments.Segmenter("en",{granularity:"sentence"}).segment(text),s=>s.segment.trim()).filter(Boolean);
  return text.match(/[^.!?]+(?:[.!?]+["'”’]*|$)/g)?.map(s => s.trim()).filter(Boolean) || [text];
}
export function practiceSourceId(moduleId: string, date = new Date()) { return `${moduleId}:${date.toISOString().slice(0,10)}`; }