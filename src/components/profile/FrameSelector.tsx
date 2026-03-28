import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";
import { FRAME_DEFINITIONS, type FrameId, ProfileFrame } from "./ProfileFrame";
import { toast } from "sonner";

interface FrameSelectorProps {
  earnedFrames: string[];
  selectedFrame: string;
  onSelect: (frameId: string) => void;
  profileImage?: string | null;
}

export const FrameSelector = memo(({ earnedFrames, selectedFrame, onSelect, profileImage }: FrameSelectorProps) => {
  const earned = new Set(earnedFrames);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile Frame</CardTitle>
        <p className="text-xs text-muted-foreground">Choose a decorative border for your profile photo</p>
      </CardHeader>
      <CardContent>
        {/* Preview */}
        <div className="flex justify-center mb-4">
          <ProfileFrame frameId={selectedFrame} size="xl">
            {profileImage ? (
              <img src={profileImage} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center text-2xl">?</div>
            )}
          </ProfileFrame>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2">
          {FRAME_DEFINITIONS.map((frame) => {
            const isEarned = earned.has(frame.id);
            const isSelected = selectedFrame === frame.id;

            return (
              <button
                key={frame.id}
                onClick={() => {
                  if (!isEarned) {
                    toast(`${frame.unlockRequirement} to unlock this frame`, { icon: "🔒" });
                    return;
                  }
                  onSelect(frame.id);
                }}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center",
                  isSelected && isEarned && "border-primary bg-primary/5 ring-1 ring-primary",
                  isEarned && !isSelected && "border-border hover:border-primary/50 hover:bg-primary/5",
                  !isEarned && "border-border/50 opacity-50 cursor-not-allowed"
                )}
              >
                <div className="relative">
                  <ProfileFrame frameId={frame.id} size="sm">
                    <div className="h-full w-full bg-muted rounded-full" />
                  </ProfileFrame>
                  {!isEarned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  {isSelected && isEarned && (
                    <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium text-foreground leading-tight">{frame.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

FrameSelector.displayName = "FrameSelector";
