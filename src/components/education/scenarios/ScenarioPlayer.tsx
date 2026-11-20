import { GuideArt } from "@/components/mascot/GuideArt";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { BottomSheet } from "@/components/motion/BottomSheet";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLearningStats } from "@/hooks/useLearningStats";
import { storyBubbles } from "@/lib/mixedNodes";
import { retryFinish } from "@/lib/finishRetry";
import { reportError } from "@/lib/errorReporting";
import type { FinishData } from "@/lib/learnFinish";
import { X } from "lucide-react";
const FinishSequence = lazy(() => import("../FinishSequence"));
interface Character { name: string; pronouns: string; role: string }
interface Choice { text: string; next_scene: string; is_best: boolean; feedback: string; points?: number }
interface Scene { id: string; narrator: string; text: string; choices: Choice[] }
interface Scenario { id: string; title: string; characters: Character[]; scenes: Scene[]; xp_reward: number; module_id: string }
interface MadeChoice { sceneId: string; choiceIdx: number; isBest: boolean }
interface Line { speaker: string; text: string; reply?: boolean }
const avatarTokens = ["bg-primary text-primary-foreground", "bg-secondary text-secondary-foreground", "bg-success text-success-foreground", "bg-accent text-accent-foreground"];
export const ScenarioPlayer = ({ scenarioId, onComplete, onBack }: {scenarioId: string; onComplete?: (score:number,xpEarned:number)=>void; onBack?:()=>void}) => {
 const {user}=useAuth(); const reduced=useReducedMotion(); const {stats,awardXP}=useLearningStats();
 const awardRef=useRef(awardXP);awardRef.current=awardXP;
 const [scenario,setScenario]=useState<Scenario|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
 const [begun,setBegun]=useState(false);const [sceneId,setSceneId]=useState("");const [lines,setLines]=useState<Line[]>([]);const [revealed,setRevealed]=useState(0);
 const [choices,setChoices]=useState<MadeChoice[]>([]);const [score,setScore]=useState(0);const [maxScore,setMaxScore]=useState(0);
 const [selected,setSelected]=useState<number|null>(null);const [saving,setSaving]=useState(false);const [saveError,setSaveError]=useState(false);const [replay,setReplay]=useState(false);
 const [finish,setFinish]=useState<FinishData|null>(null);const bottom=useRef<HTMLDivElement>(null);const busy=useRef(false);
 const load=async()=>{setLoading(true);setError(false);try{
   const {data,error}=await supabase.from("education_scenarios").select("*").eq("id",scenarioId).single();if(error||!data)throw error||new Error("Story unavailable");
   const story={...data,characters:data.characters as unknown as Character[],scenes:data.scenes as unknown as Scene[]} as Scenario;
   if(!story.scenes.length)throw new Error("Empty story");setScenario(story);setSceneId(story.scenes[0].id);
   if(user){const {data:progress,error:pe}=await supabase.from("user_scenario_progress").select("*").eq("user_id",user.id).eq("scenario_id",scenarioId).maybeSingle();if(pe)throw pe;
    setReplay(!!progress?.completed);if(progress&&!progress.completed){setSceneId(progress.current_scene);setScore(progress.score);setMaxScore(progress.max_score);const history=(progress.choices_made||[]) as unknown as MadeChoice[];setChoices(history);
     setLines(history.flatMap(c=>{const scene=story.scenes.find(s=>s.id===c.sceneId);return scene?[...storyBubbles(scene.text).map(text=>({speaker:scene.narrator,text})),{speaker:"You",text:scene.choices[c.choiceIdx]?.text||"",reply:true}]:[];}));}
   }
 }catch(e){setError(true);void reportError(e instanceof Error?e:new Error("Story load failed"));}finally{setLoading(false);}};
 useEffect(()=>{void load();},[scenarioId,user?.id]);
 const scene=scenario?.scenes.find(s=>s.id===sceneId);const bubbles=storyBubbles(scene?.text||"");const allRevealed=revealed>=bubbles.length;
 const reveal=()=>{if(!scene||allRevealed||selected!==null)return;const text=bubbles[revealed];setLines(prev=>[...prev,{speaker:scene.narrator,text}]);setRevealed(n=>n+1);};
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:reduced?"instant":"smooth",block:"end"});},[lines,reduced]);
 const choose=(i:number)=>{if(!scene||selected!==null)return;setSelected(i);const choice=scene.choices[i];setLines(prev=>[...prev,{speaker:"You",text:choice.text,reply:true}]);};
 const advance=async()=>{
  if(!scene||!scenario||!user||busy.current)return;busy.current=true;setSaving(true);setSaveError(false);
  const choice=selected===null?undefined:scene.choices[selected];const next=choice?scenario.scenes.find(s=>s.id===choice.next_scene):undefined;
  const made=choice&&selected!==null?[...choices,{sceneId:scene.id,choiceIdx:selected,isBest:choice.is_best}]:choices;
  const nextScore=score+(choice?(choice.is_best?2:choice.points??(choice.feedback.toLowerCase().includes("okay")?1:0)):0);const nextMax=maxScore+(choice?2:0);
  try{
   // Replays never overwrite a previously completed progress row.
   if(!replay){const {error}=await supabase.from("user_scenario_progress").upsert({user_id:user.id,scenario_id:scenarioId,current_scene:next?.id||scene.id,choices_made:made as any,score:nextScore,max_score:nextMax,completed:!next,completed_at:next?null:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"user_id,scenario_id"});if(error)throw error;}
   setScore(nextScore);setMaxScore(nextMax);setChoices(made);setSelected(null);
   if(next){setSceneId(next.id);setRevealed(0);}
   else {const base:FinishData={kind:"story",moduleId:scenario.module_id,node:`story:${scenario.id}`,title:scenario.title,slug:"",tier:"",xp:replay?0:null,oldXP:stats?.total_xp||0,accuracy:nextMax?Math.round(nextScore/nextMax*100):0,questions:made.length,replay,saving:!replay,storySummary:{score:nextScore,maxScore:nextMax,choicesMade:made,scenes:scenario.scenes}};setFinish(base);
    if(!replay){const reward=async()=>{const xp=await awardRef.current(scenario.xp_reward,"scenario",scenario.id,true);setFinish(prev=>prev?{...prev,xp:xp.newXP,saving:false}:prev);};try{await reward();}catch(e){void reportError(e instanceof Error?e:new Error("Story reward failed"));retryFinish(`story:${user.id}:${scenario.id}`,reward);}}
   }
  }catch(e){setSaveError(true);void reportError(e instanceof Error?e:new Error("Story save failed"));}finally{busy.current=false;setSaving(false);}
 };
 if(loading)return <PageSkeleton variant="learn"/>;
 if(error||!scenario||!scene)return <BrandedEmptyState illustration={<GuideArt name="guide-encourage" size={160}/>} mascot="confused" headline="We couldn't load this story." description="" ctaLabel="Try again" onCtaClick={()=>void load()}/>;
 if(finish)return <Suspense fallback={<PageSkeleton variant="learn"/>}><FinishSequence data={finish} onBack={()=>{onComplete?.(score,finish.xp||0);onBack?.();}}/></Suspense>;
 const avatar=(name:string)=>{const index=scenario.characters.findIndex(c=>c.name===name);return <span aria-hidden className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${avatarTokens[Math.max(0,index)%avatarTokens.length]}`}>{name.split(" ").map(n=>n[0]).slice(0,2).join("")}</span>;};
 return <main className="min-h-[100dvh] bg-background flex flex-col">
  <header className="sticky top-0 z-10 bg-background border-b border-border p-4 pt-[max(16px,env(safe-area-inset-top))]"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Back to my path" onClick={onBack}><X/></Button><h1 className="font-bold flex-1">{scenario.title}</h1></div><div role="progressbar" aria-label="Story progress" aria-valuenow={choices.length} aria-valuemax={scenario.scenes.length} className="flex gap-1 h-2 mt-3">{scenario.scenes.map((s,i)=><span key={s.id} className={`flex-1 rounded-full ${i<choices.length?"bg-primary":"bg-muted"}`}/>)}</div></header>
  {!begun?<div className="flex-1 mx-auto max-w-[480px] w-full p-4 space-y-6"><h2 className="text-2xl font-bold">{scenario.title}</h2>{scenario.characters.map(c=><div key={c.name} className="flex gap-3 items-center">{avatar(c.name)}<div><p className="font-semibold">{c.name} · {c.pronouns}</p><p className="text-muted-foreground">{c.role}</p></div></div>)}<Button className="w-full min-h-[52px]" onClick={()=>{setBegun(true);reveal();}}>Begin</Button></div>:<div className="flex-1 w-full max-w-[480px] mx-auto p-4 pb-24 space-y-4">
   <div role="button" tabIndex={0} aria-label="Continue the story" onClick={reveal} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();reveal();}}} className="space-y-4 min-h-11">
    {lines.map((line,i)=><div key={i} className={`flex gap-2 ${line.reply?"justify-end":""}`}>{!line.reply&&avatar(line.speaker)}<div className={`max-w-[85%] rounded-lg p-3 ${line.reply?"bg-primary text-primary-foreground":"bg-card border border-border"}`}><p className="text-sm font-semibold">{line.speaker}</p><p className="leading-relaxed">{line.text}</p></div></div>)}<div ref={bottom}/>
   </div><p className="sr-only" aria-live="polite" aria-atomic="true">{lines[lines.length-1]?.speaker}: {lines[lines.length-1]?.text}</p>
   {!allRevealed&&<Button className="w-full min-h-[52px]" onClick={reveal}>Continue</Button>}
   {allRevealed&&scene.choices.slice(0,4).map((choice,i)=><Button key={i} variant="outline" className="w-full h-auto min-h-[52px] whitespace-normal justify-start text-left p-4" disabled={selected!==null||saving} onClick={()=>choose(i)}>{choice.text}</Button>)}
   {allRevealed&&!scene.choices.length&&<Button className="w-full min-h-[52px]" disabled={saving} onClick={()=>void advance()}>Finish story</Button>}
   {saveError&&<p role="alert">We're still saving your progress. <Button variant="link" onClick={()=>void advance()}>Try again</Button></p>}
  </div>}
  <BottomSheet open={selected!==null} onOpenChange={()=>{}} dismissible={false} tone={selected!==null&&scene.choices[selected]?.is_best?"success":"miss"} title={selected!==null&&scene.choices[selected]?.is_best?"A caring approach":"Here's another way to see it"}><p aria-live="polite" className="mb-4 leading-relaxed">{selected!==null?scene.choices[selected]?.feedback:""}</p>{saveError&&<p role="alert">We're still saving your progress</p>}<Button className="w-full min-h-[52px]" disabled={saving} onClick={()=>void advance()}>{saveError?"Try again":"Continue"}</Button></BottomSheet>
 </main>;
};
