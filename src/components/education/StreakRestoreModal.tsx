import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Zap } from "lucide-react";

interface StreakRestoreModalProps {
  open: boolean;
  streakCount: number;
  currentXP: number;
  onRestore: () => void;
  onDismiss: () => void;
}

export const StreakRestoreModal = ({ open, streakCount, currentXP, onRestore, onDismiss }: StreakRestoreModalProps) => {
  const canAfford = currentXP >= 100;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-xl">Restore Your Streak?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex justify-center">
            <div className="relative">
              <Flame className="h-16 w-16 text-muted-foreground/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">💔</span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Your <span className="font-bold text-foreground">{streakCount}-day streak</span> was broken!
            Restore it before it's too late.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>Cost: <span className="font-bold text-primary">100 XP</span></span>
            <span className="text-muted-foreground">(You have {currentXP} XP)</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onDismiss} className="flex-1">
              Let it go
            </Button>
            <Button onClick={onRestore} disabled={!canAfford} className="flex-1">
              🔥 Restore Streak
            </Button>
          </div>
          {!canAfford && (
            <p className="text-sm text-destructive">Not enough XP to restore</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
