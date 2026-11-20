import { GuideArt } from "@/components/mascot/GuideArt";
import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {ScenarioPlayer} from "@/components/education/scenarios/ScenarioPlayer";
import {PageSkeleton} from "@/components/PageSkeleton";
import {BrandedEmptyState} from "@/components/BrandedEmptyState";
import {reportError} from "@/lib/errorReporting";
export default function LearnStory(){
 const {slug,scenarioSlug}=useParams();const navigate=useNavigate();const [story,setStory]=useState<{id:string;module_id:string}|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
 const load=async()=>{setLoading(true);setError(false);try{const {data:module,error:me}=await supabase.from("education_modules").select("id").eq("slug",slug||"").single();if(me||!module)throw me;const {data,error}=await supabase.from("education_scenarios").select("id,module_id").eq("module_id",module.id).eq("scenario_slug",scenarioSlug||"").single();if(error||!data)throw error;setStory(data);}catch(e){setError(true);void reportError(e instanceof Error?e:new Error("Story not found"));}finally{setLoading(false);}};
 useEffect(()=>{void load();},[slug,scenarioSlug]);
 if(loading)return <PageSkeleton variant="learn"/>;
 if(error||!story)return <BrandedEmptyState illustration={<GuideArt name="guide-encourage" size={160}/>} mascot="confused" headline="We couldn't load this story." description="" ctaLabel="Try again" onCtaClick={()=>void load()}/>;
 return <ScenarioPlayer scenarioId={story.id} onBack={()=>navigate("/learn",{state:{justCompleted:{moduleId:story.module_id,node:`story:${story.id}`}}})}/>;
}