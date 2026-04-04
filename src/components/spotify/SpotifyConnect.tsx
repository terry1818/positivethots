import { useSpotify } from "@/hooks/useSpotify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Music, RefreshCw, Unlink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const SpotifyConnect = () => {
  const { connection, isLoading, isConnected, toggleVisibility, disconnect } = useSpotify();

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
      </Card>
    );
  }

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      toast.success("Spotify disconnected");
    } catch {
      toast.error("Failed to disconnect Spotify");
    }
  };

  const handleConnect = () => {
    toast.info("Spotify integration requires API keys to be configured. Contact the admin to set up Spotify OAuth.");
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Music className="h-5 w-5 text-[#1DB954]" />
          Spotify
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1DB954]/10 px-3 py-1 text-sm font-medium text-[#1DB954]">
                <Music className="h-3.5 w-3.5" /> Connected
              </span>
              {connection?.last_synced_at && (
                <span className="text-xs text-muted-foreground">
                  Synced {new Date(connection.last_synced_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Show on profile</Label>
              <Switch
                checked={connection?.show_on_profile ?? true}
                onCheckedChange={(val) => toggleVisibility.mutate(val)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleConnect}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Sync
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={handleDisconnect}>
                <Unlink className="h-3.5 w-3.5 mr-1" /> Disconnect
              </Button>
            </div>
          </>
        ) : (
          <Button
            className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            onClick={handleConnect}
          >
            <Music className="h-4 w-4 mr-2" /> Connect Spotify
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Show off your musical taste — your top artists and anthem appear on your profile.
        </p>
      </CardContent>
    </Card>
  );
};
