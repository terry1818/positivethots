import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PathIcon } from "./pathIcons";

export function LearnTabs({ practice = false }: { practice?: boolean }) {
  const navigate = useNavigate();
  return <div className="mx-auto w-full max-w-[480px] px-4 py-3"><Tabs value={practice ? "practice" : "path"} onValueChange={value => navigate(value === "practice" ? "/learn/practice" : "/learn")}>
    <TabsList className="learn-segment w-full min-h-[52px]" aria-label="Learning views">
      <TabsTrigger className="min-h-11 flex-1 gap-2" value="path"><PathIcon kind="lesson"/>Path</TabsTrigger>
      <TabsTrigger className="min-h-11 flex-1 gap-2" value="practice"><PathIcon kind="practice"/>Practice</TabsTrigger>
    </TabsList>
  </Tabs></div>;
}