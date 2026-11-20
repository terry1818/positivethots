import {useEffect,useRef,useState} from "react";
import {useReadAloud} from "@/hooks/useReadAloud";
import {Button} from "@/components/ui/button";
import {GuideArt} from "@/components/mascot/GuideArt";
import {Play,Pause,Loader2} from "lucide-react";
export default function ListenRecap({title,takeaways,onComplete}:{title:string;takeaways:string[];onComplete:()=>void}){
 const [index,setIndex]=useState(0);const [fallback,setFallback]=useState(false);const [done,setDone]=useState(false);const next=useRef<()=>void>(()=>{});
 const audio=useReadAloud(()=>next.current(),()=>setFallback(true));
 next.current=()=>{if(index+1>=takeaways.length){setDone(true);audio.stop();}else{setIndex(index+1);void audio.play(takeaways[index+1]);}};
 useEffect(()=>()=>audio.stop(),[]);
 return <div className="space-y-6 text-center"><GuideArt name="guide-listen-headphones" size={160}/><h1 className="text-2xl font-bold">{title}</h1><h2 className="text-xl">Listen: key ideas</h2>
  {!fallback&&<><Button size="icon" className="h-16 w-16 rounded-full" aria-pressed={audio.isPlaying} aria-label={audio.isPlaying?"Pause":"Play"} disabled={audio.isLoading||done} onClick={()=>{if(audio.isPlaying)audio.pause();else if(audio.isPaused)audio.resume();else void audio.play(takeaways[index]);}}>{audio.isLoading?<Loader2 className="animate-spin"/>:audio.isPlaying?<Pause/>:<Play/>}</Button><div role="group" aria-label="Playback speed" className="flex justify-center gap-2">{[1,1.25].map(rate=><Button key={rate} variant={audio.rate===rate?"default":"outline"} aria-pressed={audio.rate===rate} className="min-h-11" onClick={()=>audio.setRate(rate)}>{rate}x</Button>)}</div></>}
  <div role="progressbar" aria-label="Key ideas" aria-valuenow={done?takeaways.length:index} aria-valuemax={takeaways.length} className="flex h-2 gap-1">{takeaways.map((_,i)=><span key={i} className={`flex-1 rounded-full ${i<index||done?"bg-primary":"bg-muted"}`}/>)}</div>
  <p aria-live="polite" className="text-base leading-relaxed">{takeaways[index]}</p>
  {fallback?takeaways.map((text,i)=><Button key={i} variant="outline" className="w-full h-auto min-h-[52px] whitespace-normal text-left p-4" onClick={()=>{setIndex(i);if(i===takeaways.length-1)setDone(true);}}>{text}</Button>):<Button variant="ghost" className="min-h-11" onClick={()=>{audio.stop();setFallback(true);}}>Read key ideas</Button>}
  {(done||fallback)&&<Button className="w-full min-h-[52px]" onClick={()=>{audio.stop();onComplete();}}>Continue to questions</Button>}
 </div>;
}