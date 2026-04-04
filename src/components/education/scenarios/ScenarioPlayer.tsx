import { useState, useEffect, useCallback, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";
import { cn } from "@/lib/utils";
import { ArrowLeft, Star, ChevronRight } from "lucide-react";
import { ScenarioSummary } from "./ScenarioSummary";

interface Character {
  name: string;
  avatar?: string;
  pronouns: string;
  role: string;
}

interface Choice {
  text: string;
  next_scene: string;
  is_best: boolean;
  feedback: string;
  points?: number;
}

interface Scene {
  id: string;
  narrator: string;
  text: string;
  choices: Choice[];
}

interface Scenario {
  id: string;
  title: string;
  characters: Character[];
  scenes: Scene[];
  xp_reward: number;
  difficulty_level: number;
  module_id: string;
}

interface ScenarioPlayerProps {
  scenarioId: string;
  onComplete?: (score: number, xpEarned: number) => void;
  onBack?: () => void;
}

const AVATAR_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-pink-600 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white",
  "bg-cyan-600 text-white",
];

function getCharacterColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

export const ScenarioPlayer = ({ scenarioId, onComplete, onBack }: ScenarioPlayerProps) => {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [currentSceneId, setCurrentSceneId] = useState("scene_1");
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [choicesMade, setChoicesMade] = useState<{ sceneId: string; choiceIdx: number; isBest: boolean }[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [visitedScenes, setVisitedScenes] = useState<string[]>([]);

  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load scenario
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(false);
      const { data, error: err } = await supabase
        .from("education_scenarios")
        .select("*")
        .eq("id", scenarioId)
        .single();

      if (err || !data) {
        setError(true);
        setLoading(false);
        return;
      }

      const s: Scenario = {
        id: data.id,
        title: data.title,
        characters: data.characters as unknown as Character[],
        scenes: data.scenes as unknown as Scene[],
        xp_reward: data.xp_reward,
        difficulty_level: data.difficulty_level,
        module_id: data.module_id,
      };
      setScenario(s);

      // Load existing progress
      if (user) {
        const { data: prog } = await supabase
          .from("user_scenario_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("scenario_id", scenarioId)
          .maybeSingle();

        if (prog && !prog.completed) {
          setCurrentSceneId(prog.current_scene);
          setScore(prog.score);
          setMaxScore(prog.max_score);
          setChoicesMade((prog.choices_made as any[]) || []);
        }
      }

      setLoading(false);
    };
    load();
  }, [scenarioId, user]);

  const currentScene = scenario?.scenes.find((s) => s.id === currentSceneId);
  const sceneIndex = scenario?.scenes.findIndex((s) => s.id === currentSceneId) ?? 0;
  const totalScenes = scenario?.scenes.length ?? 1;
  const progressPercent = ((visitedScenes.length) / totalScenes) * 100;

  // Typewriter effect
  useEffect(() => {
    if (!currentScene) return;
    const text = currentScene.text;
    setDisplayedText("");
    setTypewriterDone(false);
    setSelectedChoice(null);
    setShowFeedback(false);

    if (reducedMotion) {
      setDisplayedText(text);
      setTypewriterDone(true);
      return;
    }

    let i = 0;
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        setTypewriterDone(true);
        if (typewriterRef.current) clearInterval(typewriterRef.current);
      }
    }, 30);

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, [currentSceneId, currentScene, reducedMotion]);

  const skipTypewriter = useCallback(() => {
    if (typewriterDone || !currentScene) return;
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    setDisplayedText(currentScene.text);
    setTypewriterDone(true);
  }, [typewriterDone, currentScene]);

  const handleChoice = (idx: number) => {
    if (showFeedback || !currentScene) return;
    setSelectedChoice(idx);
    setTimeout(() => setShowFeedback(true), reducedMotion ? 0 : 300);

    const choice = currentScene.choices[idx];
    const points = choice.is_best ? 2 : choice.points ?? (choice.feedback.toLowerCase().includes("okay") ? 1 : 0);
    setScore((s) => s + points);
    setMaxScore((s) => s + 2);
    setChoicesMade((prev) => [...prev, { sceneId: currentSceneId, choiceIdx: idx, isBest: choice.is_best }]);
  };

  const advanceScene = async () => {
    if (!currentScene || selectedChoice === null) return;
    const choice = currentScene.choices[selectedChoice];
    const nextId = choice.next_scene;
    const nextScene = scenario?.scenes.find((s) => s.id === nextId);

    setVisitedScenes((prev) => [...prev, currentSceneId]);

    if (!nextScene) {
      // End of scenario
      setCompleted(true);
      if (user) {
        await supabase.from("user_scenario_progress").upsert({
          user_id: user.id,
          scenario_id: scenarioId,
          current_scene: currentSceneId,
          choices_made: choicesMade as any,
          score,
          max_score: maxScore,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,scenario_id" });
      }
      return;
    }

    setCurrentSceneId(nextId);

    // Save progress
    if (user) {
      await supabase.from("user_scenario_progress").upsert({
        user_id: user.id,
        scenario_id: scenarioId,
        current_scene: nextId,
        choices_made: choicesMade as any,
        score,
        max_score: maxScore,
        completed: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,scenario_id" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <BrandedEmptyState
        mascot="confused"
        headline="Couldn't load scenario"
        description="Something went wrong. Please try again."
        ctaLabel="Go Back"
        onCtaClick={onBack}
      />
    );
  }

  if (completed) {
    return (
      <ScenarioSummary
        title={scenario.title}
        score={score}
        maxScore={maxScore}
        xpReward={scenario.xp_reward}
        choicesMade={choicesMade}
        scenes={scenario.scenes}
        onContinue={() => onComplete?.(score, scenario.xp_reward)}
        onBack={onBack}
      />
    );
  }

  if (!currentScene) {
    return (
      <BrandedEmptyState
        mascot="confused"
        headline="Scene not found"
        description="This scenario may be incomplete."
        ctaLabel="Go Back"
        onCtaClick={onBack}
      />
    );
  }

  const narrator = scenario.characters.find((c) => c.name === currentScene.narrator);
  const narratorIdx = scenario.characters.findIndex((c) => c.name === currentScene.narrator);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-3 pb-2 space-y-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {scenario.title}
          </span>
          <div className="flex items-center gap-1 text-sm text-amber-400">
            <Star className="h-4 w-4 fill-amber-400" />
            <span>{score}</span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Scene content */}
      <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Character card */}
        {narrator && (
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0",
              getCharacterColor(narratorIdx)
            )}>
              {narrator.name[0]}
            </div>
            <div>
              <div className="font-semibold text-foreground">{narrator.name}</div>
              <div className="text-sm text-muted-foreground">{narrator.pronouns} · {narrator.role}</div>
            </div>
          </div>
        )}

        {/* Scene text */}
        <div
          className="rounded-xl p-4 bg-card border border-border min-h-[120px] cursor-pointer"
          onClick={skipTypewriter}
          role="button"
          aria-label="Tap to skip animation"
        >
          <p className="text-foreground leading-relaxed whitespace-pre-line">
            {displayedText}
            {!typewriterDone && <span className="animate-pulse text-primary">|</span>}
          </p>
        </div>

        {/* Choices */}
        {typewriterDone && (
          <div className="space-y-3">
            {currentScene.choices.map((choice, idx) => {
              const isSelected = selectedChoice === idx;
              const isBest = choice.is_best;
              const showResult = showFeedback;

              return (
                <button
                  key={idx}
                  onClick={() => handleChoice(idx)}
                  disabled={showFeedback}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all min-h-[44px]",
                    !showResult && !isSelected && "border-border bg-card hover:border-primary/50",
                    !showResult && isSelected && "border-primary bg-primary/10",
                    showResult && isSelected && isBest && "border-green-500 bg-green-500/10",
                    showResult && isSelected && !isBest && "border-amber-500 bg-amber-500/10",
                    showResult && !isSelected && isBest && "border-green-500/50 bg-green-500/5",
                    showResult && !isSelected && !isBest && "border-border/50 opacity-50",
                    !reducedMotion && showResult && isSelected && !isBest && "animate-shake"
                  )}
                >
                  <span className="text-foreground">{choice.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback */}
        {showFeedback && selectedChoice !== null && (
          <div className={cn(
            "rounded-xl p-4 border",
            currentScene.choices[selectedChoice].is_best
              ? "bg-green-500/10 border-green-500/30"
              : "bg-amber-500/10 border-amber-500/30",
            !reducedMotion && "animate-fade-in"
          )}>
            <p className="text-sm font-semibold mb-1">
              {currentScene.choices[selectedChoice].is_best ? "✓ Great approach!" : "💡 Not quite the best"}
            </p>
            <p className="text-sm text-muted-foreground">{currentScene.choices[selectedChoice].feedback}</p>
          </div>
        )}

        {/* Continue */}
        {showFeedback && (
          <Button onClick={advanceScene} className="w-full rounded-xl" size="lg">
            Continue <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
