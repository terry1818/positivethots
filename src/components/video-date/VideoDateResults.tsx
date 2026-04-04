import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Calendar, Heart, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchResult {
  userId: string;
  name: string;
  profileImage?: string;
}

interface VideoDateResultsProps {
  matches: MatchResult[];
  roundsCompleted: number;
  totalTime: number;
  onClose: () => void;
}

export const VideoDateResults = ({
  matches,
  roundsCompleted,
  totalTime,
  onClose,
}: VideoDateResultsProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {matches.length > 0 ? (
            <>
              <div className="text-5xl mb-2">🎉</div>
              <h1 className="text-2xl font-bold">You Both Said Yes!</h1>
              <p className="text-muted-foreground">
                You connected with {matches.length} {matches.length === 1 ? "person" : "people"}!
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-2">💜</div>
              <h1 className="text-2xl font-bold">Great Effort!</h1>
              <p className="text-muted-foreground">
                No mutual connections this time, but great conversations!
              </p>
            </>
          )}
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{roundsCompleted}</p>
                <p className="text-xs text-muted-foreground">Rounds</p>
              </div>
              <div>
                <Heart className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{matches.length}</p>
                <p className="text-xs text-muted-foreground">Connections</p>
              </div>
              <div>
                <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{totalTime}m</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches */}
        {matches.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Your Connections</h3>
            {matches.map(match => (
              <Card key={match.userId}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    {match.profileImage ? (
                      <img src={match.profileImage} alt={match.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Heart className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="flex-1 font-medium text-sm">{match.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/messages")}
                    className="min-h-[36px]"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> Chat
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button className="w-full min-h-[44px]" onClick={onClose}>
            Back to Discovery
          </Button>
        </div>
      </div>
    </div>
  );
};
