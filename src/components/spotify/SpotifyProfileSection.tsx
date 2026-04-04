import { useState, useRef } from "react";
import { useSpotifyProfile, calculateMusicMatch, type SpotifyArtist, type SpotifyTrack } from "@/hooks/useSpotify";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Music } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SpotifyProfileSectionProps {
  userId: string;
}

export const SpotifyProfileSection = ({ userId }: SpotifyProfileSectionProps) => {
  const { user } = useAuth();
  const { data: spotifyData, isLoading } = useSpotifyProfile(userId);
  const { data: mySpotifyData } = useSpotifyProfile(user?.id || "");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!spotifyData) return null;

  const { anthem_track, top_artists } = spotifyData;

  const musicMatch = mySpotifyData && userId !== user?.id
    ? calculateMusicMatch(mySpotifyData.top_artists, top_artists)
    : null;

  const togglePreview = () => {
    if (!anthem_track?.preview_url) return;
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(anthem_track.preview_url);
        audioRef.current.addEventListener("ended", () => setPlaying(false));
      }
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* My Anthem */}
      {anthem_track && (
        <Card className="border-[#1DB954]/30 bg-[#1DB954]/5">
          <CardContent className="p-3 flex items-center gap-3">
            {anthem_track.album_art_url ? (
              <img
                src={anthem_track.album_art_url}
                alt={`${anthem_track.name} album art`}
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#1DB954]/20 flex items-center justify-center shrink-0">
                <Music className="h-6 w-6 text-[#1DB954]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1DB954] uppercase tracking-wide">My Anthem</p>
              <p className="font-semibold text-sm truncate">{anthem_track.name}</p>
              <p className="text-xs text-muted-foreground truncate">{anthem_track.artist}</p>
            </div>
            {anthem_track.preview_url && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-10 w-10 rounded-full bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954]"
                onClick={togglePreview}
                aria-label={playing ? "Pause preview" : "Play preview"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Artists */}
      {top_artists.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Top Artists</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {top_artists.slice(0, 5).map((artist, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0 w-16">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Music className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs text-center truncate w-full">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Music Match */}
      {musicMatch !== null && musicMatch > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1DB954]/10">
          <span className="text-sm">🎵</span>
          <span className="text-sm font-medium text-[#1DB954]">Music Match: {musicMatch}%</span>
        </div>
      )}
    </div>
  );
};
