import { useIncognito } from "@/hooks/useIncognito";
import { Ghost } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export const IncognitoIndicator = () => {
  const { isIncognito, toggleIncognito } = useIncognito();

  if (!isIncognito) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            onClick={() => toggleIncognito.mutate(false)}
            aria-label="Incognito mode active — tap to disable"
          >
            <Ghost className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          Incognito Active — Hidden from Discovery. Tap to disable.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
