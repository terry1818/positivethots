import {useEffect,useState} from "react";
import {m} from "motion/react";
import {Loader2} from "lucide-react";
import {BottomSheet} from "@/components/motion/BottomSheet";
import {Button} from "@/components/ui/button";
import {Mascot} from "@/components/mascot/Mascot";
import {supabase} from "@/integrations/supabase/client";
import {useReducedMotion} from "@/hooks/useReducedMotion";
import {chestOpenDuration} from "@/lib/motionTokens";
import {ChestArt, PathIcon} from "./pathIcons";
import {useSoundEffects} from "@/hooks/useSoundEffects";
import {reportError} from "@/lib/errorReporting";
export default function PathChest({moduleId,onClose,onClaim}:{moduleId:string;onClose:()=>void;onClaim:()=>void}){
 const [reward,setReward]=useState<{reward_type:string;reward_value:number}|null>(null);const [error,setError]=useState(false);const reduced=useReducedMotion();
 const {playChestOpen}=useSoundEffects();
 useEffect(()=>{if(reward)playChestOpen();},[reward,playChestOpen]);
 const claim=async()=>{setError(false);try{const {data,error}=await supabase.rpc("claim_path_chest",{_module_id:moduleId});if(error)throw error;setReward(data as unknown as {reward_type:string;reward_value:number});onClaim();}catch(e){setError(true);void reportError(e instanceof Error?e:new Error("Chest claim failed"));}};
 useEffect(()=>{void claim();},[moduleId]);
 return <BottomSheet open onOpenChange={open=>{if(!open)onClose();}} title="Your chest"><div className="text-center space-y-4"><div aria-hidden className="relative w-20 h-20 mx-auto text-accent"><m.div initial={false} animate={{opacity:reward?1:0,scale:reduced?1:reward?1.2:1}} transition={{duration:chestOpenDuration}} className="absolute inset-0 rounded-full bg-accent/10"/><m.div initial={false} animate={{y:reduced?0:reward?-8:0,rotate:reduced?0:reward?-8:0}} transition={{duration:chestOpenDuration}} className="relative"><ChestArt open={!!reward} reduced={reduced}/>{reward&&!reduced&&[0,1,2].map(i=><m.span key={i} className="absolute left-8 top-4 text-accent" initial={{y:0,opacity:1}} animate={{y:-48,x:(i-1)*24,opacity:0}} transition={{duration:.6,delay:i*.1}}><PathIcon kind="star"/></m.span>)}</m.div></div><Mascot mood="heart" size="md"/>{reward?<p role="status" className="text-2xl font-bold">{reward.reward_type==="xp"?`+${reward.reward_value} XP`:"Streak freeze +1"}</p>:error?<p role="alert">We couldn't open your chest.</p>:<p role="status" className="flex justify-center items-center gap-2"><Loader2 className={reduced?"h-4 w-4":"h-4 w-4 animate-spin"}/>Opening your chest…</p>}<Button className="w-full min-h-[52px]" onClick={error?()=>void claim():onClose} disabled={!reward&&!error}>{error?"Try again":"Nice"}</Button></div></BottomSheet>;
}