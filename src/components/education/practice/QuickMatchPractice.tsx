import { useState } from "react";
import { m } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { spring } from "@/lib/motionTokens";
import { reportError } from "@/lib/errorReporting";
import { PracticeFrame } from "./PracticeFrame";
export interface MatchSet { id: string; question: string; left_items: string[]; right_items: string[] }
export default function QuickMatchPractice({ set, onComplete, onExit }: { set: MatchSet; onComplete: (accuracy: number, total: number) => void; onExit: () => void }) {
  const [selected, select] = useState<string | null>(null); const [done, mark] = useState<Record<string, string>>({}); const [pending, wait] = useState(false); const [error, fail] = useState(false); const [misses, countMisses] = useState(0);
  const reduced = useReducedMotion(); const { playCorrect, playMiss } = useSoundEffects();
  const pair = async (definition: string) => { if (!selected || pending) return; wait(true); fail(false); try { const { data, error } = await supabase.rpc("check_match", { _question_id: set.id, _pairs: [{ term: selected, definition }] }); if (error) throw error; const result = data as unknown as { is_correct: boolean }[]; if (result[0]?.is_correct) { playCorrect(); const next = { ...done, [selected]: definition }; mark(next); select(null); if (Object.keys(next).length === set.left_items.length) onComplete(Math.round(set.left_items.length / (set.left_items.length + misses) * 100), set.left_items.length); } else { playMiss(); countMisses(n => n + 1); fail(true); } } catch (e) { fail(true); void reportError(e instanceof Error ? e : new Error("Pair check failed")); } finally { wait(false); } };
  return <PracticeFrame title="Quick match" current={Object.keys(done).length} total={set.left_items.length} onExit={onExit}><p>{set.question}</p><div className="grid grid-cols-2 gap-3">{[set.left_items, set.right_items].map((items, column) => <div key={column} className="space-y-3">{items.map(text => { const matched = column ? Object.values(done).includes(text) : !!done[text]; return <m.div key={text} animate={{ opacity: matched ? .5 : 1, scale: reduced ? 1 : matched ? .97 : 1 }} transition={{ type: "spring", ...spring.pop }}><Button variant="outline" className="w-full h-auto min-h-[64px] whitespace-normal" aria-pressed={!column ? selected === text : undefined} disabled={matched || pending || !!column && !selected} onClick={() => column ? void pair(text) : select(text)}>{matched ? "✓ " : ""}{text}</Button></m.div>; })}</div>)}</div>{error && <p role="alert">That pair didn't settle. Try another pair, or try again.</p>}</PracticeFrame>;
}