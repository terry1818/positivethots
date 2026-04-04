import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SpotifyArtist {
  name: string;
  image_url: string;
  genres: string[];
}

export interface SpotifyTrack {
  name: string;
  artist: string;
  album_art_url: string;
  preview_url: string | null;
  spotify_url: string;
}

export interface SpotifyConnection {
  id: string;
  spotify_user_id: string | null;
  top_artists: SpotifyArtist[];
  top_tracks: SpotifyTrack[];
  anthem_track: SpotifyTrack | null;
  show_on_profile: boolean;
  last_synced_at: string | null;
}

export const useSpotify = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: connection, isLoading } = useQuery({
    queryKey: ["spotify-connection", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("spotify_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        spotify_user_id: data.spotify_user_id,
        top_artists: (data.top_artists || []) as unknown as SpotifyArtist[],
        top_tracks: (data.top_tracks || []) as unknown as SpotifyTrack[],
        anthem_track: data.anthem_track as unknown as SpotifyTrack | null,
        show_on_profile: data.show_on_profile,
        last_synced_at: data.last_synced_at,
      } as SpotifyConnection;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const setAnthem = useMutation({
    mutationFn: async (track: SpotifyTrack | null) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("spotify_connections")
        .update({ anthem_track: track as any })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spotify-connection"] }),
  });

  const toggleVisibility = useMutation({
    mutationFn: async (show: boolean) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("spotify_connections")
        .update({ show_on_profile: show })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spotify-connection"] }),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("spotify_connections")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spotify-connection"] }),
  });

  return {
    connection,
    isLoading,
    isConnected: !!connection,
    setAnthem,
    toggleVisibility,
    disconnect,
  };
};

export const useSpotifyProfile = (userId: string) => {
  return useQuery({
    queryKey: ["spotify-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spotify_connections")
        .select("top_artists, top_tracks, anthem_track, show_on_profile")
        .eq("user_id", userId)
        .eq("show_on_profile", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        top_artists: (data.top_artists || []) as unknown as SpotifyArtist[],
        top_tracks: (data.top_tracks || []) as unknown as SpotifyTrack[],
        anthem_track: data.anthem_track as unknown as SpotifyTrack | null,
      };
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
};

export const calculateMusicMatch = (
  artistsA: SpotifyArtist[],
  artistsB: SpotifyArtist[]
): number => {
  if (!artistsA.length || !artistsB.length) return 0;

  const namesA = new Set(artistsA.map(a => a.name.toLowerCase()));
  const namesB = new Set(artistsB.map(a => a.name.toLowerCase()));
  const sharedArtists = [...namesA].filter(n => namesB.has(n)).length;

  const genresA = new Set(artistsA.flatMap(a => a.genres.map(g => g.toLowerCase())));
  const genresB = new Set(artistsB.flatMap(a => a.genres.map(g => g.toLowerCase())));
  const sharedGenres = [...genresA].filter(g => genresB.has(g)).length;
  const totalGenres = new Set([...genresA, ...genresB]).size;

  const artistScore = namesA.size > 0 ? (sharedArtists / Math.max(namesA.size, namesB.size)) * 100 : 0;
  const genreScore = totalGenres > 0 ? (sharedGenres / totalGenres) * 100 : 0;

  return Math.min(Math.round(artistScore * 0.6 + genreScore * 0.4), 100);
};
