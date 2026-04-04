import { useIncognito } from "@/hooks/useIncognito";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, Ghost } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const IncognitoToggle = () => {
  const { isIncognito, toggleIncognito, isPremium, isLoading } = useIncognito();
  const navigate = useNavigate();

  const handleToggle = (enabled: boolean) => {
    if (!isPremium) {
      navigate("/premium");
      return;
    }
    toggleIncognito.mutate(enabled);
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Ghost className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Label className="font-medium text-sm">Incognito Mode</Label>
                {!isPremium && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Crown className="h-3 w-3" /> Premium
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isIncognito
                  ? "You're invisible 👻 Matches & partners can still see you."
                  : "Hide from Discovery. Matches & partners still see you."}
              </p>
            </div>
          </div>
          <Switch
            checked={isIncognito}
            onCheckedChange={handleToggle}
            disabled={isLoading || toggleIncognito.isPending}
            aria-label="Toggle incognito mode"
          />
        </div>
      </CardContent>
    </Card>
  );
};
